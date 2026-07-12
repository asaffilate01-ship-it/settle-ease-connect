import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { createCase } from "@/lib/cases.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/cases/new")({
  component: NewCase,
});

const CASE_TYPES = [
  ["bereavement","Bereavement"], ["visa_application","Visa application"], ["visa_extension","Visa extension"],
  ["nationality","Nationality"], ["family_reunification","Family reunification"], ["benefits_claim","Benefits claim"],
  ["housing","Housing / Anmeldung"], ["tax","Tax"], ["education","Education"], ["healthcare","Healthcare / insurance"],
  ["translation","Translation"], ["driving","Driving licence"], ["business","Business / Gewerbe"], ["other","Other"],
] as const;

function NewCase() {
  const navigate = useNavigate();
  const fn = useServerFn(createCase);
  const [form, setForm] = useState({
    title: "", case_type: "bereavement" as (typeof CASE_TYPES)[number][0],
    summary: "", urgent: false, language: "en", city: "", bundesland: "",
  });

  const mut = useMutation({
    mutationFn: (values: typeof form) => fn({ data: values }),
    onSuccess: (row) => {
      toast.success("Case opened. A manager will respond shortly.");
      navigate({ to: "/app/cases/$caseId", params: { caseId: row.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link to="/app/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Cases
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold">Open a new case</h1>
        <p className="text-sm text-muted-foreground">A case manager responds within 15 minutes.</p>
      </div>
      <form
        className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
        onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
      >
        <Field label="Short title">
          <Input required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Repatriation to Istanbul" />
        </Field>
        <Field label="Type">
          <Select value={form.case_type} onValueChange={(v) => setForm({ ...form, case_type: v as typeof form.case_type })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CASE_TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Berlin" /></Field>
          <Field label="Bundesland"><Input value={form.bundesland} onChange={(e) => setForm({ ...form, bundesland: e.target.value })} placeholder="Berlin" /></Field>
        </div>
        <Field label="Preferred language">
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["de","en","tr","ur","hi","pa","ar","ku","ru","uk","fa","pl","zh"].map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Summary">
          <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="min-h-28" placeholder="Tell us what happened and what you need help with." />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.urgent} onCheckedChange={(v) => setForm({ ...form, urgent: !!v })} />
          <span>This is urgent (call within the hour)</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/app/cases" })}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary" disabled={mut.isPending}>
            {mut.isPending ? "Opening…" : "Open case"}
          </Button>
        </div>
      </form>
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
