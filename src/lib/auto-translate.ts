/**
 * Live DOM auto-translator.
 *
 * On every route change (or DOM mutation), we walk the document, collect
 * visible text nodes that haven't been translated for the current language
 * yet, batch them through the Lovable AI gateway and swap the text in place.
 *
 * Design notes:
 * - We stash the ORIGINAL text on `data-i18n-src` the first time we see a
 *   node, so switching languages later re-translates from the source.
 * - We cache every (lang, source) pair in localStorage so repeat visits are
 *   instant and free.
 * - Elements can opt out with `data-no-translate` (used for brand marks,
 *   emails, code blocks, etc.).
 * - We intentionally skip <script>, <style>, <code>, <pre>, form inputs,
 *   and anything already inside a `[data-no-translate]` subtree.
 */
import { translateBatch } from "./translate.functions";

const CACHE_PREFIX = "bs.t.v2.";
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "KBD", "SAMP",
  "TEXTAREA", "INPUT", "SELECT", "OPTION", "SVG", "PATH",
]);
const SKIP_ATTR = "data-no-translate";
const SRC_ATTR = "data-i18n-src";
const LANG_ATTR = "data-i18n-lang";

let currentLang = "en";
let inFlight: Promise<void> | null = null;
let scheduled = false;
let mutating = false;

const langNames: Record<string, string> = {
  en: "English", de: "German", tr: "Turkish", ur: "Urdu", hi: "Hindi",
  pa: "Punjabi", ps: "Pashto", ar: "Arabic", ku: "Kurdish (Kurmanji)",
  ru: "Russian", uk: "Ukrainian",
};

function shouldSkip(el: Element | null): boolean {
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute?.(SKIP_ATTR)) return true;
    el = el.parentElement;
  }
  return false;
}

function cacheGet(lang: string, src: string): string | null {
  try {
    return localStorage.getItem(CACHE_PREFIX + lang + ":" + hash(src));
  } catch {
    return null;
  }
}
function cacheSet(lang: string, src: string, translated: string) {
  try {
    localStorage.setItem(CACHE_PREFIX + lang + ":" + hash(src), translated);
  } catch {
    /* quota — ignore */
  }
}

/** Cheap 32-bit hash — collisions are irrelevant, we only need a stable key. */
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function collectTextNodes(): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const t = node.nodeValue;
        if (!t) return NodeFilter.FILTER_REJECT;
        const trimmed = t.trim();
        // Skip pure whitespace, single chars, numbers-only, and short symbolic strings.
        if (trimmed.length < 2) return NodeFilter.FILTER_REJECT;
        if (/^[\d\s.,:/\-–—+%€$£¥]+$/.test(trimmed)) return NodeFilter.FILTER_REJECT;
        if (shouldSkip(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

/**
 * Translatable attributes ({@link https://developer.mozilla.org/en-US/docs/Web/HTML}).
 * We stash the original on `data-i18n-attr-<name>` so switching languages later
 * re-translates from source.
 */
const ATTR_LIST = ["alt", "title", "aria-label", "placeholder"] as const;

type AttrPending = { el: Element; attr: string; src: string };

function collectAttrTargets(): AttrPending[] {
  const out: AttrPending[] = [];
  const sel = ATTR_LIST.map((a) => `[${a}]`).join(",");
  const els = document.querySelectorAll<HTMLElement>(sel);
  els.forEach((el) => {
    if (shouldSkip(el)) return;
    for (const attr of ATTR_LIST) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      const trimmed = val.trim();
      if (trimmed.length < 2) continue;
      if (/^[\d\s.,:/\-–—+%€$£¥]+$/.test(trimmed)) continue;
      const srcKey = `data-i18n-attr-${attr}`;
      const src = el.getAttribute(srcKey);
      if (!src) {
        // No stashed source yet. Only capture when we're in the base
        // language; otherwise the current value is already a translation
        // and would poison future switches.
        continue;
      }
      const langKey = `data-i18n-attrlang-${attr}`;
      if (el.getAttribute(langKey) === currentLang) continue;
      out.push({ el, attr, src });
    }
  });
  return out;
}

/**
 * Called on every pass while currentLang === "en" (the base language).
 * Stashes the current English text/attribute values onto data-i18n-src so
 * subsequent language switches translate from the correct source, even for
 * strings owned by react-i18next.
 */
function seedEnglishSources() {
  // Text nodes
  const nodes = collectTextNodes();
  mutating = true;
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent) continue;
    const existing = parent.getAttribute(SRC_ATTR);
    const text = node.nodeValue?.trim();
    if (!text) continue;
    if (!existing) {
      parent.setAttribute(SRC_ATTR, text);
      parent.setAttribute(LANG_ATTR, "en");
    } else if (existing !== text) {
      // The English copy changed (e.g. a key updated). Refresh the source.
      parent.setAttribute(SRC_ATTR, text);
      parent.setAttribute(LANG_ATTR, "en");
    }
  }
  // Attributes
  const sel = ATTR_LIST.map((a) => `[${a}]`).join(",");
  document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
    if (shouldSkip(el)) return;
    for (const attr of ATTR_LIST) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      const trimmed = val.trim();
      if (trimmed.length < 2) continue;
      if (/^[\d\s.,:/\-–—+%€$£¥]+$/.test(trimmed)) continue;
      const srcKey = `data-i18n-attr-${attr}`;
      const existing = el.getAttribute(srcKey);
      if (!existing || existing !== trimmed) {
        el.setAttribute(srcKey, trimmed);
        el.setAttribute(`data-i18n-attrlang-${attr}`, "en");
      }
    }
  });
  mutating = false;
}

