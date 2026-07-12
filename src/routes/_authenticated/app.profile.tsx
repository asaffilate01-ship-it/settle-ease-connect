import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, ExternalLink, ClipboardList, Briefcase, HeartPulse, Users2, PiggyBank, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { listLifeAdmin, upsertLifeAdmin, deleteLifeAdmin } from "@/lib/life-admin.functions";
import { listReferralPartners, createReferralLead, buildReferralUrl } from "@/lib/referrals.functions";
import { LIFE_EVENT_PLAYBOOKS, type Playbook } from "@/data/life-event-playbooks";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "My records — employment, pensions, contacts, events" },
      { name: "description", content: "Store employment, pensions, health insurance, trusted contacts, and follow the right playbook for major life events." },
    ],
  }),
  component: ProfilePage,
});

type Tab = "employment" | "pensions" | "health" | "contacts" | "events";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "pensions", label: "Pensions", icon: PiggyBank },
  { id: "health", label: "Health insurance", icon: HeartPulse },
  { id: "contacts", label: "Trusted contacts", icon: Users2 },
  { id: "events", label: "Life-event playbooks", icon: AlertTriangle },
];

function ProfilePage() {
  const [tab, setTab] = useState<Tab>("employment");
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Life administration</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">My records</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Everything we need to help you claim benefits, insurance, or navigate a major life event — kept in one place. Your case manager sees only what your plan allows.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border/60">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-card border border-b-transparent border-border/60 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "employment" && <EmploymentSection />}
      {tab === "pensions" && <PensionsSection />}
      {tab === "health" && <HealthSection />}
      {tab === "contacts" && <ContactsSection />}
      {tab === "events" && <EventsSection />}
    </div>
  );
}

/* ---------------- generic list + form helper ---------------- */

type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select" | "email" | "tel" | "checkbox";
  options?: string[];
  placeholder?: string;
  colSpan?: 1 | 2;
};

