import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { benefits } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/benefits")({
  component: BenefitsPage,
});

function BenefitsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Benefits & entitlements</h1>
        <p className="text-sm text-muted-foreground">Find out what you're entitled to and let Beistand prepare the paperwork.</p>
      </div>

      {/* Eligibility panel */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-display text-xl font-semibold">Eligibility checker</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Selector label="Household size" options={["1", "2", "3", "4", "5+"]} />
          <Selector label="Children under 18" options={["0", "1", "2", "3+"]} />
          <Selector label="Residence status" options={["Blue Card", "Family reunion", "Student visa", "Permanent", "EU citizen", "Other"]} />
          <Selector label="Monthly household income" options={["< €1,500", "€1,500–3,000", "€3,000–5,000", "> €5,000"]} />
          <Selector label="Employment" options={["Employed", "Self-employed", "Job-seeking", "Student", "Retired"]} />
          <Selector label="Housing" options={["Rented", "Owned", "Social housing"]} />
        </div>
        <Button className="mt-6 bg-gradient-primary">Run check</Button>
      </div>

      {/* Result: eligible benefits */}
      <div className="rounded-2xl border border-success/40 bg-success/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-success">Likely eligible</div>
            <div className="mt-1 font-display text-2xl font-semibold">Up to €1,340 / month</div>
          </div>
          <Button variant="outline">Draft applications</Button>
        </div>
      </div>

      {/* All benefits */}
      <div className="space-y-3">
        {benefits.map((b) => (
          <div key={b.key} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-semibold">{b.name}</h3>
                  <Badge variant="outline" className="border-accent/40 bg-accent/10">{b.category}</Badge>
                </div>
                <div className="text-sm text-muted-foreground italic">{b.german}</div>
              </div>
              {b.monthly && <div className="font-display text-xl font-semibold text-primary">{b.monthly}</div>}
            </div>
            <p className="mt-3 text-sm">{b.summary}</p>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Eligible if</div>
              <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                {b.eligibleIf.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline">Draft my application</Button>
              <Button size="sm" variant="ghost">Learn more</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Selector({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
