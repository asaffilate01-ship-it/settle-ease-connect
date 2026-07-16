import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { summariseCaseDocument, extractEligibilityFromDocument } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai-tools")({
  component: AiToolsPage,
});

function AiToolsPage() {
  const summarise = useServerFn(summariseCaseDocument);
  const extract = useServerFn(extractEligibilityFromDocument);
  const [filename, setFilename] = useState("");
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"summary" | "eligibility">("summary");

  const sum = useMutation({ mutationFn: async () => summarise({ data: { filename, text } }) });
  const eli = useMutation({ mutationFn: async () => extract({ data: { filename, text } }) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-lg font-semibold">AI document tools</h1>
        <p className="text-sm text-muted-foreground">Summarise a document or extract eligibility fields for benefit forms. Runs on Lovable AI.</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={tab === "summary" ? "default" : "outline"} onClick={() => setTab("summary")}><Sparkles className="mr-2 h-4 w-4" />Summarise</Button>
        <Button size="sm" variant={tab === "eligibility" ? "default" : "outline"} onClick={() => setTab("eligibility")}><FileSearch className="mr-2 h-4 w-4" />Pre-fill eligibility</Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <Input placeholder="Filename (e.g. bescheid_2024.pdf)" value={filename} onChange={(e) => setFilename(e.target.value)} />
        <Textarea className="mt-3" rows={10} placeholder="Paste extracted document text here…" value={text} onChange={(e) => setText(e.target.value)} maxLength={60000} />
        <div className="mt-3">
          {tab === "summary" ? (
            <Button disabled={!filename || text.length < 20 || sum.isPending} onClick={() => sum.mutate()}>
              {sum.isPending ? "Working…" : "Generate summary"}
            </Button>
          ) : (
            <Button disabled={!filename || text.length < 20 || eli.isPending} onClick={() => eli.mutate()}>
              {eli.isPending ? "Working…" : "Extract fields"}
            </Button>
          )}
        </div>
      </div>

      {tab === "summary" && sum.data && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-2 text-sm font-medium">Summary</div>
          <div className="whitespace-pre-wrap text-sm">{(sum.data as any).summary}</div>
        </div>
      )}

      {tab === "eligibility" && eli.data && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-2 text-sm font-medium">Extracted fields</div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries((eli.data as any).fields ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">{k}</span>
                <Badge variant="outline">{v === null || v === undefined ? "—" : String(v)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
