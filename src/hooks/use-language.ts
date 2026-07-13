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
