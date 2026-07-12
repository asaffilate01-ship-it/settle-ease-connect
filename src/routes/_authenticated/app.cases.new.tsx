import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/app/cases/new")({
  component: NewCase,
});

const steps = [
  { key: "who", label: "Who" },
  { key: "where", label: "Where & when" },
  { key: "faith", label: "Faith & wishes" },
  { key: "family", label: "Family contact" },
  { key: "review", label: "Review" },
];

function NewCase() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to="/app/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Cases
      </Link>

      <div>
        <h1 className="font-display text-3xl font-semibold">Report a case</h1>
        <p className="text-sm text-muted-foreground">This form takes about 60 seconds. A case manager will call within 15 minutes.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                i < step
                  ? "bg-success text-success-foreground"
                  : i === step
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`hidden text-sm sm:inline ${i === step ? "font-medium" : "text-muted-foreground"}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold">Who has passed away?</h2>
            <Field label="Full name"><Input placeholder="e.g. Muhammad Aslam Khan" /></Field>
            <Field label="Age"><Input type="number" placeholder="68" /></Field>
            <Field label="Relationship to you">
              <Input placeholder="Father, mother, spouse…" />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold">Where and when?</h2>
            <Field label="Location">
              <RadioGroup defaultValue="hospital" className="grid gap-3 sm:grid-cols-2">
                <RadioOption value="hospital" label="Hospital" hint="A hospital doctor certifies death" />
                <RadioOption value="home" label="At home" hint="Call 112 (unexpected) or Hausarzt (expected)" />
              </RadioGroup>
            </Field>
            <Field label="City / hospital name"><Input placeholder="Charité Mitte, Berlin" /></Field>
            <Field label="Date & time"><Input type="datetime-local" /></Field>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold">Faith and wishes</h2>
            <Field label="Faith">
              <RadioGroup defaultValue="islam" className="grid gap-2 sm:grid-cols-3">
                {["Islam", "Christian", "Hindu", "Sikh", "Buddhist", "Other"].map((f) => (
                  <RadioOption key={f} value={f.toLowerCase()} label={f} />
                ))}
              </RadioGroup>
            </Field>
            <Field label="What should happen with the body?">
              <RadioGroup defaultValue="burial" className="grid gap-2 sm:grid-cols-3">
                <RadioOption value="burial" label="Burial in Germany" />
                <RadioOption value="cremation" label="Cremation" />
                <RadioOption value="repatriation" label="Repatriate abroad" />
              </RadioGroup>
            </Field>
            <Field label="If repatriating, destination country/city">
              <Input placeholder="Lahore, Pakistan" />
            </Field>
            <Field label="Special wishes or notes">
              <Textarea placeholder="Anything the case manager should know" className="min-h-24" />
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold">Family contact</h2>
            <Field label="Primary contact name"><Input placeholder="Ahmed Khan" /></Field>
            <Field label="Relationship"><Input placeholder="Son" /></Field>
            <Field label="Phone"><Input placeholder="+49 …" /></Field>
            <Field label="Email"><Input type="email" placeholder="you@example.com" /></Field>
            <Field label="Preferred language">
              <RadioGroup defaultValue="en" className="grid gap-2 sm:grid-cols-3">
                {["EN", "DE", "UR", "TR", "AR", "HI"].map((l) => (
                  <RadioOption key={l} value={l.toLowerCase()} label={l} />
                ))}
              </RadioGroup>
            </Field>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold">Ready to submit</h2>
            <p className="text-sm text-muted-foreground">
              By submitting, you consent to Beistand contacting you and
              coordinating verified providers on your behalf. A digital mandate
              and GDPR consent form will be sent within minutes.
            </p>
            <div className="rounded-xl border border-border/60 bg-parchment/50 p-4 text-sm">
              <div className="font-medium">What happens next</div>
              <ol className="mt-2 space-y-1 text-muted-foreground">
                <li>1. Case manager calls you within 15 minutes.</li>
                <li>2. Digital authority & GDPR consent signed.</li>
                <li>3. Verified funeral director dispatched.</li>
                <li>4. You track every stage in your dashboard.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button className="bg-gradient-primary" onClick={() => setStep((s) => s + 1)}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="bg-gradient-primary"
            onClick={() => {
              alert("Case submitted. Your case manager will call within 15 minutes.");
              navigate({ to: "/app/cases" });
            }}
          >
            Submit case
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function RadioOption({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-background/60 p-3 hover:border-primary/50">
      <RadioGroupItem value={value} className="mt-0.5" />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </label>
  );
}
