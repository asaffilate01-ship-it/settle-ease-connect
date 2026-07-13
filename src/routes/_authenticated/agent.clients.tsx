import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addManualReferral, getMyAgentProfile, listMyReferrals } from "@/lib/agents.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agent/clients")({
  head: () => ({ meta: [{ title: "Agent — my clients" }] }),
  component: AgentClients,
});

const PRODUCT_VALUES = ["subscription_basic", "subscription_plus", "subscription_complete", "funeral_cover", "group_cover"] as const;
type ProductValue = typeof PRODUCT_VALUES[number];

function AgentClients() {
  const { t } = useTranslation();
  const listFn = useServerFn(listMyReferrals);
  const addFn = useServerFn(addManualReferral);
  const profileFn = useServerFn(getMyAgentProfile);
  const qc = useQueryClient();

  const products: { value: ProductValue; label: string }[] = [
    { value: "subscription_basic", label: t("agent.products.basic", { defaultValue: "Subscription — Basic €5/mo" }) },
    { value: "subscription_plus", label: t("agent.products.plus", { defaultValue: "Subscription — Plus €10/mo" }) },
    { value: "subscription_complete", label: t("agent.products.complete", { defaultValue: "Subscription — Complete €25/mo" }) },
    { value: "funeral_cover", label: t("agent.products.funeral", { defaultValue: "Funeral cover" }) },
    { value: "group_cover", label: t("agent.products.group", { defaultValue: "Group cover" }) },
  ];

  const { data = [] } = useQuery({ queryKey: ["agent", "referrals"], queryFn: () => listFn() });
  const { data: profile } = useQuery({ queryKey: ["agent", "profile"], queryFn: () => profileFn() });
  const rate = Number(profile?.commission_rate ?? 5);

  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<ProductValue>("subscription_plus");
  const [notes, setNotes] = useState("");

  const add = useMutation({
    mutationFn: (input: { referredEmail: string; product: ProductValue; notes?: string }) =>
      addFn({ data: input }),
    onSuccess: () => {
      toast.success(t("agent.clients.logged", { defaultValue: "Referral logged" }));
      qc.invalidateQueries({ queryKey: ["agent", "referrals"] });
      qc.invalidateQueries({ queryKey: ["agent", "kpis"] });
      setEmail("");
      setNotes("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("agent.clients.saveFail", { defaultValue: "Could not save" })),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">{t("agent.clients.title", { defaultValue: "My clients" })}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("agent.clients.subtitle", {
            defaultValue: "Every subscription you sell earns {{rate}}% of the monthly fee, for as long as the client stays with us. Note: we sell funeral cover, not funeral insurance.",
            rate,
          })}
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">
          {t("agent.clients.logNew", { defaultValue: "Log a new referral" })}
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email) return;
            add.mutate({ referredEmail: email, product, notes: notes || undefined });
          }}
        >
          <div>
            <Label htmlFor="agent-client-email">{t("agent.clients.emailLabel", { defaultValue: "Client email" })}</Label>
            <Input id="agent-client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="agent-client-product">{t("agent.clients.productLabel", { defaultValue: "Product" })}</Label>
            <select
              id="agent-client-product"
              value={product}
              onChange={(e) => setProduct(e.target.value as ProductValue)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {products.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="agent-client-notes">{t("agent.clients.notesLabel", { defaultValue: "Notes (optional)" })}</Label>
            <Input id="agent-client-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("agent.clients.notesPh", { defaultValue: "Language, city, follow-up date…" })} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? t("agent.clients.saving", { defaultValue: "Saving…" }) : t("agent.clients.submit", { defaultValue: "Log referral" })}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">
          {t("agent.clients.all", { defaultValue: "All referrals" })}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">{t("agent.table.when", { defaultValue: "When" })}</th>
                <th className="p-3">{t("agent.table.email", { defaultValue: "Email" })}</th>
                <th className="p-3">{t("agent.table.product", { defaultValue: "Product" })}</th>
                <th className="p-3">{t("agent.table.source", { defaultValue: "Source" })}</th>
                <th className="p-3">{t("agent.table.status", { defaultValue: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{r.referred_email ?? "—"}</td>
                  <td className="p-3">{r.product ?? "—"}</td>
                  <td className="p-3">{r.source}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("agent.clients.empty", { defaultValue: "No referrals yet." })}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
