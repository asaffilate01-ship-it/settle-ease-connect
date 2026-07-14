import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Wallet, Clock } from "lucide-react";
import { listEscrowInvoices, releaseEscrow, autoReleaseEligibleEscrow } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/portal/escrow")({
  head: () => ({ meta: [{ title: "Escrow release — Staff" }] }),
  component: EscrowPage,
});

type Tab = "held_escrow" | "released";

function EscrowPage() {
  const [tab, setTab] = useState<Tab>("held_escrow");
  const listFn = useServerFn(listEscrowInvoices);
  const releaseFn = useServerFn(releaseEscrow);
  const autoFn = useServerFn(autoReleaseEligibleEscrow);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["portal", "escrow", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const mut = useMutation({
    mutationFn: (invoiceId: string) => releaseFn({ data: { invoiceId } }),
    onSuccess: () => {
      toast.success("Escrow released — payout queued");
      qc.invalidateQueries({ queryKey: ["portal", "escrow"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoMut = useMutation({
    mutationFn: () => autoFn({ data: { olderThanDays: 14 } }),
    onSuccess: (r: any) => {
      toast.success(`Auto-released ${r.released_count} invoice(s)${r.failed_count ? ` · ${r.failed_count} failed` : ""}`);
      qc.invalidateQueries({ queryKey: ["portal", "escrow"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold">Escrow release</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Client funds held on paid invoices. Release once expert work is delivered — creates a pending payout row.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border/60">
        {(["held_escrow", "released"] as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {k === "held_escrow" ? "Held in escrow" : "Released"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No invoices in this state.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((inv: any) => (
            <div key={inv.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{inv.experts?.full_name ?? "—"}</div>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {inv.experts?.compensation_model ?? "—"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {inv.experts?.profession} · Case {inv.case_id.slice(0, 8)} · Invoice {inv.id.slice(0, 8)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>
                      <span className="text-muted-foreground">Client paid:</span>{" "}
                      <span className="font-medium">€{Number(inv.amount_eur ?? 0).toFixed(2)}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Platform fee:</span>{" "}
                      <span className="font-medium">€{Number(inv.platform_fee_eur ?? 0).toFixed(2)}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Payout:</span>{" "}
                      <span className="font-medium text-primary">
                        €{Number(inv.payout_to_expert_eur ?? inv.amount_eur ?? 0).toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tab === "held_escrow" ? (
                    <Button
                      size="sm"
                      onClick={() => mut.mutate(inv.id)}
                      disabled={mut.isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Release
                    </Button>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> {inv.released_at?.slice(0, 10)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
