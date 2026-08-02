import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askKnowledgeBase } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/portal/assistant")({
  component: KBAssistant,
});

type Msg = { role: "user" | "assistant"; content: string };

function KBAssistant() {
  const { t } = useTranslation();
  const ask = useServerFn(askKnowledgeBase);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t("pages.staffAssistant.greeting") },
  ]);
  const [input, setInput] = useState("");

  const send = useMutation({
    mutationFn: async (q: string) => ask({ data: { question: q, history: messages.slice(-10) } }),
    onSuccess: (res: any) => setMessages((m) => [...m, { role: "assistant", content: res.answer }]),
    onError: (e: any) =>
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e?.message ?? e}` }]),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    send.mutate(q);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-xl font-semibold">
            {t("pages.staffAssistant.title")}
          </div>
          <div className="text-xs text-muted-foreground">{t("pages.staffAssistant.subtitle")}</div>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-soft ${m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-card"}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="text-xs text-muted-foreground">{t("pages.staffAssistant.thinking")}</div>
        )}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-border/60 pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("pages.staffAssistant.inputPh")}
        />
        <Button type="submit" disabled={!input.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
