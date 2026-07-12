import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANG, LANGUAGES } from "./config";

// Statically import every locale so Vite bundles them all.
import enCommon from "./locales/en/common.json";
import deCommon from "./locales/de/common.json";
import trCommon from "./locales/tr/common.json";
import urCommon from "./locales/ur/common.json";
import hiCommon from "./locales/hi/common.json";
import paCommon from "./locales/pa/common.json";
import arCommon from "./locales/ar/common.json";
import kuCommon from "./locales/ku/common.json";
import ruCommon from "./locales/ru/common.json";
import ukCommon from "./locales/uk/common.json";
import psCommon from "./locales/ps/common.json";

const resources = {
  en: { common: enCommon },
  de: { common: deCommon },
  tr: { common: trCommon },
  ur: { common: urCommon },
  hi: { common: hiCommon },
  pa: { common: paCommon },
  ps: { common: psCommon },
  ar: { common: arCommon },
  ku: { common: kuCommon },
  ru: { common: ruCommon },
  uk: { common: ukCommon },
} as const;

if (!i18n.isInitialized) {
  // On the server render with the default language; the client-side detector
  // re-runs after hydration and switches once we know the user's preference.
  const isBrowser = typeof window !== "undefined";
  const chain = i18n.use(initReactI18next);
  if (isBrowser) chain.use(LanguageDetector);
  chain.init({
    resources,
    lng: isBrowser ? undefined : DEFAULT_LANG,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: LANGUAGES.map((l) => l.code),
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "beistand.lang",
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });
}

export default i18n;
