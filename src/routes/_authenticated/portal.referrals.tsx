import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  listReferralPartners,
  listReferralLeads,
  updateReferralLead,
  upsertReferralPartner,
  buildReferralUrl,
} from "@/lib/referrals.functions";

export const Route = createFileRoute("/_authenticated/portal/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — pipeline & partners" },
      {
        name: "description",
        content: "Track referral leads, partner catalog and commission revenue.",
      },
    ],
  }),
  component: ReferralsPage,
});

type Tab = "pipeline" | "partners" | "revenue";
const STATUSES = [
  "sent",
  "clicked",
  "registered",
  "converted",
  "paid",
  "clawback",
  "rejected",
] as const;
const CATEGORIES = [
  "insurer_health",
  "insurer_life",
  "insurer_disability",
  "insurer_liability",
  "insurer_household",
  "insurer_car",
  "insurer_travel",
  "lawyer",
  "notary",
  "tax_advisor",
  "accountant",
  "mover",
  "airline",
  "travel",
  "fx",
  "language_school",
  "driving_school",
  "real_estate",
  "utilities",
  "telecom",
  "other",
];
const MODELS = ["flat", "percent_first", "percent_recurring", "cpl", "cpa"] as const;

function money(cents?: number | null, currency = "EUR") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100);
}

