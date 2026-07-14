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
import faCommon from "./locales/fa/common.json";
import plCommon from "./locales/pl/common.json";
import zhCommon from "./locales/zh/common.json";

const resources = {
  en: { common: enCommon },
  de: { common: deCommon },
  tr: { common: trCommon },
  ur: { common: urCommon },
  hi: { common: hiCommon },
  pa: { common: paCommon },
  ar: { common: arCommon },
  ku: { common: kuCommon },
  ru: { common: ruCommon },
  uk: { common: ukCommon },
  fa: { common: faCommon },
  pl: { common: plCommon },
  zh: { common: zhCommon },
} as const;

if (!i18n.isInitialized) {
  // Always initialise with the default language so the server HTML and the
  // first client render match. A useEffect in <LanguageBridge> reads the
  // saved / detected preference AFTER hydration and calls changeLanguage,
  // avoiding React hydration mismatches.
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
      // Init synchronously so t() returns translated strings on the very first
      // render (both SSR and hydration). Without this, react-i18next reports
      // "not ready" on the client briefly and t() falls back to the default
      // (English) value, causing hydration mismatches against the SSR HTML.
      initImmediate: false,
    } as Parameters<typeof i18n.init>[0]);
}


export default i18n;
