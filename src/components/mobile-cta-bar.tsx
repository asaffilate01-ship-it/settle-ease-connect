import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Native-style sticky CTA bar for marketing pages on mobile.
 * Fixed to the viewport bottom above the safe-area, hidden ≥ md.
 * Must be rendered OUTSIDE the sticky header (backdrop-filter creates a
 * containing block, which would trap this fixed element inside the header).
 */
export function MobileCtaBar({ hidden = false }: { hidden?: boolean }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on auth screens, inside the authenticated app shell, and when the
  // caller explicitly opts out (e.g. signed-in users on marketing pages).
  const suppress =
    hidden ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/checkout");
  if (suppress) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-white/10 bg-[oklch(0.16_0.04_250/0.94)] p-2 shadow-elevated backdrop-blur-xl">
        <Link
          to="/auth"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-center text-[13px] font-semibold text-slate-200 transition active:scale-95"
        >
          <LogIn className="rtl-flip h-4 w-4" />
          {t("nav.signIn", "Sign in")}
        </Link>
        <Link
          to="/app"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal px-3 py-3 text-center text-[13px] font-semibold text-[oklch(0.16_0.04_250)] shadow-glow-teal transition active:scale-95"
        >
          {t("nav.openDashboard", "Open dashboard")}
          <ArrowRight className="rtl-flip h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