function SectionShell(props: {
  table: "employment_records" | "pensions" | "health_insurance" | "trusted_contacts";
  title: string;
  emptyLabel: string;
  fields: Field[];
  renderRow: (row: any) => React.ReactNode;
}) {
  const qc = useQueryClient();
  const fetchRows = useServerFn(listLifeAdmin);
  const upsert = useServerFn(upsertLifeAdmin);
  const removeRow = useServerFn(deleteLifeAdmin);
  const [form, setForm] = useState<Record<string, any> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["life", props.table],
    queryFn: () => fetchRows({ data: { table: props.table } }),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const values: Record<string, any> = {};
    for (const f of props.fields) {
      const v = form[f.name];
      if (v === "" || v === undefined) continue;
      if (f.type === "number") values[f.name] = Number(v);
      else if (f.type === "checkbox") values[f.name] = !!v;
      else values[f.name] = v;
    }
    await upsert({ data: { table: props.table, id: form.id, values } });
    setForm(null);
    qc.invalidateQueries({ queryKey: ["life", props.table] });
  }

  async function del(id: string) {
    if (!confirm("Delete this record?")) return;
    await removeRow({ data: { table: props.table, id } });
    qc.invalidateQueries({ queryKey: ["life", props.table] });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">{props.title}</h2>
        <Button onClick={() => setForm(form ? null : {})} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" /> {form ? "Cancel" : "Add"}
        </Button>
      </div>

      {form && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:grid-cols-2">
          {props.fields.map((f) => (
            <div key={f.name} className={f.colSpan === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea id={f.name} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} rows={3} />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                >
                  <option value="">—</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "checkbox" ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id={f.name}
                    type="checkbox"
                    checked={!!form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                  />
                  <span className="text-sm text-muted-foreground">{f.placeholder}</span>
                </div>
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            <Button type="submit">{form.id ? "Save changes" : "Add record"}</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">{props.emptyLabel}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((r: any) => (
            <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">{props.renderRow(r)}</div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setForm(r)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function money(cents?: number | null, currency = "EUR") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100);
}

/* ---------------- individual sections ---------------- */

function EmploymentSection() {
  return (
    <SectionShell
      table="employment_records"
      title="Employment history"
      emptyLabel="No employers yet. Add your current job so we can pre-fill sick-pay, parental-leave and unemployment claims."
      fields={[
        { name: "employer", label: "Employer" },
        { name: "role", label: "Job title" },
        { name: "contract_type", label: "Contract type", type: "select", options: ["unbefristet", "befristet", "minijob", "midijob", "freelance", "civil_servant", "internship"] },
        { name: "tax_class", label: "Tax class (Lohnsteuerklasse)", type: "select", options: ["I", "II", "III", "IV", "V", "VI"] },
        { name: "gross_salary_cents", label: "Gross monthly salary (in cents)", type: "number", placeholder: "e.g. 450000 = €4,500" },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "end_date", label: "End date", type: "date" },
        { name: "hr_contact_name", label: "HR contact name" },
        { name: "hr_contact_email", label: "HR email", type: "email" },
        { name: "hr_contact_phone", label: "HR phone", type: "tel" },
        { name: "works_council", label: "Betriebsrat contact" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      renderRow={(r) => (
        <>
          <div className="font-semibold">{r.employer}</div>
          <div className="text-sm text-muted-foreground">{r.role} · {r.contract_type ?? "—"} · Tax {r.tax_class ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">{r.start_date ?? "?"} → {r.end_date ?? "present"} · {money(r.gross_salary_cents)}/mo</div>
        </>
      )}
    />
  );
}

function PensionsSection() {
  return (
    <SectionShell
      table="pensions"
      title="Pensions"
      emptyLabel="No pension records. Add statutory (Deutsche Rentenversicherung), employer, Riester/Rürup or private pensions."
      fields={[
        { name: "kind", label: "Kind", type: "select", options: ["statutory", "occupational", "riester", "ruerup", "private"] },
        { name: "provider", label: "Provider" },
        { name: "policy_number", label: "Policy / member number" },
        { name: "monthly_contribution_cents", label: "Monthly contribution (cents)", type: "number" },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "projected_monthly_payout_cents", label: "Projected monthly payout (cents)", type: "number" },
        { name: "beneficiary_name", label: "Beneficiary name" },
        { name: "beneficiary_relationship", label: "Beneficiary relationship" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      renderRow={(r) => (
        <>
          <div className="flex items-center gap-2">
            <div className="font-semibold">{r.provider}</div>
            <Badge variant="secondary">{r.kind}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Policy {r.policy_number ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Contrib {money(r.monthly_contribution_cents)}/mo · Projected {money(r.projected_monthly_payout_cents)}/mo</div>
          {r.beneficiary_name && <div className="mt-1 text-xs">Beneficiary: {r.beneficiary_name} ({r.beneficiary_relationship ?? "—"})</div>}
        </>
      )}
    />
  );
}

function HealthSection() {
  return (
    <SectionShell
      table="health_insurance"
      title="Health insurance"
      emptyLabel="Add your Krankenkasse and any supplementary policies (Zusatzversicherung)."
      fields={[
        { name: "kind", label: "Kind", type: "select", options: ["gkv", "pkv", "private_top_up"] },
        { name: "kasse", label: "Insurer / Krankenkasse" },
        { name: "membership_number", label: "Membership number" },
        { name: "tariff", label: "Tariff" },
        { name: "monthly_premium_cents", label: "Monthly premium (cents)", type: "number" },
        { name: "dependants_covered", label: "Dependants covered", type: "number" },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "notes", label: "Notes (e.g. dental / hospital add-on)", type: "textarea" },
      ]}
      renderRow={(r) => (
        <>
          <div className="flex items-center gap-2">
            <div className="font-semibold">{r.kasse}</div>
            <Badge variant="secondary">{(r.kind || "").toUpperCase()}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Member {r.membership_number ?? "—"} · Tariff {r.tariff ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Premium {money(r.monthly_premium_cents)}/mo · {r.dependants_covered ?? 0} dependants</div>
        </>
      )}
    />
  );
}

function ContactsSection() {
  return (
    <SectionShell
      table="trusted_contacts"
      title="Trusted contacts"
      emptyLabel="Add the people we should reach in an emergency — next of kin, GP, lawyer, embassy, executor…"
      fields={[
        { name: "role", label: "Role", type: "select", options: ["next_of_kin", "medical_proxy", "executor", "employer_hr", "gp", "lawyer", "accountant", "notary", "embassy", "other"] },
        { name: "name", label: "Full name" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "email", label: "Email", type: "email" },
        { name: "address", label: "Address" },
        { name: "language", label: "Preferred language" },
        { name: "is_primary", label: "Primary contact for this role", type: "checkbox", placeholder: "Mark as the go-to person" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      renderRow={(r) => (
        <>
          <div className="flex items-center gap-2">
            <div className="font-semibold">{r.name}</div>
            <Badge variant="secondary">{r.role.replace(/_/g, " ")}</Badge>
            {r.is_primary && <Badge className="bg-primary/15 text-primary">primary</Badge>}
          </div>
          <div className="text-sm text-muted-foreground">{r.phone ?? "—"} · {r.email ?? "—"}</div>
          {r.address && <div className="mt-1 text-xs text-muted-foreground">{r.address}</div>}
        </>
      )}
    />
  );
}

/* ---------------- Life-event playbooks ---------------- */

function EventsSection() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const fetchPartners = useServerFn(listReferralPartners);
  const emitLead = useServerFn(createReferralLead);
  const { data: partners = [] } = useQuery({
    queryKey: ["referral_partners_all"],
    queryFn: () => fetchPartners({ data: {} }),
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Life-event playbooks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Step-by-step checklists for the events that trigger claims, notifications and deadlines. Open one to see who to notify and which of your insurances or pensions to claim.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {LIFE_EVENT_PLAYBOOKS.map((pb) => (
          <button
            key={pb.slug}
            onClick={() => setOpenSlug(pb.slug)}
            className="rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition hover:border-primary/40"
          >
            <div className="flex items-start gap-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">{pb.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{pb.summary}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary">{pb.steps.length} steps</Badge>
                  <Badge variant="secondary">{pb.authoritiesToNotify.length} authorities</Badge>
                  <Badge variant="secondary">{pb.insurancesToClaim.length} claims</Badge>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {openSlug && (
        <PlaybookDialog
          playbook={LIFE_EVENT_PLAYBOOKS.find((p) => p.slug === openSlug)!}
          partners={partners as any[]}
          onClose={() => setOpenSlug(null)}
          onOpenPartner={async (partnerId, url) => {
            try { await emitLead({ data: { partner_id: partnerId, source_page: `playbook:${openSlug}`, commission_expected_cents: 0 } }); } catch {}
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        />
      )}
    </section>
  );
}

function PlaybookDialog({ playbook, partners, onClose, onOpenPartner }: {
  playbook: Playbook;
  partners: any[];
  onClose: () => void;
  onOpenPartner: (partnerId: string, url: string) => void;
}) {
  const suggested = useMemo(() => {
    const map: Record<string, string[]> = {
      death: ["insurer_life", "insurer_disability", "notary", "lawyer"],
      "serious-illness": ["insurer_disability", "insurer_health"],
      "work-injury": ["lawyer", "insurer_disability"],
      redundancy: ["lawyer", "tax_advisor"],
      "long-term-disability": ["lawyer", "insurer_disability"],
      birth: ["insurer_health", "insurer_life"],
      marriage: ["notary", "insurer_household"],
      divorce: ["lawyer", "notary"],
      "relocation-abroad": ["mover", "fx", "airline", "insurer_travel"],
    };
    const cats = map[playbook.slug] ?? [];
    return partners.filter((p) => cats.includes(p.category));
  }, [playbook.slug, partners]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold">{playbook.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{playbook.summary}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Whom to inform</div>
            <ul className="mt-2 space-y-1 text-sm">
              {playbook.authoritiesToNotify.map((a) => <li key={a} className="flex gap-2"><span className="text-primary">•</span>{a}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Claim against</div>
            <ul className="mt-2 space-y-1 text-sm">
              {playbook.insurancesToClaim.map((a) => <li key={a} className="flex gap-2"><span className="text-primary">•</span>{a.replace(/_/g, " ")}</li>)}
            </ul>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents required</div>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
            {playbook.documentsRequired.map((d) => <li key={d} className="flex gap-2"><span className="text-primary">•</span>{d}</li>)}
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step-by-step</div>
          <ol className="mt-2 space-y-2">
            {playbook.steps.map((s, i) => (
              <li key={i} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{s.actor.replace(/_/g, " ")}</Badge>
                  <span className="font-medium">{s.title}</span>
                  {s.deadlineDays != null && <Badge className="bg-amber-500/15 text-amber-700">within {s.deadlineDays}d</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>

        {suggested.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended partners</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggested.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenPartner(p.id, buildReferralUrl(p.url_template, playbook.slug))}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-left hover:border-primary/40"
                >
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.category.replace(/_/g, " ")}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
