import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { benefits } from "@/lib/mock-data";
import {
  evaluateBenefits,
  totalMonthly,
  type BenefitInputs,
  type BenefitVerdict,
} from "@/lib/benefits-eligibility";
import { AlertCircle, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

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
};

function BenefitsPage() {
  const [inputs, setInputs] = useState<BenefitInputs>(DEFAULT_INPUTS);
  const [verdicts, setVerdicts] = useState<BenefitVerdict[] | null>(null);

  const verdictByKey = useMemo(() => {
    const map = new Map<string, BenefitVerdict>();
    (verdicts ?? []).forEach((v) => map.set(v.key, v));
    return map;
  }, [verdicts]);

  const total = verdicts ? totalMonthly(verdicts) : 0;
  const eligibleCount = verdicts ? verdicts.filter((v) => v.eligible).length : 0;

  function runCheck() {
    setVerdicts(evaluateBenefits(inputs));
  }

  function reset() {
    setInputs(DEFAULT_INPUTS);
    setVerdicts(null);
  }

  function patch<K extends keyof BenefitInputs>(key: K, value: BenefitInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setVerdicts(null); // require re-run so figures always reflect current inputs
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Benefits & entitlements</h1>
        <p className="text-sm text-muted-foreground">
          Answer six questions and Beistand estimates what you're entitled to under 2026 German
          rates. Indicative only — a case manager confirms before you apply.
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
          <SliderField
            label="Household size"
            value={inputs.householdSize}
            min={1}
            max={8}
            onChange={(v) => patch("householdSize", v)}
          />
          <SliderField
            label="Children under 18"
            value={inputs.childrenUnder18}
            min={0}
            max={6}
            onChange={(v) => patch("childrenUnder18", v)}
          />

          <div>
            <Label className="text-sm">Residence status</Label>
            <Select
              value={inputs.residence}
              onValueChange={(v) => patch("residence", v as BenefitInputs["residence"])}
            >
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
            <Input
              type="number"
              min={0}
              step={100}
              className="mt-1.5"
              value={inputs.monthlyIncome}
              onChange={(e) => patch("monthlyIncome", Number(e.target.value || 0))}
            />
          </div>

          <div>
            <Label className="text-sm">Employment</Label>
            <Select
              value={inputs.employment}
              onValueChange={(v) => patch("employment", v as BenefitInputs["employment"])}
            >
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
            <Select
              value={inputs.housing}
              onValueChange={(v) => patch("housing", v as BenefitInputs["housing"])}
            >
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="social_housing">Social housing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
        <div
          className={`rounded-2xl border p-6 ${
            eligibleCount > 0
              ? "border-success/40 bg-success/5"
              : "border-border/60 bg-muted/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div
                className={`text-xs font-semibold uppercase tracking-widest ${
                  eligibleCount > 0 ? "text-success" : "text-muted-foreground"
                }`}
              >
                {eligibleCount > 0
                  ? `Likely eligible for ${eligibleCount} benefit${eligibleCount === 1 ? "" : "s"}`
                  : "No clear entitlements with these inputs"}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {total > 0 ? `Up to €${total.toLocaleString("de-DE")} / month` : "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Indicative estimate under 2026 rates. Actual amounts depend on documents and
                individual circumstances.
              </p>
            </div>
            <Button variant="outline" disabled={eligibleCount === 0}>
              Draft applications
            </Button>
          </div>
        </div>
      )}

      {/* All benefits */}
      <div className="space-y-3">
        {benefits.map((b) => {
          const v = verdictByKey.get(b.key);
          return (
            <div
              key={b.key}
              className={`rounded-2xl border p-6 shadow-soft transition ${
                v?.eligible ? "border-success/40 bg-card" : "border-border/60 bg-card"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold">{b.name}</h3>
                    <Badge variant="outline" className="border-accent/40 bg-accent/10">
                      {b.category}
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

              {v ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Why this figure
                    </div>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {(v.reasons.length ? v.reasons : b.eligibleIf).map((r) => (
                        <li key={r} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {v.blockers.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Blockers
                      </div>
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
              ) : (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Eligible if
                  </div>
                  <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                    {b.eligibleIf.map((c) => (
                      <li key={c} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={v ? !v.eligible : false}>
                  Draft my application
                </Button>
                <Button size="sm" variant="ghost">Learn more</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium tabular-nums">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        className="mt-2"
      />
    </div>
  );
}
