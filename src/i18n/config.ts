export type LangCode =
  | "en" | "de" | "tr" | "ur" | "hi" | "pa"
  | "ps" | "ar" | "ku" | "ru" | "uk";

export const LANGUAGES: { code: LangCode; nativeName: string; englishName: string; flag: string }[] = [
  { code: "en", nativeName: "English",    englishName: "English",    flag: "🇬🇧" },
  { code: "de", nativeName: "Deutsch",    englishName: "German",     flag: "🇩🇪" },
  { code: "tr", nativeName: "Türkçe",     englishName: "Turkish",    flag: "🇹🇷" },
  { code: "ur", nativeName: "اردو",       englishName: "Urdu",       flag: "🇵🇰" },
  { code: "hi", nativeName: "हिन्दी",       englishName: "Hindi",      flag: "🇮🇳" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ",       englishName: "Punjabi",    flag: "🇮🇳" },
  { code: "ps", nativeName: "پښتو",        englishName: "Pashto",     flag: "🇦🇫" },
  { code: "ar", nativeName: "العربية",     englishName: "Arabic",     flag: "🇸🇦" },
  { code: "ku", nativeName: "Kurdî",       englishName: "Kurdish",    flag: "🏳️" },
  { code: "ru", nativeName: "Русский",     englishName: "Russian",    flag: "🇷🇺" },
  { code: "uk", nativeName: "Українська",  englishName: "Ukrainian",  flag: "🇺🇦" },
];

export const RTL_LANGS: ReadonlySet<LangCode> = new Set(["ar", "ur", "ps", "ku"]);

export const DEFAULT_LANG: LangCode = "en";

export function isRTL(code: string): boolean {
  return RTL_LANGS.has(code as LangCode);
}
