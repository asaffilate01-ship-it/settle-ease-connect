import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { CaseResponsibility } from "@/components/cases/case-responsibility";

const casesQuery = queryOptions({
  queryKey: ["cases", "list"],
  queryFn: () => listCases(),
});

export const Route = createFileRoute("/_authenticated/app/cases")({
  loader: ({ context }) => context.queryClient.ensureQueryData(casesQuery),
  component: CasesLayout,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
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
  const [query, setQuery] = useState("");
  const filteredCases = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return cases;
    return cases.filter((item) =>
      [item.title, item.reference, item.case_type, item.status, item.city, item.bundesland].some(
        (field) => field?.toLocaleLowerCase().includes(value),
      ),
    );
  }, [cases, query]);

  // Realtime: refresh list on any case change
  useEffect(() => {
    const ch = supabase
      .channel(`cases-list:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => {
        qc.invalidateQueries({ queryKey: ["cases", "list"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg font-semibold">Cases</h1>
          <p className="text-sm text-muted-foreground">
            Live coordination across families, case managers, and experts.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary">
          <Link to="/app/cases/new">
            <Plus className="mr-1 h-4 w-4" /> New case
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0"
            placeholder="Search cases…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search cases"
          />
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center">
          <div className="font-display text-lg">No cases yet</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a case and the team will respond during the published service hours.
          </p>
          <Button asChild className="mt-4 bg-gradient-primary">
            <Link to="/app/cases/new">Report a case</Link>
          </Button>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center">
          <div className="font-medium">No cases match “{query}”</div>
          <button
            className="mt-2 text-sm text-primary hover:underline"
            onClick={() => setQuery("")}
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filteredCases.map((item) => (
              <Link
                key={item.id}
                to="/app/cases/$caseId"
                params={{ caseId: item.id }}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {item.urgent && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
                      <span className="truncate">{item.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.reference}</div>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[item.status] ?? ""}>
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3">
                  <CaseResponsibility status={item.status} compact />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{item.case_type.replace(/_/g, " ")}</span>
                  <span>{formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft md:block">
            <table className="w-full text-sm">
              <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Case</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Next action</th>
                  <th className="px-5 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCases.map((c) => (
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
                    <td className="px-5 py-4 capitalize text-muted-foreground">
                      {c.case_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-4">
                      {c.city ?? "—"}
                      <div className="text-xs text-muted-foreground">{c.bundesland ?? ""}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={STATUS_STYLES[c.status] ?? ""}>
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <CaseResponsibility status={c.status} compact />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
