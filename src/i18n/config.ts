export type LangCode =
  | "en" | "de" | "tr" | "ur" | "hi" | "pa"
  | "ps" | "ar" | "ku" | "ru" | "uk"
  | "sq" | "so" | "ti" | "pt-BR" | "bs" | "hr" | "sr" | "vi" | "fr";

export const LANGUAGES: { code: LangCode; nativeName: string; englishName: string; flag: string }[] = [
  { code: "en",    nativeName: "English",     englishName: "English",             flag: "🇬🇧" },
  { code: "de",    nativeName: "Deutsch",     englishName: "German",              flag: "🇩🇪" },
  { code: "tr",    nativeName: "Türkçe",      englishName: "Turkish",             flag: "🇹🇷" },
  { code: "ur",    nativeName: "اردو",        englishName: "Urdu",                flag: "🇵🇰" },
  { code: "hi",    nativeName: "हिन्दी",         englishName: "Hindi",               flag: "🇮🇳" },
  { code: "pa",    nativeName: "ਪੰਜਾਬੀ",         englishName: "Punjabi",             flag: "🇮🇳" },
  { code: "ps",    nativeName: "پښتو",         englishName: "Pashto",              flag: "🇦🇫" },
  { code: "ar",    nativeName: "العربية",      englishName: "Arabic",              flag: "🇸🇦" },
  { code: "ku",    nativeName: "Kurdî",        englishName: "Kurdish",             flag: "🏳️" },
  { code: "ru",    nativeName: "Русский",      englishName: "Russian",             flag: "🇷🇺" },
  { code: "uk",    nativeName: "Українська",   englishName: "Ukrainian",           flag: "🇺🇦" },
  { code: "sq",    nativeName: "Shqip",        englishName: "Albanian",            flag: "🇦🇱" },
  { code: "so",    nativeName: "Soomaali",     englishName: "Somali",              flag: "🇸🇴" },
  { code: "ti",    nativeName: "ትግርኛ",         englishName: "Tigrinya",            flag: "🇪🇷" },
  { code: "pt-BR", nativeName: "Português (BR)", englishName: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "bs",    nativeName: "Bosanski",     englishName: "Bosnian",             flag: "🇧🇦" },
  { code: "hr",    nativeName: "Hrvatski",     englishName: "Croatian",            flag: "🇭🇷" },
  { code: "sr",    nativeName: "Српски",       englishName: "Serbian",             flag: "🇷🇸" },
  { code: "vi",    nativeName: "Tiếng Việt",   englishName: "Vietnamese",          flag: "🇻🇳" },
  { code: "fr",    nativeName: "Français",     englishName: "French",              flag: "🇫🇷" },
];

export const RTL_LANGS: ReadonlySet<LangCode> = new Set(["ar", "ur", "ps", "ku"]);

export const DEFAULT_LANG: LangCode = "de";

export function isRTL(code: string): boolean {
  return RTL_LANGS.has(code as LangCode);
}
