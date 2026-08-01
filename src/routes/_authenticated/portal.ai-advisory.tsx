import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  generateAdvisoryDraft,
  listAdvisoryDrafts,
  reviewAdvisoryDraft,
} from "@/lib/ai-advisory.functions";

export const Route = createFileRoute("/_authenticated/portal/ai-advisory")({
  head: () => ({
    meta: [
      { title: "AI advisory drafts — BeistandPlus staff" },
      {
        name: "description",
        content:
          "Generate AI drafts for regulated case questions. Every draft requires human approval before a client sees it.",
      },
    ],
  }),
  component: AiAdvisoryPage,
});

const DOMAINS = [
  "legal",
  "tax",
  "immigration",
  "insurance",
  "benefits",
  "medical",
  "funeral",
  "general",
] as const;
type Domain = (typeof DOMAINS)[number];

const REGULATED: Domain[] = ["legal", "tax", "immigration", "insurance", "medical"];
const FILTERS = ["pending", "approved", "sent", "rejected", "all"] as const;

function AiAdvisoryPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const generate = useServerFn(generateAdvisoryDraft);
  const list = useServerFn(listAdvisoryDrafts);
  const review = useServerFn(reviewAdvisoryDraft);

  const [domain, setDomain] = useState<Domain>("general");
  const [caseId, setCaseId] = useState("");
  const [question, setQuestion] = useState("");
  const [clientContext, setClientContext] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [send, setSend] = useState<Record<string, boolean>>({});

  const { data: drafts = [] } = useQuery({
    queryKey: ["ai-advisory", filter],
    queryFn: () => list({ data: { status: filter } }),
  });

  const create = useMutation({
    mutationFn: async () =>
      generate({
        data: {
          domain,
          question: question.trim(),
          ...(caseId.trim() ? { caseId: caseId.trim() } : {}),
          ...(clientContext.trim() ? { clientContext: clientContext.trim() } : {}),
        },
      }),
    onSuccess: () => {
      toast.success(t("pages.aiAdvisory.created"));
      setQuestion("");
      setClientContext("");
      setFilter("pending");
      qc.invalidateQueries({ queryKey: ["ai-advisory"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const decide = useMutation({
    mutationFn: async (p: { id: string; decision: "approved" | "rejected" }) =>
      review({
        data: {
          id: p.id,
          decision: p.decision,
          sendToCase: p.decision === "approved" && !!send[p.id],
          ...(edits[p.id] ? { editedText: edits[p.id] } : {}),
          ...(notes[p.id] ? { reviewNotes: notes[p.id] } : {}),
        },
      }),
    onSuccess: () => {
      toast.success(t("pages.aiAdvisory.reviewed"));
      qc.invalidateQueries({ queryKey: ["ai-advisory"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-lg font-semibold">{t("pages.aiAdvisory.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pages.aiAdvisory.subtitle")}</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>{t("pages.aiAdvisory.notice")}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("pages.aiAdvisory.newDraft")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {t(`pages.aiAdvisory.domain.${d}`)}
                  {REGULATED.includes(d) ? " ⚖" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            placeholder={t("pages.aiAdvisory.caseIdPlaceholder")}
          />
        </div>
        <Textarea
          className="mt-3"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("pages.aiAdvisory.questionPlaceholder")}
        />
        <Textarea
          className="mt-3"
          rows={3}
          value={clientContext}
          onChange={(e) => setClientContext(e.target.value)}
          placeholder={t("pages.aiAdvisory.contextPlaceholder")}
        />
        <Button
          className="mt-3"
          disabled={question.trim().length < 10 || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? t("pages.aiAdvisory.generating") : t("pages.aiAdvisory.generate")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {t(`pages.aiAdvisory.filter.${f}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {drafts.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("pages.aiAdvisory.empty")}</p>
        )}
        {drafts.map((d: any) => {
          const locked = d.status === "sent" || d.status === "rejected";
          return (
            <div key={d.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{d.question}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(`pages.aiAdvisory.domain.${d.domain}`)} ·{" "}
                    {new Date(d.created_at).toLocaleString()}
                    {d.case_id ? ` · ${d.case_id.slice(0, 8)}…` : ""}
                  </div>
                </div>
                <Badge variant={d.status === "sent" ? "default" : "outline"}>
                  {t(`pages.aiAdvisory.status.${d.status}`)}
                </Badge>
              </div>

              <Textarea
                className="mt-3 font-mono text-xs"
                rows={10}
                readOnly={locked}
                value={edits[d.id] ?? d.draft_text}
                onChange={(e) => setEdits((s) => ({ ...s, [d.id]: e.target.value }))}
              />

              {!locked && (
                <>
                  <Input
                    className="mt-3"
                    value={notes[d.id] ?? ""}
                    onChange={(e) => setNotes((s) => ({ ...s, [d.id]: e.target.value }))}
                    placeholder={t("pages.aiAdvisory.notesPlaceholder")}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {d.case_id && (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!!send[d.id]}
                          onCheckedChange={(v) => setSend((s) => ({ ...s, [d.id]: !!v }))}
                        />
                        {t("pages.aiAdvisory.sendToCase")}
                      </label>
                    )}
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: d.id, decision: "approved" })}
                    >
                      {t("pages.aiAdvisory.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: d.id, decision: "rejected" })}
                    >
                      {t("pages.aiAdvisory.reject")}
                    </Button>
                  </div>
                </>
              )}

              {d.review_notes && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("pages.aiAdvisory.reviewNote")}: {d.review_notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
