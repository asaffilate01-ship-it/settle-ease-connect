import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { estimatePremium } from "@/lib/premium-estimator";
import { submitInsuranceLead } from "@/lib/insurance-leads.functions";
import { toast } from "sonner";

export function BereavementQuoteWidget() {
  const submit = useServerFn(submitInsuranceLead);

  const [age, setAge] = useState(45);
  const [benefit, setBenefit] = useState(20000);
  const [tobacco, setTobacco] = useState(false);
  const [waiting, setWaiting] = useState(0);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const estimate = useMemo(
    () => estimatePremium({ age, benefitAmount: benefit, tobacco, waitingPeriodMonths: waiting }),
    [age, benefit, tobacco, waiting],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error("Please add your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          full_name: fullName,
          email,
          phone: phone || null,
          age,
          benefit_amount: benefit,
          tobacco,
          waiting_period_months: waiting,
          estimated_premium_min: estimate.min,
          estimated_premium_max: estimate.max,
          preferred_language: "de",
          notes: null,
        },
      });
      setDone(true);
      toast.success("Thanks — a case manager will call within one working day.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="p-8 text-center">
        <div className="text-2xl font-semibold">Danke — wir melden uns.</div>
        <p className="mt-3 text-muted-foreground">
          A licensed case manager will contact you within one working day to walk through the
          binding offers from our partner insurers.
        </p>
      </Card>
    );
  }

  return (
    <Card className="grid gap-8 p-6 md:grid-cols-5 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6 md:col-span-3">
        <div>
          <div className="flex items-baseline justify-between">
            <Label>Your age</Label>
            <span className="text-sm font-medium tabular-nums">{age}</span>
          </div>
          <Slider min={18} max={80} step={1} value={[age]} onValueChange={(v) => setAge(v[0])} className="mt-2" />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label>Benefit amount</Label>
            <span className="text-sm font-medium tabular-nums">€{benefit.toLocaleString("de-DE")}</span>
          </div>
          <Slider min={2000} max={8000} step={1000} value={[benefit]} onValueChange={(v) => setBenefit(v[0])} className="mt-2" />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="text-sm">Tobacco user</Label>
            <p className="text-xs text-muted-foreground">Smoked in the last 12 months</p>
          </div>
          <Switch checked={tobacco} onCheckedChange={setTobacco} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="text-sm">24-month waiting period</Label>
            <p className="text-xs text-muted-foreground">Simplified underwriting, lower premium</p>
          </div>
          <Switch checked={waiting > 0} onCheckedChange={(v) => setWaiting(v ? 24 : 0)} />
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="lead-name">Full name</Label>
            <Input id="lead-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="lead-email">Email</Label>
            <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="lead-phone">Phone (optional)</Label>
            <Input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Request binding offers"}
        </Button>
        <p className="text-xs text-muted-foreground">
          This is a non-binding indication. BeistandPlus introduces you to licensed §34d GewO insurance
          brokers. No advice is given until you speak with a broker.
        </p>
      </form>

      <div className="md:col-span-2">
        <div className="sticky top-24 rounded-xl bg-accent/40 p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estimated monthly premium
          </div>
          <div className="mt-2 font-display text-4xl font-semibold tabular-nums">
            €{estimate.min}–€{estimate.max}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">per month, lifelong cover</div>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex justify-between"><span className="text-muted-foreground">Benefit</span><span className="font-medium">€{benefit.toLocaleString("de-DE")}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-medium">{age}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Tobacco</span><span className="font-medium">{tobacco ? "Yes" : "No"}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Waiting period</span><span className="font-medium">{waiting} mo</span></li>
          </ul>

          <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
            Range reflects the spread across Monuta, DELA, Nürnberger, IDEAL & HanseMerkur for a
            €{benefit.toLocaleString("de-DE")} lifelong Sterbegeld policy. Final premium depends on
            health underwriting.
          </div>
        </div>
      </div>
    </Card>
  );
}
