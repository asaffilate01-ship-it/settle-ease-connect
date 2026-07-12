import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalHeader } from "@/components/portal/portal-header";
import { mockCases, stageLabels } from "@/lib/mock-data";
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

function FuneralPortal() {
  const referrals = mockCases.filter((c) => c.stage !== "closed");
  return (
    <div className="space-y-6">
      <PortalHeader
        crumbs={[{ label: "Partners" }, { label: "Funeral" }]}
        title="Furkan Bestattungen · Berlin"
        subtitle="Preview surface — real referrals wire in during the next portal-rebuild step."
        actions={
          <>
            <Button variant="outline">Availability</Button>
            <Button className="bg-gradient-primary">Upload invoice</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={ClipboardCheck} label="Active referrals" value={referrals.length.toString()} />
        <Stat icon={DollarSign} label="Invoiced this month" value="€18,420" />
        <Stat icon={Building2} label="Avg. response" value="12 min" />
        <Stat icon={Star} label="Family rating" value="4.9" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-display text-xl font-semibold">Incoming referrals</h2>
          <Badge variant="outline">Auto-assigned by BeistandPlus</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">Case</th>
                <th className="px-6 py-3 text-left">Faith / disposition</th>
                <th className="px-6 py-3 text-left">Stage</th>
                <th className="px-6 py-3 text-left">Family</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {referrals.map((c) => (
                <tr key={c.id} className="hover:bg-parchment/40">
                  <td className="px-6 py-4">
                    <div className="font-medium">{c.deceasedName}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.id} · {c.city}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{c.religion}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {c.disposition}
                      {c.destination ? ` → ${c.destination}` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{stageLabels[c.stage]}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div>{c.familyContact}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
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
