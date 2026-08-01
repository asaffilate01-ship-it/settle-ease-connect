import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const casesQuery = queryOptions({
  queryKey: ["cases", "list"],
  queryFn: () => listCases(),
});

export const Route = createFileRoute("/_authenticated/app/cases")({
  loader: ({ context }) => context.queryClient.ensureQueryData(casesQuery),
  component: CasesLayout,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
});

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  triage: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  awaiting_client: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  awaiting_expert: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  on_hold: "bg-muted text-muted-foreground border-border",
  completed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function CasesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/app/cases";
  if (isChild) return <Outlet />;
  return <CasesList />;
}

function CasesList() {
  const { data: cases } = useSuspenseQuery(casesQuery);
  const qc = useQueryClient();

  // Realtime: refresh list on any case change
  useEffect(() => {
    const ch = supabase
      .channel(`cases-list:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => {
        qc.invalidateQueries({ queryKey: ["cases", "list"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg font-semibold">Cases</h1>
          <p className="text-sm text-muted-foreground">Live coordination across families, case managers, and experts.</p>
        </div>
        <Button asChild className="bg-gradient-primary">
          <Link to="/app/cases/new"><Plus className="mr-1 h-4 w-4" /> New case</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input className="border-0 shadow-none focus-visible:ring-0" placeholder="Search cases…" />
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center">
          <div className="font-display text-lg">No cases yet</div>
          <p className="mt-1 text-sm text-muted-foreground">Open a case and a manager will respond within 15 minutes.</p>
          <Button asChild className="mt-4 bg-gradient-primary"><Link to="/app/cases/new">Report a case</Link></Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Case</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Location</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {cases.map((c) => (
                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-parchment/40">
                  <td className="px-5 py-4">
                    <Link to="/app/cases/$caseId" params={{ caseId: c.id }} className="block">
                      <div className="flex items-center gap-2 font-medium">
                        {c.urgent && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {c.title}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.reference}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 capitalize text-muted-foreground">{c.case_type.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4">{c.city ?? "—"}<div className="text-xs text-muted-foreground">{c.bundesland ?? ""}</div></td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={STATUS_STYLES[c.status] ?? ""}>
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Suppress unused-import warnings for helpers wired in child routes
void useMutation; void useNavigate; void useServerFn;
