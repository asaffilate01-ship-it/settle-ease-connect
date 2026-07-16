import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listPartnerPushes, pushInsuranceLeadToPartner } from "@/lib/partner-push.functions";

export const Route = createFileRoute("/_authenticated/portal/partner-push")({
  component: PartnerPushPage,
});

function PartnerPushPage() {
  const list = useServerFn(listPartnerPushes);
  const send = useServerFn(pushInsuranceLeadToPartner);
  const qc = useQueryClient();
  const { data: pushes = [] } = useQuery({ queryKey: ["partner-pushes"], queryFn: () => list() });

  const [leadId, setLeadId] = useState("");
  const [partnerCode, setPartnerCode] = useState("dela");
  const [endpoint, setEndpoint] = useState("https://partner.example.com/leads");
  const [live, setLive] = useState(false);

  const push = useMutation({
    mutationFn: async () => send({ data: { leadId, partnerCode, endpoint, dryRun: !live } }),
    onSuccess: () => {
      toast.success(live ? "Pushed live" : "Recorded dry-run");
      qc.invalidateQueries({ queryKey: ["partner-pushes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-lg font-semibold">Insurance triage → partner API push</h1>
        <p className="text-sm text-muted-foreground">Send a triaged lead to a partner endpoint. Dry-run records payload without calling out.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <Input placeholder="Insurance lead UUID" value={leadId} onChange={(e) => setLeadId(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Partner code (e.g. dela)" value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} />
          <Input placeholder="Endpoint URL" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live send (uncheck for dry-run)
        </label>
        <div>
          <Button disabled={!leadId || push.isPending} onClick={() => push.mutate()}>
            {push.isPending ? "Pushing…" : live ? "Push live" : "Dry-run push"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Recent pushes</h2>
        {pushes.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-sm">
            <div>
              <div className="font-medium">{p.partner_code} → {p.endpoint}</div>
              <div className="text-xs text-muted-foreground">lead {p.lead_id?.slice(0, 8)} · {new Date(p.created_at).toLocaleString()}</div>
            </div>
            <Badge variant="outline">{p.status}{p.response_status ? ` · ${p.response_status}` : ""}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
