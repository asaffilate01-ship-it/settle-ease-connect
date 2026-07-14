import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage, hasChosenLanguage, markLanguageChosen } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { LangFlag } from "@/components/lang-flag";

/**
 * Compact language picker shown on the visitor's first visit.
 * Once dismissed (either by picking a language or confirming the default),
 * it never re-opens — users change language via the header/sidebar switcher.
 */
export function LanguageOnboarding() {
  const { t } = useTranslation();
  const { lang, setLanguage, languages } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasChosenLanguage()) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-elevated sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">{t("language.choose")}</h2>
            <p className="text-xs text-muted-foreground">{t("language.chooseDescription")}</p>
          </div>
        </div>

        <ul className="mt-4 grid max-h-[50vh] gap-1.5 overflow-y-auto sm:max-h-[24rem] sm:grid-cols-2">
          {languages.map((l) => {
            const active = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    markLanguageChosen();
                    setVisible(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-start transition ${
                    active
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <LangFlag code={l.code} className="h-4 w-6" />
                    <span>
                      <span className="block text-sm font-medium">{l.nativeName}</span>
                      <span className="block text-xs text-muted-foreground">{l.englishName}</span>
                    </span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            className="bg-gradient-primary"
            onClick={() => {
              markLanguageChosen();
              setVisible(false);
            }}
          >
            {t("language.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}

