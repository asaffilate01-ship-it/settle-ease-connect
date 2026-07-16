/**
 * Live DOM auto-translator.
 *
 * Design:
 * - We store the ORIGINAL text/attr value plus the language we last stamped
 *   in in-memory WeakMaps. NO `data-*` attributes are ever written to the
 *   DOM — that would cause SSR/CSR hydration mismatches.
 * - Translations are cached per (lang, source) pair in localStorage so
 *   repeat visits are instant and free.
 * - The first pass is deferred until after React hydration commits.
 * - Elements can opt out with `data-no-translate`.
 */
import { translateBatch } from "./translate.functions";

const CACHE_PREFIX = "bs.t.v3.";
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "KBD", "SAMP",
  "TEXTAREA", "INPUT", "SELECT", "OPTION", "SVG", "PATH",
]);
const SKIP_ATTR = "data-no-translate";

let currentLang: string = "en";
let bootedOnce = false;
let inFlight: Promise<void> | null = null;
let scheduled = false;
let mutating = false;
let hydrated = false;
let gateTimer: number | undefined;
let rerunAfterInFlight = false;
// True only while an explicit language switch is in progress. Silent
// background reruns (route changes, dropdowns, popovers) must not gate
// the body — that caused a "half-translated flash" on every mutation.
let gateActive = false;

// Per text-node state: original source text + last language we applied.
const textState = new WeakMap<Text, { src: string; srcLang: string; lang: string }>();
// Per element+attr state.
const attrState = new WeakMap<Element, Map<string, { src: string; srcLang: string; lang: string }>>();

const langNames: Record<string, string> = {
  en: "English", de: "German", tr: "Turkish", ur: "Urdu", hi: "Hindi",
  pa: "Punjabi", ps: "Pashto", ar: "Arabic", ku: "Kurdish (Kurmanji)",
  ru: "Russian", uk: "Ukrainian", fa: "Persian (Farsi)", pl: "Polish",
  zh: "Simplified Chinese",
};

function looksLike(text: string, lang: string): boolean {
  const t = text.toLowerCase();
  const enScore = (t.match(/\b(the|and|or|not|with|for|from|is|are|we|you|your|they|their|a|an|to|of|on|in|about|after|before|already|also|any|when|then|so|every|germany|english|open|report|active|soon|plan|case|manager|dashboard|booked|ready|sign|find|speaking|compliance|response|languages|trust|cover|group|partners|offline)\b/g) ?? []).length;
  const deScore = (t.match(/\b(der|die|das|und|oder|nicht|mit|für|von|zum|zur|ist|sind|wir|sie|ihre|eine|einen|einer|dem|den|auf|über|unter|nach|beim|schon|noch|auch|kein|keine|wenn|dann|damit|jede|jeden|jedes|deutschland|deutsch|bereit|öffnen|melden|fallmanager|konto|entwurf|unterschrift)\b/g) ?? []).length + (/[äöüß]/.test(t) && enScore === 0 ? 2 : 0);
  if (lang === "de") {
    return deScore > enScore && deScore > 0;
  }
  if (lang === "en") {
    return enScore >= deScore && enScore > 0;
  }
  return false;
}

function shouldSkip(el: Element | null): boolean {
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute?.(SKIP_ATTR)) return true;
    el = el.parentElement;
  }
  return false;
}

