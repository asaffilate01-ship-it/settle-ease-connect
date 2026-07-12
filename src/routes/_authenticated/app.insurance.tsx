import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  INSURANCE_CATEGORIES,
  INSURANCE_COMPANIES,
  CLAIM_PROCESS,
  type InsuranceCategory,
  type InsuranceCompany,
} from "@/data/german-insurance";

export const Route = createFileRoute("/_authenticated/app/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance — Providers, Policies & Claims" },
      { name: "description", content: "Compare German insurance providers, register for policies online, and manage claims end-to-end." },
    ],
  }),
  component: InsurancePage,
});

const CATEGORY_ORDER: InsuranceCategory[] = [
  "health_statutory",
  "health_private",
  "health_supplementary",
  "long_term_care",
  "life",
  "disability",
  "accident",
  "liability",
  "household",
  "building",
  "legal",
  "car",
  "travel",
  "pet",
  "pension",
  "funeral",
];

function InsurancePage() {
  const [category, setCategory] = useState<InsuranceCategory | "all">("all");
  const [q, setQ] = useState("");
  const [openCompany, setOpenCompany] = useState<string | null>(null);
  const [openClaim, setOpenClaim] = useState<InsuranceCategory | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return INSURANCE_COMPANIES.filter((c) => {
      const inCat = category === "all" || c.products.some((p) => p.category === category);
      const inQ =
        !s ||
        c.name.toLowerCase().includes(s) ||
        c.products.some((p) => p.name.toLowerCase().includes(s));
      return inCat && inQ;
    });
  }, [category, q]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="display-lg font-semibold">Insurance</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Browse German insurance providers, register clients directly on the insurer's system, and manage the full claim
          process — from first notice of loss to beneficiary payout and invoice reconciliation.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-xs"
            placeholder="Search insurer or product…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            <Chip active={category === "all"} onClick={() => setCategory("all")}>All</Chip>
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {INSURANCE_CATEGORIES[c].label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CompanyCard
            key={c.id}
            company={c}
            filterCategory={category === "all" ? undefined : category}
            open={openCompany === c.id}
            onToggle={() => setOpenCompany(openCompany === c.id ? null : c.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No providers match your filter.
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Claim process — by insurance type</h2>
          <Link to="/app/cases" className="text-xs font-medium text-primary hover:underline">
            Open a case for a claim →
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setOpenClaim(openClaim === cat ? null : cat)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                openClaim === cat ? "border-primary bg-primary/5" : "hover:bg-accent"
              }`}
            >
              <div className="font-medium">{INSURANCE_CATEGORIES[cat].label}</div>
              <div className="text-xs text-muted-foreground">{INSURANCE_CATEGORIES[cat].description}</div>
            </button>
          ))}
        </div>
        {openClaim && (
          <div className="mt-4 rounded-xl border bg-background p-4">
            <div className="mb-3 text-sm font-semibold">
              {INSURANCE_CATEGORIES[openClaim].label} — step-by-step
            </div>
            <ol className="space-y-3">
              {CLAIM_PROCESS[openClaim].map((s) => (
                <li key={s.step} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {s.step}
                  </span>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.detail}</div>
                    {s.required && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {s.required.map((r) => (
                          <span key={r} className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function CompanyCard({
  company,
  filterCategory,
  open,
  onToggle,
}: {
  company: InsuranceCompany;
  filterCategory?: InsuranceCategory;
  open: boolean;
  onToggle: () => void;
}) {
  const products = filterCategory
    ? company.products.filter((p) => p.category === filterCategory)
    : company.products;
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-4">
      <header className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">
          {company.logoInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{company.name}</div>
          <div className="text-xs text-muted-foreground">
            {company.languages.map((l) => l.toUpperCase()).join(" · ")}
          </div>
        </div>
      </header>
      <div className="mt-3 space-y-1.5">
        {products.slice(0, 3).map((p) => (
          <div key={p.key} className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{p.name}</span>
              {p.monthlyFromEur !== undefined && (
                <span className="shrink-0 text-muted-foreground">from €{p.monthlyFromEur}/mo</span>
              )}
            </div>
          </div>
        ))}
        {products.length > 3 && (
          <div className="text-[10px] text-muted-foreground">+{products.length - 3} more products</div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={company.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Register client
        </a>
        <a
          href={company.claimUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border px-3 py-1.5 text-center text-xs font-semibold hover:bg-accent"
        >
          File a claim
        </a>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        {open ? "Hide details" : "Details, quote & contact"}
      </button>
      {open && (
        <dl className="mt-3 space-y-1.5 border-t pt-3 text-xs">
          {company.quoteUrl && (
            <Row label="Instant quote">
              <a className="text-primary hover:underline" href={company.quoteUrl} target="_blank" rel="noopener noreferrer">
                Open calculator
              </a>
            </Row>
          )}
          {company.supportPhone && <Row label="Support">{company.supportPhone}</Row>}
          {company.claimPhone && <Row label="Claim hotline">{company.claimPhone}</Row>}
          {company.claimEmail && <Row label="Claim email">{company.claimEmail}</Row>}
          {company.brokerPortalUrl && (
            <Row label="Broker portal">
              <a className="text-primary hover:underline" href={company.brokerPortalUrl} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Row>
          )}
          <Row label="Website">
            <a className="text-primary hover:underline" href={company.website} target="_blank" rel="noopener noreferrer">
              {company.website.replace(/^https?:\/\//, "")}
            </a>
          </Row>
          {company.notes && <div className="pt-1 text-muted-foreground">{company.notes}</div>}
        </dl>
      )}
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
