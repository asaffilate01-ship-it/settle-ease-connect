import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCrmLeads } from "@/lib/crm.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  "new",
  "contact_attempted",
  "assessed",
  "consented",
  "service_identified",
  "membership_proposed",
  "insurance_referral_offered",
  "referred_to_partner",
  "partner_outcome",
  "onboarded",
  "ongoing",
  "lost",
] as const;

const STAGE_TONE: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-700",
  contact_attempted: "bg-cyan-500/15 text-cyan-700",
  assessed: "bg-teal-500/15 text-teal-700",
  consented: "bg-emerald-500/15 text-emerald-700",
  service_identified: "bg-lime-500/15 text-lime-700",
  membership_proposed: "bg-yellow-500/15 text-yellow-800",
  insurance_referral_offered: "bg-orange-500/15 text-orange-700",
  referred_to_partner: "bg-purple-500/15 text-purple-700",
  partner_outcome: "bg-violet-500/15 text-violet-700",
  onboarded: "bg-primary/15 text-primary",
  ongoing: "bg-primary/15 text-primary",
  lost: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/_authenticated/portal/crm/leads/")({
  component: LeadsKanban,
});

function LeadsKanban() {
  const fn = useServerFn(listCrmLeads);
  const { data: leads, isLoading } = useQuery({
    queryKey: ["crm-leads-all"],
    queryFn: () => fn({ data: {} }),
  });

  if (isLoading || !leads)
    return <div className="text-sm text-muted-foreground">Loading leads…</div>;

  const byStage: Record<string, any[]> = {};
  STAGES.forEach((s) => (byStage[s] = []));
  leads.forEach((l: any) => {
    (byStage[l.stage] ??= []).push(l);
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-3">
        {STAGES.map((s) => (
          <div key={s} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <div
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_TONE[s]}`}
              >
                {s.replaceAll("_", " ")}
              </div>
              <span className="text-xs text-muted-foreground">{byStage[s].length}</span>
            </div>
            <div className="space-y-2">
              {byStage[s].length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
              {byStage[s].map((l) => (
                <Link key={l.id} to="/portal/crm/leads/$leadId" params={{ leadId: l.id }}>
                  <Card className="hover:border-primary/60 transition-colors">
                    <CardContent className="p-3 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{l.reference}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {l.lead_type}
                        </Badge>
                      </div>
                      {l.notes && (
                        <div className="line-clamp-2 text-xs text-muted-foreground">{l.notes}</div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{l.priority}</span>
                        <span>{new Date(l.updated_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
