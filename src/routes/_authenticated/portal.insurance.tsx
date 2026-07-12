import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeInvoice, type InvoiceLine } from "@/data/german-insurance";

export const Route = createFileRoute("/_authenticated/portal/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance Operations — Portal" },
      { name: "description", content: "Manage insurance policies, claims pipeline and beneficiary payout invoices." },
    ],
  }),
  component: PortalInsurancePage,
});

type Policy = {
  id: string;
  client: string;
  insurer: string;
  product: string;
  policyNo: string;
  monthly: number;
  status: "active" | "pending" | "cancelled";
};

type Claim = {
  id: string;
  policyId: string;
  client: string;
  insurer: string;
  type: string;
  filed: string;
  status: "draft" | "submitted" | "in_review" | "approved" | "paid" | "rejected";
  sumClaimed: number;
  sumApproved?: number;
};

const SEED_POLICIES: Policy[] = [
  { id: "p1", client: "Fatima Yılmaz", insurer: "TK", product: "GKV Familie", policyNo: "TK-8823110", monthly: 0, status: "active" },
  { id: "p2", client: "Ahmed Khan", insurer: "Allianz", product: "Berufsunfähigkeit", policyNo: "AZ-BU-40213", monthly: 62, status: "active" },
  { id: "p3", client: "Nadia Ahmad", insurer: "ERGO", product: "Sterbegeld €12,000", policyNo: "EG-STR-991", monthly: 24, status: "active" },
  { id: "p4", client: "Ali Raza", insurer: "HUK", product: "Kfz Vollkasko", policyNo: "HK-KFZ-77821", monthly: 41, status: "active" },
  { id: "p5", client: "Sara Weiss", insurer: "Feather", product: "Expat Health", policyNo: "FE-EH-6612", monthly: 118, status: "pending" },
];

const SEED_CLAIMS: Claim[] = [
  { id: "c1", policyId: "p3", client: "Nadia Ahmad", insurer: "ERGO", type: "Funeral payout", filed: "2026-07-02", status: "approved", sumClaimed: 12000, sumApproved: 12000 },
  { id: "c2", policyId: "p2", client: "Ahmed Khan", insurer: "Allianz", type: "BU monthly pension", filed: "2026-06-14", status: "in_review", sumClaimed: 2100 },
  { id: "c3", policyId: "p4", client: "Ali Raza", insurer: "HUK", type: "Kasko — collision", filed: "2026-06-30", status: "submitted", sumClaimed: 4850 },
];