function cacheGet(lang: string, src: string): string | null {
  try { return localStorage.getItem(CACHE_PREFIX + lang + ":" + hash(src)); } catch { return null; }
}
function cacheSet(lang: string, src: string, translated: string) {
  try { localStorage.setItem(CACHE_PREFIX + lang + ":" + hash(src), translated); } catch { /* quota */ }
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const ATTR_LIST = ["alt", "title", "aria-label", "placeholder"] as const;

function clearLanguageGate(expectedLang?: string) {
  if (typeof document === "undefined") return;
  if (expectedLang && currentLang !== expectedLang) return;
  if (gateTimer) {
    window.clearTimeout(gateTimer);
    gateTimer = undefined;
  }
  gateActive = false;
  document.documentElement.removeAttribute("data-lang-pending");
  document.documentElement.removeAttribute("data-lang-switching");
  document.querySelector("style[data-lang-gate]")?.remove();
}

function ensureLanguageGate() {
  if (typeof document === "undefined") return;
  gateActive = true;
  document.documentElement.setAttribute("data-lang-switching", currentLang);
  if (!document.querySelector("style[data-lang-gate]")) {
    const style = document.createElement("style");
    style.setAttribute("data-lang-gate", "");
    style.textContent =
      "html[data-lang-pending] body,html[data-lang-switching] body{visibility:hidden!important}";
    document.head.appendChild(style);
  }
  if (gateTimer) window.clearTimeout(gateTimer);
  gateTimer = window.setTimeout(() => clearLanguageGate(currentLang), 4500);
}

function collectTextNodes(): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const t = node.nodeValue;
      if (!t) return NodeFilter.FILTER_REJECT;
      const trimmed = t.trim();
      if (trimmed.length < 2) return NodeFilter.FILTER_REJECT;
      if (/^[\d\s.,:/\-–—+%€$£¥]+$/.test(trimmed)) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(node.parentElement)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

type AttrPending = { el: Element; attr: string; src: string };

async function translatePage() {
  if (typeof window === "undefined") return;
  const nodes = collectTextNodes();
  const pending: { node: Text; src: string }[] = [];
  const attrPending: AttrPending[] = [];

  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent) continue;
    const text = node.nodeValue?.trim();
    if (!text) continue;

    let state = textState.get(node);
    if (!state) {
      const detected = looksLike(text, "de") ? "de" : looksLike(text, "en") ? "en" : "en";
      state = { src: text, srcLang: detected, lang: detected };
      textState.set(node, state);
    }

    const cached = cacheGet(currentLang, state.src);
    if (cached) {
      if (node.nodeValue !== cached) {
        mutating = true;
        node.nodeValue = cached;
        mutating = false;
      }
      state.lang = currentLang;
      continue;
    }
    if (state.srcLang === currentLang) {
      // Ensure DOM shows source
      if (node.nodeValue !== state.src) {
        mutating = true;
        node.nodeValue = state.src;
        mutating = false;
      }
      state.lang = currentLang;
      continue;
    }
    if (looksLike(state.src, currentLang)) {
      state.lang = currentLang;
      continue;
    }
    pending.push({ node, src: state.src });
  }

  // Attributes
  const sel = ATTR_LIST.map((a) => `[${a}]`).join(",");
  document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
    if (shouldSkip(el)) return;
    let map = attrState.get(el);
    for (const attr of ATTR_LIST) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      const trimmed = val.trim();
      if (trimmed.length < 2) continue;
      if (/^[\d\s.,:/\-–—+%€$£¥]+$/.test(trimmed)) continue;

      if (!map) { map = new Map(); attrState.set(el, map); }
      let s = map.get(attr);
      if (!s) {
        const detected = looksLike(trimmed, "de") ? "de" : looksLike(trimmed, "en") ? "en" : "en";
        s = { src: trimmed, srcLang: detected, lang: detected };
        map.set(attr, s);
      }
      const cached = cacheGet(currentLang, s.src);
      if (cached) {
        if (el.getAttribute(attr) !== cached) {
          mutating = true;
          el.setAttribute(attr, cached);
          mutating = false;
        }
        s.lang = currentLang;
        continue;
      }
      if (s.srcLang === currentLang) {
        if (el.getAttribute(attr) !== s.src) {
          mutating = true;
          el.setAttribute(attr, s.src);
          mutating = false;
        }
        s.lang = currentLang;
        continue;
      }
      if (looksLike(s.src, currentLang)) { s.lang = currentLang; continue; }
      attrPending.push({ el, attr, src: s.src });
    }
  });

  if (pending.length === 0 && attrPending.length === 0) return;

  const CHUNK = 80;
  const textChunks: { node: Text; src: string }[][] = [];
  for (let i = 0; i < pending.length; i += CHUNK) textChunks.push(pending.slice(i, i + CHUNK));
  const attrChunks: AttrPending[][] = [];
  for (let i = 0; i < attrPending.length; i += CHUNK) attrChunks.push(attrPending.slice(i, i + CHUNK));

  const runTextChunk = async (slice: { node: Text; src: string }[]) => {
    const uniqueSrcs = Array.from(new Set(slice.map((s) => s.src)));
    try {
      const { translations } = await translateBatch({
        data: { targetLang: currentLang, targetName: langNames[currentLang] ?? currentLang, texts: uniqueSrcs },
      });
      const map = new Map<string, string>();
      uniqueSrcs.forEach((s, idx) => map.set(s, translations[idx] ?? s));
      mutating = true;
      for (const { node, src } of slice) {
        const t = map.get(src);
        if (!t) continue;
        cacheSet(currentLang, src, t);
        node.nodeValue = t;
        const st = textState.get(node);
        if (st) st.lang = currentLang;
      }
      mutating = false;
    } catch (err) {
      console.warn("[auto-translate] batch failed", err);
    }
  };

  const runAttrChunk = async (slice: AttrPending[]) => {
    const uniqueSrcs = Array.from(new Set(slice.map((s) => s.src)));
    try {
      const { translations } = await translateBatch({
        data: { targetLang: currentLang, targetName: langNames[currentLang] ?? currentLang, texts: uniqueSrcs },
      });
      const map = new Map<string, string>();
      uniqueSrcs.forEach((s, idx) => map.set(s, translations[idx] ?? s));
      mutating = true;
      for (const { el, attr, src } of slice) {
        const t = map.get(src);
        if (!t) continue;
        cacheSet(currentLang, src, t);
        el.setAttribute(attr, t);
        const m = attrState.get(el);
        const s = m?.get(attr);
        if (s) s.lang = currentLang;
      }
      mutating = false;
    } catch (err) {
      console.warn("[auto-translate] attr batch failed", err);
    }
  };

  await Promise.all([...textChunks.map(runTextChunk), ...attrChunks.map(runAttrChunk)]);
}

