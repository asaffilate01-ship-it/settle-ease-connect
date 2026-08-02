import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listCopyAudit, updateCopyAudit } from "@/lib/copy-audit.functions";

export const Route = createFileRoute("/_authenticated/portal/copy-audit")({
  component: CopyAuditPage,
});

const STATUSES = ["pending", "approved", "needs_revision", "blocked"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_KEY: Record<Status, string> = {
  pending: "pages.copyAudit.status.pending",
  approved: "pages.copyAudit.status.approved",
  needs_revision: "pages.copyAudit.status.needsRevision",
  blocked: "pages.copyAudit.status.blocked",
};

function CopyAuditPage() {
  const { t } = useTranslation();
  const list = useServerFn(listCopyAudit);
  const update = useServerFn(updateCopyAudit);
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["copy-audit"], queryFn: () => list() });
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async (p: { id: string; status: Status; notes: string }) =>
      update({ data: { id: p.id, status: p.status, notes: p.notes } }),
    onSuccess: () => {
      toast.success(t("pages.copyAudit.saved"));
      qc.invalidateQueries({ queryKey: ["copy-audit"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-lg font-semibold">{t("pages.copyAudit.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pages.copyAudit.subtitle")}</p>
      </div>
      <div className="grid gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{r.surface}</div>
                <div className="text-xs text-muted-foreground">
                  {r.route_path} · {r.domain}
                </div>
              </div>
              <Badge variant={r.status === "approved" ? "default" : "outline"}>
                {t(STATUS_KEY[r.status as Status] ?? "pages.copyAudit.status.pending")}
              </Badge>
            </div>
            <Textarea
              className="mt-3"
              defaultValue={r.notes ?? ""}
              onChange={(e) => setNotesById((s) => ({ ...s, [r.id]: e.target.value }))}
              placeholder={t("pages.copyAudit.reviewerNotesPh")}
              rows={3}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={r.status === s ? "default" : "outline"}
                  onClick={() =>
                    save.mutate({ id: r.id, status: s, notes: notesById[r.id] ?? r.notes ?? "" })
                  }
                >
                  {t(STATUS_KEY[s])}
                </Button>
              ))}
            </div>
            {r.reviewed_at && (
              <div className="mt-2 text-xs text-muted-foreground">
                {t("pages.copyAudit.reviewedOn", {
                  date: new Date(r.reviewed_at).toLocaleString(),
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
