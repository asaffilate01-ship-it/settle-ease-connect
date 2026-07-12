import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage, hasChosenLanguage, markLanguageChosen } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";

/**
 * Full-screen language picker shown on the visitor's first visit.
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">{t("language.choose")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("language.chooseDescription")}</p>
          </div>
        </div>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {languages.map((l) => {
            const active = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-start transition ${
                    active
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg" aria-hidden>{l.flag}</span>
                    <span>
                      <span className="block font-medium">{l.nativeName}</span>
                      <span className="block text-xs text-muted-foreground">{l.englishName}</span>
                    </span>
                  </span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex justify-end">
          <Button
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
