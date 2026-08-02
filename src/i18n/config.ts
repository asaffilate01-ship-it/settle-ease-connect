export type LangCode =
  "de" | "en" | "tr" | "ur" | "hi" | "pa" | "ar" | "ku" | "ru" | "uk" | "fa" | "pl" | "zh";

export const LANGUAGES: {
  code: LangCode;
  nativeName: string;
  englishName: string;
  flag: string;
}[] = [
  { code: "de", nativeName: "Deutsch", englishName: "German", flag: "🇩🇪" },
  { code: "en", nativeName: "English", englishName: "English", flag: "🇬🇧" },
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish", flag: "🇹🇷" },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", flag: "🇵🇰" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", flag: "🇮🇳" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", flag: "🇸🇦" },
  { code: "ku", nativeName: "Kurdî", englishName: "Kurdish", flag: "🏳️" },
  { code: "fa", nativeName: "فارسی", englishName: "Persian", flag: "🇮🇷" },
  { code: "ru", nativeName: "Русский", englishName: "Russian", flag: "🇷🇺" },
  { code: "uk", nativeName: "Українська", englishName: "Ukrainian", flag: "🇺🇦" },
  { code: "pl", nativeName: "Polski", englishName: "Polish", flag: "🇵🇱" },
  { code: "zh", nativeName: "中文", englishName: "Chinese", flag: "🇨🇳" },
];

export const RTL_LANGS: ReadonlySet<LangCode> = new Set(["ar", "ur", "fa", "ku"]);

export const DEFAULT_LANG: LangCode = "de";

export function isRTL(code: string): boolean {
  return RTL_LANGS.has(code as LangCode);
}
