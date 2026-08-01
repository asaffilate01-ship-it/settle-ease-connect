import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bug, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listBugReports,
  createBugReport,
  updateBugReportStatus,
  deleteBugReport,
} from "@/lib/bugs.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/app/bugs")({
  head: () => ({
    meta: [
      { title: "Bug reports — BeistandPlus" },
      { name: "description", content: "Report bugs and track reported issues." },
    ],
  }),
  component: BugReportsPage,
});

const severityOptions = ["low", "medium", "high", "critical"] as const;
const statusOptions = ["open", "in_progress", "resolved", "closed"] as const;

function BugReportsPage() {
  const { t } = useTranslation();
  const { roles } = useCurrentUser();
  const isInternal = roles.includes("admin") || roles.includes("staff") || roles.includes("case_manager");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const fetchReports = useServerFn(listBugReports);
  const submitReport = useServerFn(createBugReport);
  const updateStatus = useServerFn(updateBugReportStatus);
  const removeReport = useServerFn(deleteBugReport);

  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["bug_reports"],
    queryFn: fetchReports,
  });

  const filtered =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await submitReport({
      data: {
        title: title.trim(),
        description: description.trim() || null,
        severity,
        source_route: pathname,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setOpenForm(false);
    qc.invalidateQueries({ queryKey: ["bug_reports"] });
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await updateStatus({
      data: { id, status: newStatus as any, assigned_to: null },
    });
    qc.invalidateQueries({ queryKey: ["bug_reports"] });
  }

  async function handleDelete(id: string) {
    if (!confirm(t("bugs.confirmDelete"))) return;
    await removeReport({ data: { id } });
    qc.invalidateQueries({ queryKey: ["bug_reports"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("bugs.subtitle")}
          </div>
          <h1 className="display-lg mt-2 font-semibold">
            {t("bugs.title")}
          </h1>
        </div>
        <Button onClick={() => setOpenForm((s) => !s)} className="bg-gradient-primary">
          <Bug className="mr-2 h-4 w-4" />
          {openForm ? t("bugs.closeForm") : t("bugs.newReport")}
        </Button>
      </div>

      {openForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t("bugs.titleLabel")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("bugs.titlePlaceholder")}
                required
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="description">{t("bugs.descriptionLabel")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("bugs.descriptionPlaceholder")}
                maxLength={5000}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="severity">{t("bugs.severityLabel")}</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as any)}
              >
                <SelectTrigger id="severity" className="w-full sm:w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`bugs.severity.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" className="bg-gradient-primary">
                {t("bugs.submit")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>
                <X className="mr-1 h-4 w-4" /> {t("bugs.cancel")}
              </Button>
            </div>
          </div>
        </form>
      )}

      {import.meta.env.DEV && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-parchment/60 p-4 text-xs text-muted-foreground">
          <strong>Dev-only test logins</strong> — pre-seeded. Sign in on <code className="rounded bg-muted px-1.5 py-0.5">/auth</code> with any of these:
          <div className="mt-2 grid gap-1 font-mono">
            <div>admin@beistand.de · admin</div>
            <div>staff@beistand.de · staff</div>
            <div>manager@beistand.de · case_manager</div>
            <div>expert@beistand.de · expert</div>
            <div>agent@beistand.de · agent</div>
          </div>
          <div className="mt-2">Password for all: <code className="rounded bg-muted px-1.5 py-0.5">beistand2026!</code></div>
        </div>
      )}


      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("bugs.filter.all")}</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`bugs.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("bugs.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft">
          <Bug className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">{t("bugs.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{report.title}</h3>
                    <SeverityBadge severity={report.severity} t={t} />
                    <StatusBadge status={report.status} t={t} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.description || t("bugs.noDescription")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                    {report.source_route && (
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {report.source_route}
                      </span>
                    )}
                    {isInternal && (report as any).full_name && (
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {(report as any).full_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isInternal ? (
                    <Select
                      value={report.status}
                      onValueChange={(v) => handleStatusChange(report.id, v)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`bugs.status.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    report.status === "open" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(report.id)}
                        aria-label={t("bugs.delete")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity, t }: { severity: string; t: (k: string) => string }) {
  const colors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-warning/20 text-warning-foreground",
    critical: "bg-destructive/20 text-destructive",
  };
  return (
    <Badge className={colors[severity] ?? colors.medium}>
      {t(`bugs.severity.${severity}`)}
    </Badge>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    closed: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  };
  return (
    <Badge className={colors[status] ?? colors.open}>
      {t(`bugs.status.${status}`)}
    </Badge>
  );
}
