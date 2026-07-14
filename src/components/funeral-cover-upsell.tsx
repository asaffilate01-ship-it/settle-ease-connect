import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import {
  submitFuneralLead,
  listMyFuneralLeads,
  listMyFuneralPolicies,
} from "@/lib/funeral-cover.functions";

type Household = "individual" | "family" | "extended";

export function FuneralCoverUpsell({ defaultEmail, defaultName }: { defaultEmail?: string; defaultName?: string }) {
  const [open, setOpen] = useState(false);
  const submit = useServerFn(submitFuneralLead);
  const list = useServerFn(listMyFuneralLeads);
  const listPol = useServerFn(listMyFuneralPolicies);
  const qc = useQueryClient();

  const leadsQ = useQuery({ queryKey: ["me", "funeral-leads"], queryFn: () => list() });
  const polsQ = useQuery({ queryKey: ["me", "funeral-policies"], queryFn: () => listPol() });

  const [form, setForm] = useState({
    contact_name: defaultName ?? "",
    email: defaultEmail ?? "",
    phone: "",
    household_kind: "family" as Household,
    adults_count: 2,
    children_count: 0,
    target_benefit_eur: 20000,
    city: "",
    bundesland: "",
    notes: "",
  });

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          contact_name: form.contact_name,
          email: form.email,
          phone: form.phone || null,
          household_kind: form.household_kind,
          adults_count: Number(form.adults_count),
          children_count: Number(form.children_count),
          target_benefit_eur: Number(form.target_benefit_eur),
          city: form.city || null,
          bundesland: form.bundesland || null,
          notes: form.notes || null,
        },
      }),
    onSuccess: () => {
      toast.success("Request received — a case manager will be in touch.");
      qc.invalidateQueries({ queryKey: ["me", "funeral-leads"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hasLead = (leadsQ.data ?? []).length > 0;
  const hasPolicy = (polsQ.data ?? []).length > 0;

  return (
    <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-clay-sm">
          <HeartHandshake className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="font-display text-xl font-semibold">Family funeral cover</h2>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest">Optional add-on</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            One premium covers the whole household — €20,000 benefit per insured adult, repatriation, funeral costs, sworn translations and estate coordination. Underwritten by our regulated partners; premium is paid directly to the insurer.
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {[
              "€20k benefit per insured adult",
              "Full repatriation abroad",
              "Direct settlement of funeral invoices",
              "Sworn translations & estate paperwork",
              "24/7 multilingual case manager",
              "Children under 20 included at no extra premium",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {hasPolicy && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" /> You have {polsQ.data!.length} active polic{polsQ.data!.length === 1 ? "y" : "ies"} on file.
              </div>
            </div>
          )}

          {!open && !hasLead && !hasPolicy && (
            <Button className="mt-4 bg-gradient-primary" onClick={() => setOpen(true)}>
              Request a quote
            </Button>
          )}
          {!open && hasLead && !hasPolicy && (
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              Your request is being reviewed — a case manager will contact you shortly. Status:{" "}
              <span className="font-medium capitalize text-foreground">{leadsQ.data![0].status}</span>
            </div>
          )}

          {open && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mut.mutate();
              }}
              className="mt-4 grid gap-3 rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name *">
                  <Input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </Field>
                <Field label="Email *">
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Household">
                  <select
                    value={form.household_kind}
                    onChange={(e) => setForm({ ...form, household_kind: e.target.value as Household })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="individual">Individual (1 adult)</option>
                    <option value="family">Family (up to 2 adults + 3 children)</option>
                    <option value="extended">Extended family (up to 4 adults + 3 children)</option>
                  </select>
                </Field>
                <Field label="Adults to insure">
                  <Input type="number" min={1} max={6} value={form.adults_count} onChange={(e) => setForm({ ...form, adults_count: Number(e.target.value) })} />
                </Field>
                <Field label="Children under 20">
                  <Input type="number" min={0} max={10} value={form.children_count} onChange={(e) => setForm({ ...form, children_count: Number(e.target.value) })} />
                </Field>
                <Field label="Target benefit per adult (€)">
                  <Input type="number" min={5000} max={50000} step={1000} value={form.target_benefit_eur} onChange={(e) => setForm({ ...form, target_benefit_eur: Number(e.target.value) })} />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </Field>
              </div>
              <Field label="Anything else we should know?">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-20" placeholder="Existing cover, health notes, faith-specific requirements, home country for repatriation…" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-gradient-primary" disabled={mut.isPending}>
                  {mut.isPending ? "Sending…" : "Request quote"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
