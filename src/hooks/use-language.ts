import { startTransition, useEffect, useRef, useState } from "react";
import appI18n from "@/i18n";
import { DEFAULT_LANG, isRTL, LANGUAGES, type LangCode } from "@/i18n/config";



const STORAGE_KEY = "beistand.lang";
const ONBOARDING_KEY = "beistand.lang.chosen";

// Module-scope flag: the saved-language load is applied exactly once per
// full-page load, and only AFTER the first React commit. That guarantees
// SSR HTML and first-client-render both see DEFAULT_LANG, so
// useTranslation consumers can't hydration-mismatch on nav labels.
let savedLangApplied = false;

function getSafeI18n() {
  return appI18n && typeof appI18n.changeLanguage === "function" ? appI18n : null;
}

function changeLanguageSafely(next: LangCode) {
  const safeI18n = getSafeI18n();
  if (!safeI18n) return false;

  try {
    startTransition(() => {
      const result = safeI18n.changeLanguage(next);
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch((err) => {
          console.warn("i18n.changeLanguage failed", err);
        });
      }
    });
    return true;
  } catch (err) {
    console.warn("i18n.changeLanguage failed", err);
    return false;
  }
}

export function useLanguage() {
  // ALWAYS start at DEFAULT_LANG on both server and client so hydration
  // matches unconditionally. The saved-language swap happens in an effect
  // below, after the first commit.
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const safeI18n = getSafeI18n();
    if (!safeI18n || typeof safeI18n.on !== "function") return;
    const handler = (l: string) => setLangState(l as LangCode);
    safeI18n.on("languageChanged", handler);
    return () => {
      safeI18n.off?.("languageChanged", handler);
    };
  }, []);

  // After the first commit, apply the user's saved language once.
  useEffect(() => {
    hydratedRef.current = true;
    if (savedLangApplied) return;
    savedLangApplied = true;
    if (typeof window === "undefined") return;
    const safeI18n = getSafeI18n();
    if (!safeI18n) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (saved && saved !== safeI18n.language && LANGUAGES.some((l) => l.code === saved)) {
      changeLanguageSafely(saved as LangCode);
    }
  }, []);



  // Sync <html lang> and <html dir> whenever language changes. Do this
  // synchronously (not in useEffect) inside the same view transition as
  // the i18n swap so LTR↔RTL flips paint in one frame, not two.
  const applyHtmlAttrs = (l: LangCode) => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = l;
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
  };
  useEffect(() => {
    applyHtmlAttrs(lang);
  }, [lang]);

  const setLanguage = (next: LangCode) => {
    const swap = () => {
      applyHtmlAttrs(next);
      if (!changeLanguageSafely(next)) {
        setLangState(next);
      }
    };
    // View Transitions API cross-fades the reflow (including the RTL flip)
    // into a single animated frame, so the switch feels instant instead of
    // flashing through an unstyled paint. Safe fallback when unsupported.
    const doc = typeof document !== "undefined" ? (document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }) : null;
    if (doc?.startViewTransition) {
      doc.startViewTransition(swap);
    } else {
      swap();
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore storage errors (private mode etc.)
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
