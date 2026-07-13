import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal — BeistandPlus" },
      { name: "description", content: "Terms of service, privacy notice, cookies, complaints procedure and imprint for BeistandPlus." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://beistandplus.de/legal" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/legal" }],
  }),
  component: LegalLayout,
});

const NAV: { to: string; labelKey: string }[] = [
  { to: "/legal/terms",      labelKey: "footer.terms" },
  { to: "/legal/privacy",    labelKey: "footer.privacy" },
  { to: "/legal/cookies",    labelKey: "footer.cookies" },
  { to: "/legal/complaints", labelKey: "footer.complaints" },
  { to: "/legal/impressum",  labelKey: "footer.impressum" },
];

function LegalLayout() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("legal.sectionLabel")}
          </div>
          <nav className="mt-3 flex flex-wrap gap-1 lg:flex-col">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {t(n.labelKey)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
