import { Globe, Check } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const { lang, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === lang) ?? languages[0];

  const btnBase =
    variant === "header"
      ? "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
      : "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={btnBase}
        aria-label={t("language.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{current.nativeName}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute end-0 z-50 mt-2 max-h-80 w-56 overflow-auto rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-elevated"
          >
            {languages.map((l) => {
              const active = l.code === lang;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start hover:bg-muted ${
                      active ? "bg-muted/60 font-medium" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{l.flag}</span>
                      <span>{l.nativeName}</span>
                      <span className="text-xs text-muted-foreground">{l.englishName}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
