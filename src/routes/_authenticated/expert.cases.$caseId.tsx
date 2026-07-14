import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, FileText, Receipt, MessageSquare, Clock } from "lucide-react";
import { getMyExpertCase } from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/cases/$caseId")({
  head: () => ({ meta: [{ title: "Expert — case" }] }),
  component: ExpertCaseDetail,
});

function ExpertCaseDetail() {
  const { caseId } = Route.useParams();
  const { t } = useTranslation();
  const fn = useServerFn(getMyExpertCase);
  const q = useQuery({
    queryKey: ["expert", "case", caseId],
    queryFn: () => fn({ data: { caseId } }),
  });

  if (q.isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (q.error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-6">
          <p className="text-sm">{(q.error as any).message}</p>
          <Link to="/expert/cases" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("common.back", { defaultValue: "Back to cases" })}
          </Link>
        </div>
      </div>
    );
  }
  const data = q.data;
  if (!data) return null;
  const c: any = data.case;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/expert/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("common.back", { defaultValue: "Back" })}
        </Link>
      </div>
      <header className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-xs text-muted-foreground">{c.reference}</div>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              {c.title}
              {c.urgent && (
                <span className="ml-2 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  URGENT
                </span>
              )}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{String(c.case_type).replace(/_/g, " ")}</span>
              <span>·</span>
              <span className="capitalize">{c.status}</span>
              {c.city && (<><span>·</span><span>{c.city}{c.bundesland ? `, ${c.bundesland}` : ""}</span></>)}
              {c.opened_at && (<><span>·</span><span>{t("expert.case.opened", { defaultValue: "opened" })} {new Date(c.opened_at).toLocaleDateString()}</span></>)}
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
              {String(data.role).replace(/_/g, " ")}
            </span>
          </div>
        </div>
        {c.summary && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={<ClipboardList className="h-4 w-4" />} title={t("expert.case.tasks", { defaultValue: "Tasks" })}>
          {data.tasks.length === 0 ? (
            <Empty>{t("expert.case.emptyTasks", { defaultValue: "No open tasks." })}</Empty>
          ) : (
            <ul className="divide-y divide-border/40">
              {data.tasks.map((tk: any) => (
                <li key={tk.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{tk.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {tk.priority ?? "normal"} · {tk.due_date ? new Date(tk.due_date).toLocaleDateString() : t("expert.case.noDue", { defaultValue: "no due date" })}
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide capitalize">{tk.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon={<FileText className="h-4 w-4" />} title={t("expert.case.docs", { defaultValue: "Documents" })}>
          {data.documents.length === 0 ? (
            <Empty>{t("expert.case.emptyDocs", { defaultValue: "No documents shared with you yet." })}</Empty>
          ) : (
            <ul className="divide-y divide-border/40">
              {data.documents.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.file_name}</div>
                    <div className="text-xs text-muted-foreground">{d.mime_type} · {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : ""}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon={<Receipt className="h-4 w-4" />} title={t("expert.case.quotes", { defaultValue: "Your quotes" })}>
          {data.quotes.length === 0 ? (
            <Empty>{t("expert.case.emptyQuotes", { defaultValue: "No quotes sent for this case." })}</Empty>
          ) : (
            <ul className="divide-y divide-border/40">
              {data.quotes.map((q2: any) => (
                <li key={q2.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{q2.title || "Quote"}</div>
                    <div className="text-xs text-muted-foreground">
                      €{Number(q2.amount_eur ?? 0).toFixed(2)} · {q2.sent_at ? new Date(q2.sent_at).toLocaleDateString() : t("expert.case.draft", { defaultValue: "draft" })}
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide capitalize">{q2.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon={<Receipt className="h-4 w-4" />} title={t("expert.case.invoices", { defaultValue: "Invoices & payouts" })}>
          {data.invoices.length === 0 ? (
            <Empty>{t("expert.case.emptyInvoices", { defaultValue: "No invoices yet." })}</Empty>
          ) : (
            <ul className="divide-y divide-border/40">
              {data.invoices.map((iv: any) => (
                <li key={iv.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">€{Number(iv.amount_eur ?? 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("expert.case.payout", { defaultValue: "payout" })} €{Number(iv.payout_to_expert_eur ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide capitalize">{String(iv.status).replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon={<MessageSquare className="h-4 w-4" />} title={t("expert.case.messages", { defaultValue: "Client messages" })} className="lg:col-span-2">
          {data.messages.length === 0 ? (
            <Empty>{t("expert.case.emptyMsgs", { defaultValue: "No messages yet." })}</Empty>
          ) : (
            <ul className="space-y-3">
              {data.messages.slice(0, 8).map((m: any) => (
                <li key={m.id} className="rounded-lg border border-border/40 bg-background p-3 text-sm">
                  <div className="mb-1 text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-line">{m.body}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon={<Clock className="h-4 w-4" />} title={t("expert.case.timeline", { defaultValue: "Timeline" })} className="lg:col-span-2">
          {data.events.length === 0 ? (
            <Empty>{t("expert.case.emptyEvents", { defaultValue: "No activity yet." })}</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.events.map((e: any) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="flex-1 capitalize">{String(e.event_type).replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  className,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card p-5 ${className ?? ""}`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>;
}