function ReferralsPage() {
  const [tab, setTab] = useState<Tab>("pipeline");
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Revenue ops
        </div>
        <h1 className="display-lg font-semibold">Referrals</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track outbound leads to insurers, lawyers, tax advisors, movers, airlines and other
          partners — and the commission we earn from each.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border/60">
        {(["pipeline", "revenue", "partners"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "bg-card border border-b-transparent border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "pipeline" && <PipelineTab />}
      {tab === "revenue" && <RevenueTab />}
      {tab === "partners" && <PartnersTab />}
    </div>
  );
}

function PipelineTab() {
  const qc = useQueryClient();
  const fetchLeads = useServerFn(listReferralLeads);
  const update = useServerFn(updateReferralLead);
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["ref_leads"],
    queryFn: fetchLeads,
  });
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? leads : leads.filter((l: any) => l.status === filter);

  async function setStatus(id: string, status: string) {
    await update({ data: { id, status: status as any } });
    qc.invalidateQueries({ queryKey: ["ref_leads"] });
  }
  async function setCommission(
    id: string,
    field: "commission_expected_cents" | "commission_received_cents",
    euros: string,
  ) {
    const cents = Math.round(parseFloat(euros || "0") * 100);
    await update({ data: { id, [field]: cents } as any });
    qc.invalidateQueries({ queryKey: ["ref_leads"] });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as string[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {s}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No leads in this stage yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Partner</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Received</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <tr key={l.id} className="border-b border-border/40">
                  <td className="p-3">
                    <div className="font-medium">{l.referral_partners?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.referral_partners?.category?.replace(/_/g, " ")} ·{" "}
                      {l.referral_partners?.commission_model}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{l.source_page ?? "—"}</td>
                  <td className="p-3">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <Input
                      defaultValue={(l.commission_expected_cents ?? 0) / 100}
                      onBlur={(e) =>
                        setCommission(l.id, "commission_expected_cents", e.target.value)
                      }
                      className="h-8 w-24"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      defaultValue={(l.commission_received_cents ?? 0) / 100}
                      onBlur={(e) =>
                        setCommission(l.id, "commission_received_cents", e.target.value)
                      }
                      className="h-8 w-24"
                    />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RevenueTab() {
  const fetchLeads = useServerFn(listReferralLeads);
  const { data: leads = [] } = useQuery({ queryKey: ["ref_leads"], queryFn: fetchLeads });

  const stats = useMemo(() => {
    const byCat: Record<string, { expected: number; received: number; count: number }> = {};
    let expected = 0,
      received = 0;
    for (const l of leads as any[]) {
      const cat = l.referral_partners?.category ?? "other";
      const e = l.commission_expected_cents ?? 0;
      const r = l.commission_received_cents ?? 0;
      expected += e;
      received += r;
      (byCat[cat] ??= { expected: 0, received: 0, count: 0 }).expected += e;
      byCat[cat].received += r;
      byCat[cat].count++;
    }
    return { expected, received, byCat };
  }, [leads]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Leads (all-time)" value={String(leads.length)} />
        <StatCard label="Commission expected" value={money(stats.expected)} />
        <StatCard
          label="Commission received"
          value={money(stats.received)}
          tone="text-emerald-600"
        />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 p-4 font-semibold">By partner category</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Category</th>
              <th className="p-3">Leads</th>
              <th className="p-3">Expected</th>
              <th className="p-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.byCat)
              .sort((a, b) => b[1].received - a[1].received)
              .map(([cat, s]) => (
                <tr key={cat} className="border-t border-border/40">
                  <td className="p-3 capitalize">{cat.replace(/_/g, " ")}</td>
                  <td className="p-3">{s.count}</td>
                  <td className="p-3">{money(s.expected)}</td>
                  <td className="p-3">{money(s.received)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-2xl font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function PartnersTab() {
  const qc = useQueryClient();
  const fetchPartners = useServerFn(listReferralPartners);
  const upsert = useServerFn(upsertReferralPartner);
  const { data: partners = [] } = useQuery({
    queryKey: ["ref_partners"],
    queryFn: () => fetchPartners({ data: {} }),
  });
  const [form, setForm] = useState<any | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = {
      ...form,
      commission_rate: parseFloat(form.commission_rate ?? "0"),
      commission_flat_cents: parseInt(form.commission_flat_cents ?? "0", 10),
      disclose_to_client: !!form.disclose_to_client,
      active: form.active ?? true,
    };
    await upsert({ data: payload });
    setForm(null);
    qc.invalidateQueries({ queryKey: ["ref_partners"] });
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() =>
            setForm(
              form
                ? null
                : {
                    commission_model: "cpa",
                    commission_rate: "0",
                    commission_flat_cents: "0",
                    active: true,
                  },
            )
          }
          className="bg-gradient-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          {form ? "Cancel" : "Add partner"}
        </Button>
      </div>

      {form && (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-border/60 bg-card p-6 sm:grid-cols-2"
        >
          <Field label="Name">
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </Field>
          <Field label="Category">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Website">
            <Input
              value={form.website ?? ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Field label="URL template" colSpan={2}>
            <Input
              value={form.url_template ?? ""}
              onChange={(e) => setForm({ ...form, url_template: e.target.value })}
              placeholder="https://partner.com?ref={ref}&sub={sub}"
              required
            />
          </Field>
          <Field label="Commission model">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.commission_model}
              onChange={(e) => setForm({ ...form, commission_model: e.target.value })}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rate (0–1)">
            <Input
              value={form.commission_rate}
              onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
            />
          </Field>
          <Field label="Flat commission (cents)">
            <Input
              value={form.commission_flat_cents}
              onChange={(e) => setForm({ ...form, commission_flat_cents: e.target.value })}
            />
          </Field>
          <Field label="Description" colSpan={2}>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.disclose_to_client}
              onChange={(e) => setForm({ ...form, disclose_to_client: e.target.checked })}
            />{" "}
            Disclose to client on invoice
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{" "}
            Active
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit">Save partner</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(partners as any[]).map((p) => (
          <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{p.name}</div>
                  <Badge variant="secondary">{p.category.replace(/_/g, " ")}</Badge>
                  {p.disclose_to_client && (
                    <Badge className="bg-emerald-500/15 text-emerald-700">disclosed</Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.commission_model} · rate {p.commission_rate ?? 0} · flat{" "}
                  {money(p.commission_flat_cents)}
                </div>
                {p.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                )}
              </div>
              <a
                href={buildReferralUrl(p.url_template, "test")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setForm(p)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  colSpan,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: 1 | 2;
}) {
  return (
    <div className={colSpan === 2 ? "sm:col-span-2" : ""}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
