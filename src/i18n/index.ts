import i18n from "i18next";
import { initReactI18next } from "react-i18next";
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
import sqCommon from "./locales/sq/common.json";
import soCommon from "./locales/so/common.json";
import tiCommon from "./locales/ti/common.json";
import ptBRCommon from "./locales/pt-BR/common.json";
import bsCommon from "./locales/bs/common.json";
import hrCommon from "./locales/hr/common.json";
import srCommon from "./locales/sr/common.json";
import viCommon from "./locales/vi/common.json";
import frCommon from "./locales/fr/common.json";

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
  sq: { common: sqCommon },
  so: { common: soCommon },
  ti: { common: tiCommon },
  "pt-BR": { common: ptBRCommon },
  bs: { common: bsCommon },
  hr: { common: hrCommon },
  sr: { common: srCommon },
  vi: { common: viCommon },
  fr: { common: frCommon },
} as const;

if (!i18n.isInitialized) {
  // Always initialise with the default language so the server HTML and the
  // first client render match. A useEffect in <LanguageBridge> reads the
  // saved / detected preference AFTER hydration and calls changeLanguage,
  // avoiding React hydration mismatches (e.g. server rendered "Services"
  // while client hydrated as "خدمات").
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: DEFAULT_LANG,
      fallbackLng: DEFAULT_LANG,
      supportedLngs: LANGUAGES.map((l) => l.code),
      defaultNS: "common",
      ns: ["common"],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}


export default i18n;
