import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import { raiseEmergencyAlert } from "@/lib/immigration.functions";

const listClientsIAmNominatedFor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me } = await context.supabase.auth.getUser();
    const email = (me?.user?.email ?? "").toLowerCase();
    if (!email) return [];
    const { data, error } = await context.supabase
      .from("trusted_contacts")
      .select("client_user_id, emergency_order")
      .not("emergency_order", "is", null)
      .ilike("email", email);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r) => r.client_user_id)));
    let names = new Map<string, string | null>();
    if (ids.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      names = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
    }
    return rows.map((r) => ({ ...r, profiles: { full_name: names.get(r.client_user_id) ?? null } }));
  });

export const Route = createFileRoute("/_authenticated/app/alert")({
  head: () => ({ meta: [{ title: "Raise an emergency alert" }] }),
  component: AlertPage,
});

function AlertPage() {
  const fetch = useServerFn(listClientsIAmNominatedFor);
  const raise = useServerFn(raiseEmergencyAlert);
  const qc = useQueryClient();
  const { data: nominations = [], isLoading } = useQuery({ queryKey: ["nominations"], queryFn: fetch });
  const [target, setTarget] = useState<string>("");
  const [reason, setReason] = useState("crisis");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    await raise({ data: { client_user_id: target, reason: reason as any, description } });
    setSent(true);
    qc.invalidateQueries({ queryKey: ["nominations"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Emergency channel</span></div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Raise an emergency alert</h1>
        <p className="text-sm text-muted-foreground">If you're listed as a nominated emergency contact for someone, you can alert our team here 24/7. We'll acknowledge and take over.</p>
      </header>

      {sent && <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm text-emerald-700">Alert raised. Our on-call team will contact you shortly.</div>}

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        (nominations as any[]).length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            You aren't currently listed as an emergency contact under this email. Ask the client to add you on their profile.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <div>
              <Label>Who is this about?</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={target} onChange={(e) => setTarget(e.target.value)} required>
                <option value="">— select client —</option>
                {(nominations as any[]).map((n) => (
                  <option key={n.client_user_id} value={n.client_user_id}>{n.profiles?.full_name ?? n.client_user_id.slice(0,8)} (order #{n.emergency_order})</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Reason</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
                {["deceased","hospitalised","missing","crisis","unable_to_contact","other"].map((r) => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happened? Where are they? Any medical details?" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Raise alert</Button>
            </div>
          </form>
        )
      }
    </div>
  );
}
