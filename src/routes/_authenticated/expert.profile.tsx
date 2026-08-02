import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMyExpertProfile, updateMyExpertProfile } from "@/lib/expert-portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expert/profile")({
  head: () => ({ meta: [{ title: "Expert — profile" }] }),
  component: ExpertProfile,
});

function ExpertProfile() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const getFn = useServerFn(getMyExpertProfile);
  const updateFn = useServerFn(updateMyExpertProfile);

  const q = useQuery({ queryKey: ["expert", "profile"], queryFn: () => getFn() });
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    bundesland: "",
    bio: "",
    availability_notes: "",
    hourly_rate_eur: "",
    languages: "",
    specialisations: "",
  });

  useEffect(() => {
    if (q.data) {
      setForm({
        full_name: q.data.full_name ?? "",
        phone: q.data.phone ?? "",
        city: q.data.city ?? "",
        bundesland: q.data.bundesland ?? "",
        bio: q.data.bio ?? "",
        availability_notes: q.data.availability_notes ?? "",
        hourly_rate_eur: q.data.hourly_rate_eur != null ? String(q.data.hourly_rate_eur) : "",
        languages: Array.isArray(q.data.languages) ? q.data.languages.join(", ") : "",
        specialisations: Array.isArray(q.data.specialisations)
          ? q.data.specialisations.join(", ")
          : "",
      });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () =>
      updateFn({
        data: {
          full_name: form.full_name || undefined,
          phone: form.phone || null,
          city: form.city || null,
          bundesland: form.bundesland || null,
          bio: form.bio || null,
          availability_notes: form.availability_notes || null,
          hourly_rate_eur: form.hourly_rate_eur ? Number(form.hourly_rate_eur) : null,
          languages: form.languages
            ? form.languages
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
          specialisations: form.specialisations
            ? form.specialisations
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        },
      }),
    onSuccess: () => {
      toast.success(t("expert.profile.saved", { defaultValue: "Profile updated" }));
      qc.invalidateQueries({ queryKey: ["expert", "profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!q.isLoading && !q.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
          <p className="text-sm text-muted-foreground">
            {t("expert.setup.body", {
              defaultValue: "No expert profile record. Please contact your case manager.",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {t("expert.profile.title", { defaultValue: "Profile" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("expert.profile.subtitle", {
            defaultValue: "This is what case managers and clients see when picking an expert.",
          })}
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6">
        <Field label={t("expert.profile.fullName", { defaultValue: "Full name" })}>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("expert.profile.phone", { defaultValue: "Phone" })}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label={t("expert.profile.hourly", { defaultValue: "Hourly rate (€)" })}>
            <Input
              type="number"
              value={form.hourly_rate_eur}
              onChange={(e) => setForm({ ...form, hourly_rate_eur: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("expert.profile.city", { defaultValue: "City" })}>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label={t("expert.profile.bundesland", { defaultValue: "Bundesland" })}>
            <Input
              value={form.bundesland}
              onChange={(e) => setForm({ ...form, bundesland: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label={t("expert.profile.languages", { defaultValue: "Languages (comma separated)" })}
        >
          <Input
            value={form.languages}
            onChange={(e) => setForm({ ...form, languages: e.target.value })}
            placeholder="de, en, tr"
          />
        </Field>
        <Field
          label={t("expert.profile.specialisations", {
            defaultValue: "Specialisations (comma separated)",
          })}
        >
          <Input
            value={form.specialisations}
            onChange={(e) => setForm({ ...form, specialisations: e.target.value })}
          />
        </Field>
        <Field label={t("expert.profile.bio", { defaultValue: "Bio" })}>
          <Textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <Field label={t("expert.profile.availability", { defaultValue: "Availability notes" })}>
          <Textarea
            rows={3}
            value={form.availability_notes}
            onChange={(e) => setForm({ ...form, availability_notes: e.target.value })}
          />
        </Field>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending
              ? t("common.saving", { defaultValue: "Saving…" })
              : t("common.save", { defaultValue: "Save" })}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
