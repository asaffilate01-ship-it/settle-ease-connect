import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalHeader } from "@/components/portal/portal-header";
import { listCases } from "@/lib/cases.functions";
import { Building2, DollarSign, Star, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/funeral")({
  head: () => ({
    meta: [
      { title: "Funeral Director portal — BeistandPlus" },
      {
        name: "description",
        content:
          "Receive referrals, upload quotes and invoices, and coordinate with families in one portal.",
      },
    ],
  }),
  component: FuneralPortal,
});

const casesQuery = queryOptions({
  queryKey: ["cases", "portal-funeral"],
  queryFn: () => listCases(),
});

function FuneralPortal() {
  const { data: cases = [], isLoading } = useQuery(casesQuery);
  const referrals = cases.filter(
    (c) =>
      c.case_type === "bereavement" && !["closed", "cancelled", "completed"].includes(c.status),
  );

  return (
    <div className="space-y-6">
      <PortalHeader
        crumbs={[{ label: "Partners" }, { label: "Funeral" }]}
        title="Funeral network"
        subtitle="Live referrals from bereavement cases across the network."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/expert/availability">Availability</Link>
            </Button>
            <Button className="bg-gradient-primary" asChild>
              <Link to="/expert/invoices">Invoice workspace</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={ClipboardCheck} label="Active referrals" value={referrals.length.toString()} />
        <Stat icon={DollarSign} label="Invoices" value="Workspace" />
        <Stat icon={Building2} label="Response" value="SLA tracked" />
        <Stat icon={Star} label="Ratings" value="Post-case" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-display text-xl font-semibold">Incoming referrals</h2>
          <Badge variant="outline">Auto-assigned by BeistandPlus</Badge>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : referrals.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No active bereavement referrals right now.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left">Case</th>
                  <th className="px-6 py-3 text-left">City / language</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Opened</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {referrals.map((c) => (
                  <tr key={c.id} className="hover:bg-parchment/40">
                    <td className="px-6 py-4">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.reference}
                        {c.urgent ? " · Urgent" : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{c.city ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.bundesland ?? ""}
                        {c.language ? ` · ${c.language}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="capitalize">
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {c.opened_at ? new Date(c.opened_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/app/cases/$caseId"
                        params={{ caseId: c.id }}
                        className="text-sm text-primary hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
