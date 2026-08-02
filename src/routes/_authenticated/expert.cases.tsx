import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyExpertCases } from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/cases")({
  head: () => ({ meta: [{ title: "Expert — my cases" }] }),
  component: ExpertCases,
});

function ExpertCases() {
  const { t } = useTranslation();
  const fn = useServerFn(listMyExpertCases);
  const q = useQuery({ queryKey: ["expert", "cases"], queryFn: () => fn() });

  const cases = q.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {t("expert.cases.title", { defaultValue: "My cases" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("expert.cases.subtitle", {
            defaultValue: "Every case where you're the primary expert or an assignee.",
          })}
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">{t("expert.table.reference", { defaultValue: "Ref" })}</th>
              <th className="p-3">{t("expert.table.title", { defaultValue: "Case" })}</th>
              <th className="p-3">{t("expert.table.type", { defaultValue: "Type" })}</th>
              <th className="p-3">{t("expert.table.role", { defaultValue: "Role" })}</th>
              <th className="p-3">{t("expert.table.status", { defaultValue: "Status" })}</th>
              <th className="p-3">{t("expert.table.opened", { defaultValue: "Opened" })}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c: any) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="p-3 font-mono text-xs">{c.reference}</td>
                <td className="p-3">
                  {c.title}
                  {c.urgent && (
                    <span className="ml-2 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                      URGENT
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground capitalize">
                  {String(c.case_type).replace(/_/g, " ")}
                </td>
                <td className="p-3 text-muted-foreground capitalize">
                  {String(c.assignment_role).replace(/_/g, " ")}
                </td>
                <td className="p-3 capitalize">{c.status}</td>
                <td className="p-3 text-muted-foreground">
                  {c.opened_at ? new Date(c.opened_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    to="/app/cases/$caseId"
                    params={{ caseId: c.id }}
                    className="text-primary hover:underline"
                  >
                    {t("common.open", { defaultValue: "Open" })} →
                  </Link>
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  {t("expert.cases.empty", { defaultValue: "No cases assigned yet." })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
