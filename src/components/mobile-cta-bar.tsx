import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Native-style sticky CTA bar for marketing pages on mobile.
 * Sits above the safe-area, only visible < md. Hidden inside the
 * authenticated `/app` shell, which has its own bottom tab bar.
 */
export function MobileCtaBar() {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden={false}
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-white/10 bg-[oklch(0.16_0.04_250/0.94)] p-2 shadow-elevated backdrop-blur-xl">
        <Link
          to="/auth"
          className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-200 transition active:scale-95"
        >
          {t("nav.signIn", "Sign in")}
        </Link>
        <Link
          to="/app"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-3 text-center text-sm font-semibold text-[oklch(0.16_0.04_250)] shadow-glow-teal transition active:scale-95"
        >
          {t("nav.openDashboard", "Open dashboard")}
          <ArrowRight className="rtl-flip h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
