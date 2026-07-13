import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listEmergencyAlerts, updateEmergencyAlert, listEmbassies, upsertEmbassy } from "@/lib/immigration.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portal/immigration")({
  head: () => ({
    meta: [
      { title: "Immigration ops — embassies & emergency alerts" },
      { name: "description", content: "Manage embassy directory and respond to emergency alerts raised by client contacts." },
    ],
  }),
  component: PortalImmigrationPage,
});

type Tab = "alerts" | "embassies";

function PortalImmigrationPage() {
  const [tab, setTab] = useState<Tab>("alerts");
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Immigration team ops</div>
        <h1 className="display-lg font-semibold">Immigration & emergency desk</h1>
      </header>
      <div className="flex flex-wrap gap-2 border-b border-border/60">
        {(["alerts", "embassies"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize ${tab === t ? "bg-card border border-b-transparent border-border/60" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>
      {tab === "alerts" ? <AlertsTab /> : <EmbassiesTab />}
    </div>
  );
}

function AlertsTab() {
  const qc = useQueryClient();
  const fetchAlerts = useServerFn(listEmergencyAlerts);
  const update = useServerFn(updateEmergencyAlert);
  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: fetchAlerts });

  async function setStatus(id: string, status: "acknowledged" | "resolved") {
    await update({ data: { id, status } });
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  return (
    <section className="space-y-3">
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No emergency alerts.</div>
        ) : (
          alerts.map((a: any) => (
            <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${a.status === "open" ? "text-red-600" : "text-muted-foreground"}`} />
                    <span className="font-semibold">{a.reason.replace(/_/g, " ")}</span>
                    <Badge variant="secondary">{a.status}</Badge>
                    <span className="text-xs text-muted-foreground">Client: {a.profiles?.full_name ?? a.client_user_id.slice(0, 8)}</span>
                  </div>
                  {a.description && <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>}
                  <div className="mt-1 text-xs text-muted-foreground">Raised {new Date(a.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  {a.status === "open" && <Button size="sm" onClick={() => setStatus(a.id, "acknowledged")}>Acknowledge</Button>}
                  {a.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "resolved")}><CheckCircle2 className="mr-1 h-4 w-4" />Resolve</Button>}
                </div>
              </div>
            </div>
          ))
        )
      }
    </section>
  );
}

function EmbassiesTab() {
  const qc = useQueryClient();
  const fetchEmbassies = useServerFn(listEmbassies);
  const upsert = useServerFn(upsertEmbassy);
  const { data: embassies = [] } = useQuery({ queryKey: ["embassies-admin"], queryFn: () => fetchEmbassies({ data: {} }) });
  const [form, setForm] = useState<any | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    await upsert({
      data: {
        ...form,
        visa_services: (form.visa_services ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
        languages: (form.languages ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      },
    });
    setForm(null);
    qc.invalidateQueries({ queryKey: ["embassies-admin"] });
    qc.invalidateQueries({ queryKey: ["embassies"] });
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm(form ? null : { mission_type: "embassy", visa_services: "", languages: "en,de" })} className="bg-gradient-primary">
          {form ? "Cancel" : "Add mission"}
        </Button>
      </div>
      {form && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-card p-6 sm:grid-cols-2">
          {["country","country_code","city","address","phone","email","website","emergency_phone","visa_services","languages","notes"].map((k) => (
            <div key={k}>
              <Label>{k.replace(/_/g, " ")}</Label>
              <Input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <Label>Mission type</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.mission_type} onChange={(e) => setForm({ ...form, mission_type: e.target.value })}>
              <option value="embassy">embassy</option>
              <option value="consulate_general">consulate_general</option>
              <option value="honorary_consulate">honorary_consulate</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {(embassies as any[]).map((e) => (
          <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{e.country}</span>
              <Badge variant="secondary">{e.mission_type.replace(/_/g, " ")}</Badge>
              <span className="text-xs text-muted-foreground">{e.city}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{e.phone ?? "—"} · {e.email ?? "—"}</div>
            <div className="mt-2 flex justify-end"><Button size="sm" variant="ghost" onClick={() => setForm({ ...e, visa_services: (e.visa_services ?? []).join(", "), languages: (e.languages ?? []).join(", ") })}>Edit</Button></div>
          </div>
        ))}
      </div>
    </section>
  );
}
