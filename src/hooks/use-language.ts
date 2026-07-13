import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { isRTL, LANGUAGES, type LangCode } from "@/i18n/config";
import { bootAutoTranslate } from "@/lib/auto-translate";


const STORAGE_KEY = "beistand.lang";
const ONBOARDING_KEY = "beistand.lang.chosen";

export function useLanguage() {
  const { i18n } = useTranslation();
  const [lang, setLangState] = useState<LangCode>((i18n.language as LangCode) || "en");

  useEffect(() => {
    if (!i18n || typeof i18n.on !== "function") return;
    const handler = (l: string) => setLangState(l as LangCode);
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off?.("languageChanged", handler);
    };
  }, [i18n]);

  // After hydration, apply the user's saved language preference. Doing this
  // in useEffect (not during init) ensures the first client render matches
  // the SSR HTML (always DEFAULT_LANG) and prevents hydration mismatches.
  useEffect(() => {
    if (typeof window === "undefined") return;
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
    if (saved && saved !== i18n.language && LANGUAGES.some((l) => l.code === saved)) {
      void i18n.changeLanguage(saved);
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
    void i18n.changeLanguage(next);
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
