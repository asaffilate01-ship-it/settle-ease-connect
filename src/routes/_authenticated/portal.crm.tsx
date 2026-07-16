import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Users, Inbox, GitBranch, MessageSquareWarning } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/crm")({
  head: () => ({ meta: [{ title: "CRM — BeistandPlus" }] }),
  component: CrmLayout,
});

const TABS = [
  { to: "/portal/crm", label: "Inbox", icon: Inbox, exact: true },
  { to: "/portal/crm/contacts", label: "Contacts", icon: Users },
  { to: "/portal/crm/leads", label: "Leads", icon: GitBranch },
  { to: "/portal/crm/complaints", label: "Complaints", icon: MessageSquareWarning },
];

function CrmLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display-lg font-semibold">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Contacts, leads, follow-ups, and complaints — all connected to the customer record.
          </p>
        </div>
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-border/60">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div><Outlet /></div>
    </div>
  );
}
