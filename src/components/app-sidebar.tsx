import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Icon3D, type Icon3DName } from "@/components/icon3d";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useCurrentUser } from "@/hooks/use-current-user";

type NavItem = {
  to: string;
  labelKey: string;
  icon: Icon3DName;
  exact?: boolean;
  groupKey?: string;
  requiresRole?: "admin";
};

const nav: NavItem[] = [
  { to: "/app", labelKey: "sidebar.overview", icon: "overview", exact: true },
  { to: "/app/cases", labelKey: "sidebar.cases", icon: "cases" },
  { to: "/app/checklists", labelKey: "sidebar.checklists", icon: "checklists" },
  { to: "/app/benefits", labelKey: "sidebar.benefits", icon: "benefits" },
  { to: "/app/documents", labelKey: "sidebar.documents", icon: "documents" },
  { to: "/app/providers", labelKey: "sidebar.providers", icon: "providers" },
  { to: "/app/assistant", labelKey: "sidebar.assistant", icon: "assistant" },
  { to: "/app/community", labelKey: "sidebar.community", icon: "community" },
  { to: "/portal/knowledge", labelKey: "sidebar.knowledge", icon: "knowledge", groupKey: "sidebar.internal" },
  { to: "/portal/experts", labelKey: "sidebar.experts", icon: "experts", groupKey: "sidebar.internal" },
  { to: "/portal/admin/users", labelKey: "sidebar.adminUsers", icon: "experts", groupKey: "sidebar.admin", requiresRole: "admin" },
  { to: "/portal/admin/invite", labelKey: "sidebar.adminInvite", icon: "providers", groupKey: "sidebar.admin", requiresRole: "admin" },
  { to: "/app/settings", labelKey: "sidebar.settings", icon: "settings" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const { roles } = useCurrentUser();
  const isAdmin = roles.includes("admin");
  const visibleNav = nav.filter((n) => !n.requiresRole || (n.requiresRole === "admin" && isAdmin));
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="font-display text-lg font-semibold">B</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight">Beistand</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            {t("sidebar.dashboard")}
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visibleNav.map((n, i) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          const showGroupHeader = n.groupKey && visibleNav[i - 1]?.groupKey !== n.groupKey;
          return (
            <div key={n.to}>
              {showGroupHeader && n.groupKey && (
                <div className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
                  {t(n.groupKey)}
                </div>
              )}
              <Link
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center">
                  <Icon3D name={n.icon} alt="" />
                </span>
                {t(n.labelKey)}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-sidebar-border p-4">
        <LanguageSwitcher variant="sidebar" />
        <div className="rounded-xl bg-sidebar-accent/60 p-4 text-sm">
          <div className="font-medium text-sidebar-foreground">Fatima Rehman</div>
          <div className="text-xs text-sidebar-foreground/70">{t("sidebar.caseManagerRole")}</div>
        </div>
      </div>
    </aside>
  );
}
