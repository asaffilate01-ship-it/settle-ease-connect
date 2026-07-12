import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Icon3D, type Icon3DName } from "@/components/icon3d";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { primaryRole } from "@/lib/role-landing";

type Audience = "client" | "internal" | "any";

type NavItem = {
  to: string;
  labelKey: string;
  icon: Icon3DName;
  exact?: boolean;
  groupKey?: string;
  requiresRole?: "admin" | "internal";
  audience?: Audience; // client = only for non-internal; internal = only for internal; any = both
};

const nav: NavItem[] = [
  { to: "/app", labelKey: "sidebar.overview", icon: "overview", exact: true, audience: "client" },
  { to: "/app/cases", labelKey: "sidebar.cases", icon: "cases", audience: "client" },
  { to: "/app/checklists", labelKey: "sidebar.checklists", icon: "checklists", audience: "client" },
  { to: "/app/benefits", labelKey: "sidebar.benefits", icon: "benefits", audience: "client" },
  { to: "/app/documents", labelKey: "sidebar.documents", icon: "documents", audience: "client" },
  { to: "/app/providers", labelKey: "sidebar.providers", icon: "providers", audience: "client" },
  { to: "/app/insurance", labelKey: "sidebar.insurance", icon: "providers", audience: "client" },
  { to: "/app/assistant", labelKey: "sidebar.assistant", icon: "assistant", audience: "any" },
  { to: "/app/community", labelKey: "sidebar.community", icon: "community", audience: "client" },
  { to: "/portal", labelKey: "sidebar.staffPortal", icon: "overview", groupKey: "sidebar.internal", requiresRole: "internal", audience: "internal" },
  { to: "/portal/leads", labelKey: "sidebar.leads", icon: "benefits", groupKey: "sidebar.internal", requiresRole: "internal", audience: "internal" },
  { to: "/portal/insurance", labelKey: "sidebar.insuranceOps", icon: "providers", groupKey: "sidebar.internal", requiresRole: "internal", audience: "internal" },
  { to: "/portal/knowledge", labelKey: "sidebar.knowledge", icon: "knowledge", groupKey: "sidebar.internal", requiresRole: "internal", audience: "internal" },
  { to: "/portal/experts", labelKey: "sidebar.experts", icon: "experts", groupKey: "sidebar.internal", requiresRole: "internal", audience: "internal" },
  { to: "/portal/admin/users", labelKey: "sidebar.adminUsers", icon: "experts", groupKey: "sidebar.admin", requiresRole: "admin", audience: "internal" },
  { to: "/portal/admin/invite", labelKey: "sidebar.adminInvite", icon: "providers", groupKey: "sidebar.admin", requiresRole: "admin", audience: "internal" },
  { to: "/app/bugs", labelKey: "sidebar.bugs", icon: "bug", audience: "any" },
  { to: "/app/settings", labelKey: "sidebar.settings", icon: "settings", audience: "any" },
];

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  staff: "Staff",
  case_manager: "Case Manager",
  insurance_admin: "Insurance Admin",
  tax_admin: "Tax Admin",
  benefits_admin: "Benefits Admin",
  medical_admin: "Medical Admin",
  new_arrival_admin: "New Arrival Admin",
  lawyer: "Lawyer",
  accountant: "Accountant",
  doctor: "Doctor",
  notary: "Notary",
  translator: "Translator",
  social_worker: "Social Worker",
  expert: "Expert",
  funeral_director: "Funeral Director",
  mosque: "Mosque Partner",
  church: "Church Partner",
  temple: "Temple Partner",
  hospital: "Hospital Partner",
  beneficiary: "Beneficiary",
  family: "Family",
};

const ROLE_TONE: Record<AppRole, string> = {
  admin: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  staff: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  case_manager: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  insurance_admin: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  tax_admin: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  benefits_admin: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
  medical_admin: "bg-pink-500/15 text-pink-600 dark:text-pink-300",
  new_arrival_admin: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
  lawyer: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  accountant: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  doctor: "bg-red-500/15 text-red-600 dark:text-red-300",
  notary: "bg-stone-500/15 text-stone-600 dark:text-stone-300",
  translator: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
  social_worker: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  expert: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  funeral_director: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  mosque: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  church: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  temple: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  hospital: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  beneficiary: "bg-primary/15 text-primary",
  family: "bg-primary/15 text-primary",
};

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const { user, profile, roles, loading } = useCurrentUser();
  const isAdmin = roles.includes("admin");
  const isInternal = isAdmin || roles.includes("staff") || roles.includes("case_manager");
  const audience: Audience = isInternal ? "internal" : "client";

  const visibleNav = nav.filter((n) => {
    if (n.requiresRole === "admin" && !isAdmin) return false;
    if (n.requiresRole === "internal" && !isInternal) return false;
    if (n.audience && n.audience !== "any" && n.audience !== audience) return false;
    return true;
  });

  const role = primaryRole(roles);
  const displayName =
    profile?.full_name ||
    (user?.user_metadata as Record<string, string> | undefined)?.full_name ||
    (user?.user_metadata as Record<string, string> | undefined)?.name ||
    user?.email?.split("@")[0] ||
    (loading ? "…" : "Guest");
  const roleLabel = role ? ROLE_LABEL[role] : loading ? "" : "No role assigned";
  const roleTone = role ? ROLE_TONE[role] : "bg-muted text-muted-foreground";

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="font-display text-lg font-semibold">B</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight">Beistand</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            {isInternal ? t("sidebar.internal", { defaultValue: "Staff Portal" }) : t("sidebar.dashboard")}
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
          <div className="flex items-center justify-between gap-2">
            <div className="truncate font-medium text-sidebar-foreground">{displayName}</div>
            {roleLabel && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleTone}`}>
                {roleLabel}
              </span>
            )}
          </div>
          {user?.email && (
            <div className="mt-1 truncate text-xs text-sidebar-foreground/70">{user.email}</div>
          )}
        </div>
      </div>
    </aside>
  );
}
