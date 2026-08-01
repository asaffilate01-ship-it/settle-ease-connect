import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

/**
 * GDPR / TTDSG-compliant cookie banner. Blocks nothing by default — we only
 * load analytics if the visitor picks "Accept all". Choice persists in
 * localStorage; withdrawal happens from the Cookies page.
 */
export function CookieConsent() {
  const { t } = useTranslation();
  const { consent, ready, accept } = useCookieConsent();

  if (!ready || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-elevated sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="hidden shrink-0 sm:grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="cookie-banner-title" className="font-display text-lg font-semibold">
            {t("cookies.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cookies.body")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button className="bg-gradient-primary" onClick={() => accept("all")}>
              {t("cookies.acceptAll")}
            </Button>
            <Button variant="outline" onClick={() => accept("essential")}>
              {t("cookies.essentialOnly")}
            </Button>
            <Link
              to="/legal/cookies"
              className="ms-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("cookies.learnMore")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
