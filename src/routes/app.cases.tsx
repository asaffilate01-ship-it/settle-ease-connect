import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { mockCases, stageLabels } from "@/lib/mock-data";

export const Route = createFileRoute("/app/cases")({
  component: CasesLayout,
});

function CasesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/app/cases";
  if (isChild) return <Outlet />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Cases</h1>
          <p className="text-sm text-muted-foreground">End-to-end coordination across families and providers.</p>
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
          <Input className="border-0 shadow-none focus-visible:ring-0" placeholder="Search cases…" />
        </div>
        <FilterPill label="All" active />
        <FilterPill label="Urgent" />
        <FilterPill label="Repatriation" />
        <FilterPill label="Berlin" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">Case</th>
              <th className="px-5 py-3 text-left">City / Faith</th>
              <th className="px-5 py-3 text-left">Disposition</th>
              <th className="px-5 py-3 text-left">Stage</th>
              <th className="px-5 py-3 text-left">Case manager</th>
              <th className="px-5 py-3 text-left">Reported</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {mockCases.map((c) => (
              <tr key={c.id} className="cursor-pointer transition-colors hover:bg-parchment/40">
                <td className="px-5 py-4">
                  <Link to="/app/cases/$caseId" params={{ caseId: c.id }} className="block">
                    <div className="font-medium">{c.deceasedName}</div>
                    <div className="text-xs text-muted-foreground">{c.id} · {c.location === "home" ? "At home" : "Hospital"}</div>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <div>{c.city}</div>
                  <div className="text-xs text-muted-foreground">{c.religion}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="capitalize">{c.disposition}</div>
                  {c.destination && <div className="text-xs text-muted-foreground">→ {c.destination}</div>}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={c.stage === "closed" ? "outline" : "secondary"}>
                    {stageLabels[c.stage]}
                  </Badge>
                  {c.urgent && (
                    <Badge className="ml-2 bg-warning/20 text-warning-foreground border border-warning/40">
                      Urgent
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-4">{c.caseManager}</td>
                <td className="px-5 py-4 text-muted-foreground">{c.reportedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
