import { createFileRoute, Outlet, Link, useNavigate, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { MfaEnrollmentGate } from "@/components/security/mfa-enrollment-gate";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderCommandSearch } from "@/components/header-command-search";
import { NotificationBell } from "@/components/notification-bell";

export const Route = createFileRoute("/_authenticated/portal")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: assignedRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const portalRoles = new Set([
      "admin",
      "staff",
      "case_manager",
      "senior_case_manager",
      "team_leader",
      "insurance_admin",
      "tax_admin",
      "benefits_admin",
      "medical_admin",
      "new_arrival_admin",
      "finance",
      "compliance",
      "dpo",
      "auditor",
    ]);
    if (!(assignedRoles ?? []).some(({ role }) => portalRoles.has(role))) {
      throw redirect({ to: "/app" });
    }
  },
  head: () => ({ meta: [{ title: "Staff portal — BeistandPlus" }] }),
  component: PortalLayout,
});

function PortalLayout() {
  const { user, profile, roles } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const name = profile?.full_name || user?.email?.split("@")[0] || "You";
  const initials =
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const primaryRole = roles[0] ?? "staff";

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
            <SidebarTrigger className="md:hidden" />
            <Link to="/portal" className="flex items-center gap-2 lg:hidden">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-display text-lg font-semibold">Portal</span>
            </Link>
            <HeaderCommandSearch variant="staff" />
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:inline-flex">
                <ShieldCheck className="h-3 w-3 text-primary" /> Staff portal
              </span>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1 text-sm hover:bg-accent/10">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-xs leading-tight font-medium">{name}</div>
                      <div className="text-[10px] leading-tight text-muted-foreground capitalize">
                        {primaryRole.replace("_", " ")}
                      </div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app">Family app</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <MfaEnrollmentGate>
              <Outlet />
            </MfaEnrollmentGate>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
