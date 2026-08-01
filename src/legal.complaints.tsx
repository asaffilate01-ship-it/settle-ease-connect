import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { askFamilyAssistant } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/assistant")({
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; text: string };

const seed: Msg[] = [
  { role: "assistant", text: "Hallo Ahmed 👋 I'm BeistandPlus AI. I can help with settlement, benefits, immigration, healthcare and end-of-life care in Germany. Ask me anything — in DE, EN, TR, UR, HI, PA, AR, KU, RU, UK, FA, PL or ZH." },
];

const suggestions = [
  "Can I claim Kindergeld for my newborn?",
  "How do I register at the Bürgeramt?",
  "کیا میں Bürgergeld لے سکتا ہوں؟",
  "Explain the difference between TK and AOK",
  "What documents do I need to renew my Blue Card?",
  "Find me a Halal butcher in Neukölln",
];

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const ask = useServerFn(askFamilyAssistant);
  const sendMessage = useMutation({
    mutationFn: async (question: string) =>
      ask({
        data: {
          question,
          history: messages.slice(-10).map((message) => ({
            role: message.role,
            content: message.text,
          })),
        },
      }),
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.answer },
      ]);
    },
    onError: (error: Error) => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `I couldn't answer just now. ${error.message.includes("TOO_MANY_REQUESTS") ? "Please wait a few minutes and try again." : "Please try again or contact your case manager."}`,
        },
      ]);
    },
  });

  function send(text: string) {
    const question = text.trim();
    if (!question || sendMessage.isPending) return;
    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    sendMessage.mutate(question);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-xl font-semibold">BeistandPlus AI</div>
          <div className="text-xs text-muted-foreground">Always on · DE · EN · TR · UR · HI · PA · PS · AR · KU · RU · UK</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-soft ${
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground"
                  : "bg-card"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex justify-start" role="status">
            <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking the guidance library…
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
          placeholder="Ask anything…"
          className="flex-1"
        />
        <Button type="submit" className="bg-gradient-primary" disabled={!input.trim() || sendMessage.isPending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        AI guidance can make mistakes and is not legal, tax, medical or regulated insurance advice. Confirm important decisions with the named authority or your case manager.
      </p>
    </div>
  );
}
