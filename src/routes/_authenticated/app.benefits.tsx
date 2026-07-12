import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { benefits, CATEGORY_LABEL, type Benefit, type BenefitCategory } from "@/lib/mock-data";
import {
  evaluateBenefits,
  totalMonthly,
  type BenefitInputs,
  type BenefitVerdict,
} from "@/lib/benefits-eligibility";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Landmark,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/benefits")({
  component: BenefitsPage,
});

const DEFAULT_INPUTS: BenefitInputs = {
  householdSize: 2,
  childrenUnder18: 1,
  residence: "blue_card",
  monthlyIncome: 2800,
  employment: "employed",
  housing: "rented",
  ageYears: 38,
  isSingleParent: false,
  disabilityGdB: 0,
  careLevel: 0,
  sickWeeks: 0,
  unemploymentMonthsInsured: 0,
};

const CATEGORIES: (BenefitCategory | "all")[] = [
  "all",
  "family",
  "housing",
  "income",
  "student",
  "pension",
  "disability",
  "illness",
  "care",
  "unemployment",
  "tax",
  "social_insurance",
];

function BenefitsPage() {
  const [inputs, setInputs] = useState<BenefitInputs>(DEFAULT_INPUTS);
  const [verdicts, setVerdicts] = useState<BenefitVerdict[] | null>(null);
  const [filter, setFilter] = useState<BenefitCategory | "all">("all");
  const [showMore, setShowMore] = useState(false);

  const verdictByKey = useMemo(() => {
    const map = new Map<string, BenefitVerdict>();
    (verdicts ?? []).forEach((v) => map.set(v.key, v));
    return map;
  }, [verdicts]);

  const total = verdicts ? totalMonthly(verdicts) : 0;
  const eligibleCount = verdicts ? verdicts.filter((v) => v.eligible).length : 0;

  const visible = useMemo(
    () => (filter === "all" ? benefits : benefits.filter((b) => b.category === filter)),
    [filter],
  );

  function runCheck() {
    setVerdicts(evaluateBenefits(inputs));
  }
  function reset() {
    setInputs(DEFAULT_INPUTS);
    setVerdicts(null);
  }
  function patch<K extends keyof BenefitInputs>(key: K, value: BenefitInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setVerdicts(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Benefits & entitlements</h1>
        <p className="text-sm text-muted-foreground">
          Answer a few questions and BeistandPlus estimates what you're entitled to under 2026 German rates —
          family, housing, income support, study, pension, disability, illness, care, tax reliefs and
          social insurance. Each card lists the authority, forms, documents and proofs you need. Indicative
          only — a case manager confirms before you apply.
        </p>
      </div>

      {/* Eligibility panel */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-display text-xl font-semibold">Eligibility checker</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SliderField label="Household size" value={inputs.householdSize} min={1} max={8}
            onChange={(v) => patch("householdSize", v)} />
          <SliderField label="Children under 18" value={inputs.childrenUnder18} min={0} max={6}
            onChange={(v) => patch("childrenUnder18", v)} />

          <div>
            <Label className="text-sm">Residence status</Label>
            <Select value={inputs.residence}
              onValueChange={(v) => patch("residence", v as BenefitInputs["residence"])}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blue_card">EU Blue Card</SelectItem>
                <SelectItem value="family_reunion">Family reunion</SelectItem>
                <SelectItem value="student_visa">Student visa</SelectItem>
                <SelectItem value="permanent">Permanent residence</SelectItem>
                <SelectItem value="eu_citizen">EU citizen</SelectItem>
                <SelectItem value="other">Other / undocumented</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Monthly household income (€, gross)</Label>
            <Input type="number" min={0} step={100} className="mt-1.5"
              value={inputs.monthlyIncome}
              onChange={(e) => patch("monthlyIncome", Number(e.target.value || 0))} />
          </div>

          <div>
            <Label className="text-sm">Employment</Label>
            <Select value={inputs.employment}
              onValueChange={(v) => patch("employment", v as BenefitInputs["employment"])}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self_employed">Self-employed</SelectItem>
                <SelectItem value="job_seeking">Job-seeking</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Housing</Label>
            <Select value={inputs.housing}
              onValueChange={(v) => patch("housing", v as BenefitInputs["housing"])}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="social_housing">Social housing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="mt-5 text-sm font-medium text-primary hover:underline"
        >
          {showMore ? "Hide" : "Add"} disability, illness & unemployment details
        </button>

        {showMore && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border border-dashed border-border/60 p-4">
            <SliderField
              label={`Disability degree (GdB)`}
              value={inputs.disabilityGdB ?? 0}
              min={0}
              max={100}
              step={10}
              onChange={(v) => patch("disabilityGdB", v)}
            />
            <SliderField
              label={`Pflegegrad (care level)`}
              value={inputs.careLevel ?? 0}
              min={0}
              max={5}
              onChange={(v) => patch("careLevel", v as 0 | 1 | 2 | 3 | 4 | 5)}
            />
            <SliderField
              label="Weeks continuously sick"
              value={inputs.sickWeeks ?? 0}
              min={0}
              max={78}
              onChange={(v) => patch("sickWeeks", v)}
            />
            <SliderField
              label="Months of unemployment insurance (last 30 mo)"
              value={inputs.unemploymentMonthsInsured ?? 0}
              min={0}
              max={30}
              onChange={(v) => patch("unemploymentMonthsInsured", v)}
            />
            <SliderField
              label="Adult age"
              value={inputs.ageYears ?? 30}
              min={16}
              max={90}
              onChange={(v) => patch("ageYears", v)}
            />
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <Label htmlFor="single" className="text-sm">Single parent</Label>
              <Switch
                id="single"
                checked={!!inputs.isSingleParent}
                onCheckedChange={(v) => patch("isSingleParent", v)}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button className="bg-gradient-primary" onClick={runCheck}>
            <Sparkles className="mr-2 h-4 w-4" /> Run check
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Result banner */}
      {verdicts && (
        <div className={`rounded-2xl border p-6 ${
          eligibleCount > 0 ? "border-success/40 bg-success/5" : "border-border/60 bg-muted/40"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className={`text-xs font-semibold uppercase tracking-widest ${
                eligibleCount > 0 ? "text-success" : "text-muted-foreground"
              }`}>
                {eligibleCount > 0
                  ? `Likely eligible for ${eligibleCount} benefit${eligibleCount === 1 ? "" : "s"}`
                  : "No clear entitlements with these inputs"}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {total > 0 ? `Up to €${total.toLocaleString("de-DE")} / month` : "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Indicative estimate under 2026 rates. Actual amounts depend on documents and individual
                circumstances.
              </p>
            </div>
            <Button variant="outline" disabled={eligibleCount === 0}>Draft applications</Button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = filter === c;
          const label = c === "all" ? "All" : CATEGORY_LABEL[c];
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* All benefits */}
      <div className="space-y-3">
        {visible.map((b) => (
          <BenefitCard key={b.key} b={b} v={verdictByKey.get(b.key)} />
        ))}
      </div>
    </div>
  );
}

function BenefitCard({ b, v }: { b: Benefit; v: BenefitVerdict | undefined }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-soft transition ${
      v?.eligible ? "border-success/40 bg-card" : "border-border/60 bg-card"
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold">{b.name}</h3>
            <Badge variant="outline" className="border-accent/40 bg-accent/10">
              {CATEGORY_LABEL[b.category]}
            </Badge>
            {v && (
              <Badge
                variant="outline"
                className={
                  v.eligible
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                }
              >
                {v.eligible
                  ? v.confidence === "likely"
                    ? "Likely eligible"
                    : "Possibly eligible"
                  : "Not eligible now"}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground italic">{b.german}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" />
            {b.authority}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-semibold text-primary">
            {v ? v.amountLabel : b.monthly ?? "—"}
          </div>
          {v?.eligible && v.estimatedMonthly > 0 && (
            <div className="text-xs text-muted-foreground">Estimated for you</div>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm">{b.summary}</p>

      {v && (v.reasons.length > 0 || v.blockers.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {v.reasons.length > 0 && (
            <div>
              <SectionLabel>Why this figure</SectionLabel>
              <ul className="mt-2 space-y-1.5 text-sm">
                {v.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {v.blockers.length > 0 && (
            <div>
              <SectionLabel>Blockers</SectionLabel>
              <ul className="mt-2 space-y-1.5 text-sm">
                {v.blockers.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <SectionLabel>Eligible if</SectionLabel>
        <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
          {b.eligibleIf.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div>
          <SectionLabel>
            <FileText className="mr-1 inline h-3.5 w-3.5" /> Forms
          </SectionLabel>
          <ul className="mt-2 space-y-1.5 text-sm">
            {b.forms.map((f) => (
              <li key={f.code} className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{f.code}</Badge>
                <div className="flex-1">
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                       className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-1">
                      {f.title} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>{f.title}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionLabel>Documents to attach</SectionLabel>
          <ul className="mt-2 space-y-1.5 text-sm">
            {b.documents.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionLabel>
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Proofs / evidence
          </SectionLabel>
          <ul className="mt-2 space-y-1.5 text-sm">
            {b.proofs.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {b.notes && (
        <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <strong>Note:</strong> {b.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={v ? !v.eligible : false}>
          Draft my application
        </Button>
        {b.applyUrl && (
          <Button size="sm" variant="ghost" asChild>
            <a href={b.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply online <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

function SliderField({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium tabular-nums">{value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]}
        onValueChange={(v) => onChange(v[0])} className="mt-2" />
    </div>
  );
}
