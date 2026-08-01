import { createFileRoute, Outlet, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Briefcase, Wallet, UserCircle, FileText, Receipt, CalendarClock } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/brand/logo-mark.png";
import { MobilePortalNav } from "@/components/portal/mobile-portal-nav";
import { MfaEnrollmentGate } from "@/components/security/mfa-enrollment-gate";

const EXPERT_ROLES = [
  "expert",
  "lawyer",
  "accountant",
  "doctor",
  "notary",
  "translator",
  "social_worker",
  "funeral_director",
  "mosque",
  "church",
  "temple",
  "hospital",
] as const;

export const Route = createFileRoute("/_authenticated/expert")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const roles = (rolesData ?? []).map((r: { role: string }) => r.role);
    const isExpert = roles.some((r) => (EXPERT_ROLES as readonly string[]).includes(r));
    const isInternal = roles.some((r) =>
      ["admin", "staff", "case_manager"].includes(r),
    );
    if (!isExpert && !isInternal) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Expert portal — BeistandPlus" }] }),
  component: ExpertLayout,
});

function ExpertLayout() {
  const { t } = useTranslation();
  const { user, profile } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const name = profile?.full_name || user?.email?.split("@")[0] || "Expert";

  const NAV: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/expert", label: t("expert.nav.overview", { defaultValue: "Overview" }), icon: Home, exact: true },
    { to: "/expert/cases", label: t("expert.nav.cases", { defaultValue: "My cases" }), icon: Briefcase },
    { to: "/expert/quotes", label: t("expert.nav.quotes", { defaultValue: "Quotes" }), icon: FileText },
    { to: "/expert/invoices", label: t("expert.nav.invoices", { defaultValue: "Invoices" }), icon: Receipt },
    { to: "/expert/payouts", label: t("expert.nav.payouts", { defaultValue: "Earnings" }), icon: Wallet },
    { to: "/expert/availability", label: t("expert.nav.availability", { defaultValue: "Availability" }), icon: CalendarClock },
    { to: "/expert/profile", label: t("expert.nav.profile", { defaultValue: "Profile" }), icon: UserCircle },
  ];

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <Link to="/expert" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-soft">
            <img src={logoMark} alt="" className="h-6 w-6 object-contain brightness-0 invert" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">BeistandPlus</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
              {t("expert.portalLabel", { defaultValue: "Expert portal" })}
            </div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to as "/expert"}
              activeOptions={{ exact: n.exact ?? false }}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 rounded-xl bg-sidebar-accent/60 p-3 text-sm">
            <div className="truncate font-medium">{name}</div>
            <div className="truncate text-xs text-sidebar-foreground/70">{user?.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg bg-sidebar-primary/10 px-3 py-2 text-sm font-semibold text-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          >
            <LogOut className="h-4 w-4" /> {t("sidebar.signOut", { defaultValue: "Sign out" })}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <MobilePortalNav title={t("expert.portalLabel", { defaultValue: "Expert portal" })} items={NAV} />
          <Link to="/expert" className="flex items-center gap-2 lg:hidden">
            <span className="font-display text-lg font-semibold">{t("expert.shortLabel", { defaultValue: "Expert" })}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden">
              <LogOut className="mr-2 h-4 w-4" /> {t("sidebar.signOut", { defaultValue: "Sign out" })}
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <MfaEnrollmentGate>
            <Outlet />
          </MfaEnrollmentGate>
        </main>
      </div>
    </div>
  );
}
