import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPortalOverview } from "@/lib/portal.functions";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Briefcase, FileText, Mail, Sparkles, Building2, Receipt, FileCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: internal } = await supabase.rpc("is_internal", { _user_id: u.user.id });
    if (!internal) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Staff portal — Beistand" }] }),
  component: PortalOverview,
});

const CARDS = [
  { key: "users", label: "Total users", icon: Users, to: "/portal/admin/users" as const },
  { key: "cases", label: "Cases", icon: Briefcase, to: "/app/cases" as const },
  { key: "leads", label: "Insurance leads", icon: FileText, to: "/portal/leads" as const },
  { key: "pending_invitations", label: "Pending invites", icon: Mail, to: "/portal/admin/invite" as const },
  { key: "experts", label: "Experts", icon: Sparkles, to: "/portal/experts" as const },
  { key: "directory_listings", label: "Directory listings", icon: Building2, to: "/directory" as const },
  { key: "quotes", label: "Case quotes", icon: FileCheck, to: "/app/cases" as const },
  { key: "invoices", label: "Invoices", icon: Receipt, to: "/app/cases" as const },
] as const;

function PortalOverview() {
  const load = useServerFn(getPortalOverview);
  const q = useQuery({ queryKey: ["portal-overview"], queryFn: () => load() });

  if (q.isLoading) return <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;
  if (q.error) return <div className="p-6 text-sm text-destructive">{(q.error as Error).message}</div>;
  const d = q.data!;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Staff portal</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Operations overview</h1>
        <p className="text-sm text-muted-foreground">Everything the case-manager team needs at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} to={c.to} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft hover:border-primary/40 transition">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <div className="mt-3 font-display text-3xl font-semibold">{d.counts[c.key as keyof typeof d.counts]}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h2 className="font-display font-semibold">Recent insurance leads</h2>
            <Link to="/portal/leads" className="text-xs text-primary hover:underline">Open inbox →</Link>
          </div>
          {d.recent_leads.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No leads yet.</div>
          ) : d.recent_leads.map((l: any) => (
            <div key={l.id} className="border-b border-border/40 px-4 py-3 text-sm last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.email}</div>
                </div>
                <Badge variant="outline" className="capitalize">{l.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                €{l.benefit_amount.toLocaleString("de-DE")} cover · est. €{l.estimated_premium_min}–{l.estimated_premium_max}/mo · {new Date(l.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h2 className="font-display font-semibold">Recent cases</h2>
            <Link to="/app/cases" className="text-xs text-primary hover:underline">Open cases →</Link>
          </div>
          {d.recent_cases.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No cases yet.</div>
          ) : d.recent_cases.map((c: any) => (
            <div key={c.id} className="border-b border-border/40 px-4 py-3 text-sm last:border-0 flex items-center justify-between">
              <div className="font-mono text-xs">{c.id.slice(0, 8)}…</div>
              <Badge variant="outline" className="capitalize">{c.status}</Badge>
              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
