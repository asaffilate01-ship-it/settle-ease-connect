import { startTransition, useEffect, useState } from "react";
import appI18n from "@/i18n";
import { isRTL, LANGUAGES, type LangCode } from "@/i18n/config";



const STORAGE_KEY = "beistand.lang";
const ONBOARDING_KEY = "beistand.lang.chosen";

function getSafeI18n() {
  return appI18n && typeof appI18n.changeLanguage === "function" ? appI18n : null;
}

function changeLanguageSafely(next: LangCode) {
  const safeI18n = getSafeI18n();
  if (!safeI18n) return false;

  try {
    // Resources are statically bundled and already in memory, so
    // changeLanguage resolves in the same microtask. We still wrap the
    // resulting React re-render (which fans out across every
    // useTranslation consumer) in startTransition so React can slice the
    // work and keep the switcher responsive.
    startTransition(() => {
      const result = safeI18n.changeLanguage(next);
      // The returned promise is already-resolved here; swallow any late
      // rejection so it doesn't surface as an unhandled promise.
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
  const [lang, setLangState] = useState<LangCode>((appI18n.language as LangCode) || "en");

  useEffect(() => {
    const safeI18n = getSafeI18n();
    if (!safeI18n || typeof safeI18n.on !== "function") return;
    const handler = (l: string) => setLangState(l as LangCode);
    safeI18n.on("languageChanged", handler);
    return () => {
      safeI18n.off?.("languageChanged", handler);
    };
  }, []);

  // After hydration, apply the user's saved language preference. We do NOT
  // auto-detect from navigator.language — that caused the page to flip to
  // another language on load. The onboarding sheet is where visitors pick.
  useEffect(() => {
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
    // Only run once after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