const STATUS_TONE: Record<Claim["status"], string> = {
  draft: "bg-muted text-foreground",
  submitted: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  in_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  paid: "bg-emerald-600/20 text-emerald-800 dark:text-emerald-200",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function fmt(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function PortalInsurancePage() {
  const [tab, setTab] = useState<"policies" | "claims" | "invoice">("policies");
  const [selectedClaim, setSelectedClaim] = useState<string>(SEED_CLAIMS[0].id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Insurance Operations</h1>
          <p className="text-sm text-muted-foreground">Policies · Claims · Beneficiary payout invoicing</p>
        </div>
        <nav className="flex rounded-xl border p-1 text-xs">
          {(["policies", "claims", "invoice"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {t === "invoice" ? "Invoice / Payout" : t}
            </button>
          ))}
        </nav>
      </header>

      {tab === "policies" && <PoliciesTable />}
      {tab === "claims" && (
        <ClaimsTable
          selected={selectedClaim}
          onSelect={(id) => {
            setSelectedClaim(id);
            setTab("invoice");
          }}
        />
      )}
      {tab === "invoice" && <InvoiceBuilder claimId={selectedClaim} onChangeClaim={setSelectedClaim} />}
    </div>
  );
}

function PoliciesTable() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <Th>Client</Th>
            <Th>Insurer</Th>
            <Th>Product</Th>
            <Th>Policy #</Th>
            <Th className="text-right">Monthly</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {SEED_POLICIES.map((p) => (
            <tr key={p.id} className="border-t">
              <Td className="font-medium">{p.client}</Td>
              <Td>{p.insurer}</Td>
              <Td>{p.product}</Td>
              <Td className="font-mono text-xs">{p.policyNo}</Td>
              <Td className="text-right">{fmt(p.monthly)}</Td>
              <Td>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {p.status}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimsTable({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <Th>Client</Th>
            <Th>Insurer</Th>
            <Th>Type</Th>
            <Th>Filed</Th>
            <Th className="text-right">Claimed</Th>
            <Th className="text-right">Approved</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {SEED_CLAIMS.map((c) => (
            <tr key={c.id} className={`border-t ${selected === c.id ? "bg-primary/5" : ""}`}>
              <Td className="font-medium">{c.client}</Td>
              <Td>{c.insurer}</Td>
              <Td>{c.type}</Td>
              <Td className="text-xs text-muted-foreground">{c.filed}</Td>
              <Td className="text-right">{fmt(c.sumClaimed)}</Td>
              <Td className="text-right">{c.sumApproved ? fmt(c.sumApproved) : "—"}</Td>
              <Td>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[c.status]}`}>
                  {c.status.replace("_", " ")}
                </span>
              </Td>
              <Td>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Invoice →
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceBuilder({ claimId, onChangeClaim }: { claimId: string; onChangeClaim: (id: string) => void }) {
  const claim = SEED_CLAIMS.find((c) => c.id === claimId) ?? SEED_CLAIMS[0];
  const [lines, setLines] = useState<InvoiceLine[]>(() => defaultLinesFor(claim));

  const totals = useMemo(() => computeInvoice(lines), [lines]);

  function update(idx: number, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function remove(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }
  function add() {
    setLines((prev) => [...prev, { label: "New line", amount: 0, category: "fee" }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Claim</div>
          <div className="font-medium">
            {claim.client} · {claim.insurer} — {claim.type}
          </div>
        </div>
        <select
          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
          value={claim.id}
          onChange={(e) => {
            onChangeClaim(e.target.value);
            const next = SEED_CLAIMS.find((c) => c.id === e.target.value);
            if (next) setLines(defaultLinesFor(next));
          }}
        >
          {SEED_CLAIMS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.client} — {c.type}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th className="text-right">Amount</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={idx} className="border-t">
                <Td>
                  <input
                    className="w-full bg-transparent outline-none"
                    value={l.label}
                    onChange={(e) => update(idx, { label: e.target.value })}
                  />
                  {l.note && <div className="text-[10px] text-muted-foreground">{l.note}</div>}
                </Td>
                <Td>
                  <select
                    className="rounded border bg-background px-2 py-0.5 text-xs"
                    value={l.category ?? "fee"}
                    onChange={(e) => update(idx, { category: e.target.value as InvoiceLine["category"] })}
                  >
                    <option value="premium">Premium</option>
                    <option value="third_party">Third-party cost</option>
                    <option value="fee">Service fee</option>
                    <option value="commission">Commission</option>
                    <option value="tax">Tax (VAT)</option>
                    <option value="payout">Insurance payout</option>
                    <option value="refund">Refund</option>
                  </select>
                </Td>
                <Td className="text-right">
                  <input
                    type="number"
                    className="w-28 rounded border bg-background px-2 py-0.5 text-right font-mono text-xs"
                    value={l.amount}
                    onChange={(e) => update(idx, { amount: Number(e.target.value) })}
                  />
                </Td>
                <Td>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-rose-500"
                    onClick={() => remove(idx)}
                  >
                    Remove
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t p-3">
          <button
            type="button"
            onClick={add}
            className="rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            + Add line
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Gross charges" value={fmt(totals.gross)} />
        <Metric label="Credits / payouts in" value={fmt(totals.credits)} tone="emerald" />
        <Metric label="Platform commission" value={fmt(totals.commission)} tone="violet" />
        <Metric label="VAT / tax" value={fmt(totals.tax)} tone="sky" />
        <Metric label="Insurance payout received" value={fmt(totals.payoutToBeneficiary)} tone="emerald" />
        <Metric label="Client total" value={fmt(totals.clientTotal)} />
        <Metric
          label={totals.balanceDue >= 0 ? "Balance due from client" : "Balance to pay beneficiary"}
          value={fmt(Math.abs(totals.balanceDue))}
          tone={totals.balanceDue >= 0 ? "amber" : "emerald"}
          strong
        />
      </div>

      <div className="rounded-2xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">How this works:</strong> insurance payouts are received into the platform escrow.
          Platform commission, third-party costs (funeral director, notary, translation, filing fees) and VAT are itemised.
          The remaining balance is transferred to the beneficiary's bank account and a signed invoice + payout statement is
          generated for the client's records.
        </p>
      </div>
    </div>
  );
}

function defaultLinesFor(claim: Claim): InvoiceLine[] {
  const payout = claim.sumApproved ?? claim.sumClaimed;
  return [
    { label: `Insurance payout — ${claim.insurer}`, amount: -payout, category: "payout" },
    { label: "Case management (10 hours @ €45)", amount: 450, category: "fee" },
    { label: "Third-party: funeral director invoice", amount: claim.type.toLowerCase().includes("funeral") ? 4200 : 0, category: "third_party" },
    { label: "Document translation & certification", amount: 180, category: "third_party" },
    { label: "Platform service fee (5%)", amount: Math.round(payout * 0.05), category: "commission" },
    { label: "VAT 19% on service fees", amount: Math.round((450 + Math.round(payout * 0.05)) * 0.19), category: "tax" },
  ];
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
function Metric({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "violet" | "sky" | "amber";
  strong?: boolean;
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "violet"
        ? "text-violet-600 dark:text-violet-300"
        : tone === "sky"
          ? "text-sky-600 dark:text-sky-300"
          : tone === "amber"
            ? "text-amber-600 dark:text-amber-300"
            : "text-foreground";
  return (
    <div className={`rounded-2xl border bg-card p-4 ${strong ? "ring-2 ring-primary/30" : ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
