import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getMyExpertProfile, updateMyExpertProfile } from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/availability")({
  head: () => ({ meta: [{ title: "Expert — availability" }] }),
  component: ExpertAvailability,
});

function ExpertAvailability() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const getFn = useServerFn(getMyExpertProfile);
  const updateFn = useServerFn(updateMyExpertProfile);
  const q = useQuery({ queryKey: ["expert", "profile"], queryFn: () => getFn() });

  const [notes, setNotes] = useState("");
  const [hourly, setHourly] = useState("");

  useEffect(() => {
    if (q.data) {
      setNotes((q.data as any).availability_notes ?? "");
      setHourly((q.data as any).hourly_rate_eur != null ? String((q.data as any).hourly_rate_eur) : "");
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () =>
      updateFn({
        data: {
          availability_notes: notes || null,
          hourly_rate_eur: hourly ? Number(hourly) : null,
        },
      }),
    onSuccess: () => {
      toast.success(t("expert.availability.saved", { defaultValue: "Availability updated" }));
      qc.invalidateQueries({ queryKey: ["expert", "profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">
          {t("expert.availability.title", { defaultValue: "Availability" })}
        </h1>
      </header>
      <p className="-mt-3 text-sm text-muted-foreground">
        {t("expert.availability.subtitle", {
          defaultValue:
            "When you're accepting new cases, and what a client pays for your time. Case managers see this before assigning you.",
        })}
      </p>

      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6">
        <div>
          <Label className="mb-1.5 block">
            {t("expert.availability.hourly", { defaultValue: "Hourly rate (€)" })}
          </Label>
          <Input
            type="number"
            min={0}
            step="1"
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
            placeholder="e.g. 80"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("expert.availability.hourlyHint", {
              defaultValue: "Only shown to case managers, never to clients directly.",
            })}
          </p>
        </div>
        <div>
          <Label className="mb-1.5 block">
            {t("expert.availability.notes", { defaultValue: "Availability notes" })}
          </Label>
          <Textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("expert.availability.placeholder", {
              defaultValue:
                "e.g. Tuesdays & Thursdays 10:00–16:00. Video consults only in July. Not accepting new cases until 20 August.",
            })}
          />
        </div>
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