function schedule() {
  if (scheduled) return;
  // NOTE: do NOT call ensureLanguageGate() here. schedule() also fires on
  // every route change and DOM mutation via MutationObserver — gating the
  // body on those was the "half-translated flash" users saw. The gate is
  // set explicitly by bootAutoTranslate() only when the language changes.
  scheduled = true;
  const run = () => {
    scheduled = false;
    if (!hydrated) {
      // Try again on the next frame — we must never mutate the DOM before
      // React finishes hydrating, or hydration mismatches occur.
      scheduled = true;
      setTimeout(() => { scheduled = false; schedule(); }, 50);
      return;
    }
    if (inFlight) {
      rerunAfterInFlight = true;
      return;
    }
    const langAtRun = currentLang;
    const wasGated = gateActive;
    inFlight = translatePage().finally(() => {
      inFlight = null;
      if (rerunAfterInFlight) {
        rerunAfterInFlight = false;
        schedule();
        return;
      }
      if (wasGated) clearLanguageGate(langAtRun);
    });
  };
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, o?: object) => number })
      .requestIdleCallback(run, { timeout: 500 });
  } else {
    setTimeout(run, 150);
  }
}

let observer: MutationObserver | null = null;

function markHydratedSoon() {
  if (hydrated) return;
  // Wait two rAFs + a macrotask so React 19 concurrent hydration is done.
  const done = () => { hydrated = true; };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 0)));
  } else {
    setTimeout(done, 100);
  }
}

/**
 * Boot the auto-translator. Idempotent — subsequent calls just update the
 * active language and re-scan the DOM.
 */
export function bootAutoTranslate(lang: string) {
  if (typeof window === "undefined") return;
  const prevLang = currentLang;
  const isFirstBoot = !bootedOnce;
  bootedOnce = true;
  currentLang = lang;
  markHydratedSoon();
  // Gate only when there is real work: an explicit switch (prev !== new)
  // OR the pre-hydration script flagged a non-default saved language
  // (data-lang-pending is present on <html>).
  const alreadyPending =
    document.documentElement.hasAttribute("data-lang-pending") ||
    document.documentElement.hasAttribute("data-lang-switching");
  const isLangSwitch = !isFirstBoot && prevLang !== lang;
  if (isLangSwitch || alreadyPending) ensureLanguageGate();
  schedule();

  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (mutating || !hydrated) return;
    for (const m of mutations) {
      if (m.type === "childList" && m.addedNodes.length > 0) { schedule(); return; }
      if (m.type === "characterData") { schedule(); return; }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
