import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  FileText,
  ShieldCheck,
  Building2,
  Users,
  Settings,
  HeartHandshake,
  BookOpenText,
  GraduationCap,
} from "lucide-react";
import type { ComponentType } from "react";

const nav: { to: string; label: string; icon: ComponentType<{ className?: string }>; exact?: boolean; group?: string }[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/cases", label: "Cases", icon: HeartHandshake },
  { to: "/app/checklists", label: "Checklists", icon: ClipboardList },
  { to: "/app/benefits", label: "Benefits", icon: ShieldCheck },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/providers", label: "Providers", icon: Building2 },
  { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/app/community", label: "Community", icon: Users },
  { to: "/portal/knowledge", label: "Knowledge base", icon: BookOpenText, group: "Internal" },
  { to: "/portal/experts", label: "Experts roster", icon: GraduationCap, group: "Internal" },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="font-display text-lg font-semibold">B</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight">Beistand</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            Dashboard
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((n, i) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          const showGroupHeader = n.group && nav[i - 1]?.group !== n.group;
          return (
            <div key={n.to}>
              {showGroupHeader && (
                <div className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
                  {n.group}
                </div>
              )}
              <Link
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-sidebar-accent/60 p-4 text-sm">
          <div className="font-medium text-sidebar-foreground">Fatima Rehman</div>
          <div className="text-xs text-sidebar-foreground/70">Case Manager · Berlin</div>
        </div>
      </div>
    </aside>
  );
}
