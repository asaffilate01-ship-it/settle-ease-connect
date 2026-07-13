import { useEffect, useState } from "react";
import appI18n from "@/i18n";
import { isRTL, LANGUAGES, type LangCode } from "@/i18n/config";
import { bootAutoTranslate } from "@/lib/auto-translate";


const STORAGE_KEY = "beistand.lang";
const ONBOARDING_KEY = "beistand.lang.chosen";

function getSafeI18n() {
  return appI18n && typeof appI18n.changeLanguage === "function" ? appI18n : null;
}

function changeLanguageSafely(next: LangCode) {
  const safeI18n = getSafeI18n();
  if (!safeI18n) return false;

  try {
    void Promise.resolve(safeI18n.changeLanguage(next)).catch((err) => {
      console.warn("i18n.changeLanguage failed", err);
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

  // After hydration, apply the user's saved language preference. Doing this
  // in useEffect (not during init) ensures the first client render matches
  // the SSR HTML (always DEFAULT_LANG) and prevents hydration mismatches.
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
    if (!saved) {
      const nav = navigator.language?.split("-")[0];
      const match = LANGUAGES.find((l) => l.code === nav || l.code.startsWith(nav ?? ""));
      saved = match?.code ?? null;
    }
    if (saved && saved !== safeI18n.language && LANGUAGES.some((l) => l.code === saved)) {
      changeLanguageSafely(saved as LangCode);
    }
    // Only run once after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Sync <html lang> and <html dir> whenever language changes, and kick off
  // the DOM-wide auto-translator for anything not covered by i18next keys.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
    bootAutoTranslate(lang);
  }, [lang]);

  const setLanguage = (next: LangCode) => {
    if (!changeLanguageSafely(next)) {
      setLangState(next);
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
