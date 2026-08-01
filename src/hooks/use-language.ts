import { useEffect, useRef, useState } from "react";
import appI18n from "@/i18n";
import { DEFAULT_LANG, isRTL, LANGUAGES, type LangCode } from "@/i18n/config";
import { bootAutoTranslate } from "@/lib/auto-translate";

const STORAGE_KEY = "beistand.lang";
const ONBOARDING_KEY = "beistand.lang.chosen";

// Module-scope flag: the saved-language load is applied exactly once per
// full-page load, and only AFTER the first React commit. That guarantees
// SSR HTML and first-client-render both see DEFAULT_LANG, so
// useTranslation consumers can't hydration-mismatch on nav labels.
let savedLangApplied = false;

function revealBody() {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-lang-pending");
  document.documentElement.removeAttribute("data-lang-switching");
  document.querySelector("style[data-lang-gate]")?.remove();
}

function ensureLanguageGate() {
  if (typeof document === "undefined") return;
  if (document.querySelector("style[data-lang-gate]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-lang-gate", "");
  style.textContent =
    "html[data-lang-pending] body,html[data-lang-switching] body{visibility:hidden!important}";
  document.head.appendChild(style);
}

function shouldKeepGateForDomTranslation(lang: string | null) {
  return !!lang || document.documentElement.hasAttribute("data-lang-pending");
}


function getSafeI18n() {
  return appI18n && typeof appI18n.changeLanguage === "function" ? appI18n : null;
}

function changeLanguageSafely(next: LangCode) {
  const safeI18n = getSafeI18n();
  if (!safeI18n) return false;
  try {
    // Synchronous — no startTransition. All locale bundles are eagerly
    // loaded, so i18next fires languageChanged in the same frame.
    const result = safeI18n.changeLanguage(next);
    if (result && typeof (result as Promise<unknown>).catch === "function") {
      (result as Promise<unknown>).catch((err) => {
        console.warn("i18n.changeLanguage failed", err);
      });
    }
    return true;
  } catch (err) {
    console.warn("i18n.changeLanguage failed", err);
    return false;
  }
}

export function useLanguage() {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const safeI18n = getSafeI18n();
    if (!safeI18n || typeof safeI18n.on !== "function") return;
    const handler = (l: string) => setLangState(l as LangCode);
    safeI18n.on("languageChanged", handler);
    if (safeI18n.language && LANGUAGES.some((l) => l.code === safeI18n.language)) {
      handler(safeI18n.language);
    }
    return () => {
      safeI18n.off?.("languageChanged", handler);
    };
  }, []);

  useEffect(() => {
    hydratedRef.current = true;
    if (savedLangApplied) return;
    savedLangApplied = true;
    if (typeof window === "undefined") return;
    const safeI18n = getSafeI18n();
    if (!safeI18n) {
      revealBody();
      return;
    }
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    // Lazy route chunks hydrate after the shell, so switching the language
    // during the first effect makes React compare DE server HTML against
    // freshly-translated client output inside that boundary (hydration
    // mismatch). Wait for the window load event — by then every lazy
    // boundary has hydrated — then swap.
    const applySaved = () => {
      if (saved && saved !== safeI18n.language && LANGUAGES.some((l) => l.code === saved)) {
        changeLanguageSafely(saved as LangCode);
      }
      // For non-default languages the DOM auto-translator clears the gate after
      // hardcoded page copy has been translated too. Revealing here causes the
      // half-English / half-German flash the live site was showing.
      if (!shouldKeepGateForDomTranslation(saved)) {
        requestAnimationFrame(revealBody);
      }
    };

    // Route components are lazily chunked, so their subtree hydrates a few
    // frames after the shell. Give React time to finish hydrating every
    // pending boundary in DEFAULT_LANG before switching.
    const schedule = () => window.setTimeout(applySaved, 250);
    if (document.readyState === "complete") {
      schedule();
      return;
    }
    window.addEventListener("load", () => schedule(), { once: true });
  }, []);





  const applyHtmlAttrs = (l: LangCode) => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = l;
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
  };
  useEffect(() => {
    const pendingLang =
      typeof document !== "undefined"
        ? document.documentElement.getAttribute("data-lang-pending")
        : null;
    if (
      typeof document !== "undefined" &&
      lang === DEFAULT_LANG &&
      pendingLang !== null &&
      pendingLang !== DEFAULT_LANG
    ) {
      return;
    }
    applyHtmlAttrs(lang);
    bootAutoTranslate(lang);
  }, [lang]);

  const setLanguage = (next: LangCode) => {
    // Synchronous swap — no View Transitions cross-fade (that animated
    // frame added ~200-300ms of perceived lag, especially on RTL flips).
    // The gate is applied by bootAutoTranslate (invoked by the [lang]
    // effect) so hardcoded DOM copy translates before the body is revealed.
    applyHtmlAttrs(next);
    if (typeof document !== "undefined") {
      ensureLanguageGate();
      document.documentElement.setAttribute("data-lang-switching", next);
    }
    if (!changeLanguageSafely(next)) {
      setLangState(next);
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
  };

  return { lang, setLanguage, languages: LANGUAGES };
}

export function hasChosenLanguage(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

export function markLanguageChosen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // ignore
  }
}