async function translatePage() {
  if (typeof window === "undefined") return;
  if (currentLang === "en") {
    // We are in the base language. First, restore anything previously
    // translated back to its stashed English source. Then seed the source
    // attribute on every currently-visible node so that a later switch to
    // another language has the correct English source to translate from.
    restoreEnglish();
    seedEnglishSources();
    return;
  }
  const nodes = collectTextNodes();
  const attrTargets = collectAttrTargets();
  const pending: { node: Text; src: string }[] = [];
  const attrPending: AttrPending[] = [];

  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent) continue;
    const src = parent.getAttribute(SRC_ATTR);
    if (!src) {
      // No stashed source. Skip — the seed pass while lang === "en" is
      // responsible for capturing sources; stashing here would poison
      // the cache with an already-translated string.
      continue;
    }
    const targetLang = parent.getAttribute(LANG_ATTR);
    if (targetLang === currentLang) continue;

    const cached = cacheGet(currentLang, src);
    if (cached) {
      mutating = true;
      node.nodeValue = cached;
      parent.setAttribute(LANG_ATTR, currentLang);
      mutating = false;
      continue;
    }
    pending.push({ node, src });
  }

  // Attributes: alt / title / aria-label / placeholder
  for (const t of attrTargets) {
    const cached = cacheGet(currentLang, t.src);
    if (cached) {
      mutating = true;
      t.el.setAttribute(t.attr, cached);
      t.el.setAttribute(`data-i18n-attrlang-${t.attr}`, currentLang);
      mutating = false;
      continue;
    }
    attrPending.push(t);
  }

  if (pending.length === 0 && attrPending.length === 0) return;

  // Batch in chunks of 60, run all chunks in parallel — the previous sequential
  // await-in-loop made language switches feel painfully slow.
  const CHUNK = 60;
  const textChunks: { node: Text; src: string }[][] = [];
  for (let i = 0; i < pending.length; i += CHUNK) textChunks.push(pending.slice(i, i + CHUNK));
  const attrChunks: AttrPending[][] = [];
  for (let i = 0; i < attrPending.length; i += CHUNK) attrChunks.push(attrPending.slice(i, i + CHUNK));

  const runTextChunk = async (slice: { node: Text; src: string }[]) => {
    const uniqueSrcs = Array.from(new Set(slice.map((s) => s.src)));
    try {
      const { translations } = await translateBatch({
        data: {
          targetLang: currentLang,
          targetName: langNames[currentLang] ?? currentLang,
          texts: uniqueSrcs,
        },
      });
      const map = new Map<string, string>();
      uniqueSrcs.forEach((s, idx) => map.set(s, translations[idx] ?? s));
      mutating = true;
      for (const { node, src } of slice) {
        const t = map.get(src);
        if (!t) continue;
        cacheSet(currentLang, src, t);
        node.nodeValue = t;
        node.parentElement?.setAttribute(LANG_ATTR, currentLang);
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
        data: {
          targetLang: currentLang,
          targetName: langNames[currentLang] ?? currentLang,
          texts: uniqueSrcs,
        },
      });
      const map = new Map<string, string>();
      uniqueSrcs.forEach((s, idx) => map.set(s, translations[idx] ?? s));
      mutating = true;
      for (const { el, attr, src } of slice) {
        const t = map.get(src);
        if (!t) continue;
        cacheSet(currentLang, src, t);
        el.setAttribute(attr, t);
        el.setAttribute(`data-i18n-attrlang-${attr}`, currentLang);
      }
      mutating = false;
    } catch (err) {
      console.warn("[auto-translate] attr batch failed", err);
    }
  };

  await Promise.all([
    ...textChunks.map(runTextChunk),
    ...attrChunks.map(runAttrChunk),
  ]);
}

function restoreEnglish() {
  const marked = document.querySelectorAll<HTMLElement>(`[${SRC_ATTR}]`);
  mutating = true;
  marked.forEach((el) => {
    const src = el.getAttribute(SRC_ATTR);
    if (!src) return;
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && child.nodeValue?.trim()) {
        child.nodeValue = src;
        break;
      }
    }
    el.setAttribute(LANG_ATTR, "en");
  });
  // Restore attributes
  for (const attr of ATTR_LIST) {
    const srcKey = `data-i18n-attr-${attr}`;
    document.querySelectorAll<HTMLElement>(`[${srcKey}]`).forEach((el) => {
      const src = el.getAttribute(srcKey);
      if (src) el.setAttribute(attr, src);
      el.setAttribute(`data-i18n-attrlang-${attr}`, "en");
    });
  }
  mutating = false;
}

function schedule(immediate = false) {
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    if (inFlight) return;
    inFlight = translatePage().finally(() => {
      inFlight = null;
      // clear the fade set by bootAutoTranslate
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-lang-switching");
      }
    });
  };
  if (immediate) {
    // Run on the next microtask so React can commit first, but don't wait for idle.
    Promise.resolve().then(run);
    return;
  }
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, o?: object) => number })
      .requestIdleCallback(run, { timeout: 500 });
  } else {
    setTimeout(run, 150);
  }
}

let observer: MutationObserver | null = null;

/**
 * Boot the auto-translator. Idempotent — subsequent calls just update the
 * active language and re-scan the DOM.
 */
export function bootAutoTranslate(lang: string) {
  if (typeof window === "undefined") return;
  const changed = currentLang !== lang;
  currentLang = lang;
  if (changed) {
    // Mark html so a CSS rule can fade the page during the swap.
    document.documentElement.setAttribute("data-lang-switching", "1");
  }
  schedule(changed);

  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (mutating) return;
    for (const m of mutations) {
      if (m.type === "childList" && m.addedNodes.length > 0) {
        schedule();
        return;
      }
      if (m.type === "characterData") {
        schedule();
        return;
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
