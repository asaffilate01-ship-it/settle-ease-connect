import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addManualReferral, listMyReferrals } from "@/lib/agents.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agent/clients")({
  head: () => ({ meta: [{ title: "Agent — my clients" }] }),
  component: AgentClients,
});

const PRODUCTS = [
  { value: "subscription_basic", label: "Subscription — Basic €5/mo" },
  { value: "subscription_plus", label: "Subscription — Plus €10/mo" },
  { value: "subscription_complete", label: "Subscription — Complete €25/mo" },
  { value: "funeral_cover", label: "Funeral cover" },
  { value: "group_cover", label: "Group cover" },
] as const;

function AgentClients() {
  const listFn = useServerFn(listMyReferrals);
  const addFn = useServerFn(addManualReferral);
  const qc = useQueryClient();

  const { data = [] } = useQuery({ queryKey: ["agent", "referrals"], queryFn: () => listFn() });
  const add = useMutation({
    mutationFn: (input: { referredEmail: string; product: typeof PRODUCTS[number]["value"]; notes?: string }) =>
      addFn({ data: input }),
    onSuccess: () => {
      toast.success("Referral logged");
      qc.invalidateQueries({ queryKey: ["agent", "referrals"] });
      qc.invalidateQueries({ queryKey: ["agent", "kpis"] });
      setEmail("");
      setNotes("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<typeof PRODUCTS[number]["value"]>("subscription_plus");
  const [notes, setNotes] = useState("");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">My clients</h1>
        <p className="mt-1 text-muted-foreground">
          Every subscription you sell earns 5% of the monthly fee, for as long as the client stays with us.
          Note: we sell <strong>funeral cover</strong>, not funeral insurance.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Log a new referral</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email) return;
            add.mutate({ referredEmail: email, product, notes: notes || undefined });
          }}
        >
          <div>
            <Label htmlFor="email">Client email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="product">Product</Label>
            <select
              id="product"
              value={product}
              onChange={(e) => setProduct(e.target.value as typeof product)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PRODUCTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Language, city, follow-up date…" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={add.isPending}>{add.isPending ? "Saving…" : "Log referral"}</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">All referrals</h2>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Email</th>
                <th className="p-3">Product</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
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
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No referrals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
