import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { askFamilyAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/_authenticated/app/assistant")({
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Can I claim Kindergeld for my newborn?",
  "How do I register at the Bürgeramt?",
  "کیا میں Bürgergeld لے سکتا ہوں؟",
  "Explain the difference between TK and AOK",
  "What documents do I need to renew my Blue Card?",
  "How do I convert my driving licence in Germany?",
];

function AssistantPage() {
  const { t, i18n } = useTranslation();
  const ask = useServerFn(askFamilyAssistant);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: t("assistant.greeting", {
        defaultValue:
          "Hallo 👋 I'm BeistandPlus AI. I can help with settlement, benefits, immigration, healthcare and end-of-life care in Germany. Ask me anything — in DE, EN, TR, UR, HI, PA, AR, KU, RU, UK, FA, PL or ZH.",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const history = messages
        .slice(1)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text }));
      return ask({ data: { question, language: i18n.language ?? "en", history } });
    },
    onSuccess: (result) => {
      setMessages((m) => [...m, { role: "assistant", text: result.answer }]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: t("assistant.error", {
            defaultValue: "Sorry — I couldn't answer that just now. Please try again in a moment.",
          }),
        },
      ]);
    },
  });

  function send(text: string) {
    const question = text.trim();
    if (!question || mutation.isPending) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    mutation.mutate(question);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-xl font-semibold">BeistandPlus AI</div>
          <div className="truncate text-xs text-muted-foreground">
            Always on · DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · FA · PL · ZH
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-soft ${
                m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-card"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("assistant.thinking", { defaultValue: "Thinking…" })}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-xl border border-border/60 bg-card p-3 text-left text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              › {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-border/60 pt-4"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("assistant.placeholder", { defaultValue: "Ask anything…" })}
          className="flex-1"
        />
        <Button type="submit" disabled={mutation.isPending} className="bg-gradient-primary">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      <p className="pt-2 text-[11px] text-muted-foreground">
        {t("assistant.disclaimer", {
          defaultValue:
            "General guidance only — not legal, tax, medical or insurance advice. Your case manager can confirm anything important.",
        })}
      </p>
    </div>
  );
}
