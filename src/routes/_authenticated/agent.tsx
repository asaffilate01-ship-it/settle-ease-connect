import { createFileRoute, Outlet, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut, Users, TrendingUp, LinkIcon, Home } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import logoMark from "@/assets/brand/logo-mark.png";

export const Route = createFileRoute("/_authenticated/agent")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const [{ data: agentOk }, { data: internal }] = await Promise.all([
      supabase.rpc("is_agent", { _user_id: u.user.id }),
      supabase.rpc("is_internal", { _user_id: u.user.id }),
    ]);
    if (!agentOk && !internal) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Agent portal — BeistandPlus" }] }),
  component: AgentLayout,
});

const NAV = [
  { to: "/agent", label: "Overview", icon: Home, exact: true },
  { to: "/agent/clients", label: "My clients", icon: Users },
  { to: "/agent/commissions", label: "Commissions", icon: TrendingUp },
  { to: "/agent/link", label: "Referral link", icon: LinkIcon },
] as const;

function AgentLayout() {
  const { user, profile } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const name = profile?.full_name || user?.email?.split("@")[0] || "Agent";

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <Link to="/agent" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-soft">
            <img src={logoMark} alt="" className="h-6 w-6 object-contain brightness-0 invert" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">BeistandPlus</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Agent portal</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
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
            <div className="font-medium">{name}</div>
            <div className="truncate text-xs text-sidebar-foreground/70">{user?.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg bg-sidebar-primary/10 px-3 py-2 text-sm font-semibold text-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <Link to="/agent" className="flex items-center gap-2 lg:hidden">
            <span className="font-display text-lg font-semibold">Agent</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Agent · 5% recurring
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
