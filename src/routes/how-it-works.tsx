import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — BeistandPlus" },
      { name: "description", content: "The Beistand workflow: settle, claim, belong, stand with — coordinated by a human case manager and an AI assistant." },
      { property: "og:title", content: "How it works — BeistandPlus" },
      { property: "og:description", content: "From your first Anmeldung to the hardest moments, here's how BeistandPlus carries you." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    n: "01",
    title: "Tell BeistandPlus what you need",
    desc: "Newly arrived, applying for benefits, planning a family reunion, or facing a bereavement — start with a single form.",
  },
  {
    n: "02",
    title: "A plan appears within minutes",
    desc: "Our AI compiles your personalised checklist — every appointment, document, deadline, and provider you'll need.",
  },
  {
    n: "03",
    title: "A human case manager picks up the phone",
    desc: "In your language. They own your case from start to close, and coordinate every party involved.",
  },
  {
    n: "04",
    title: "Everything happens inside one case file",
    desc: "Documents, letters, appointments, invoices, chat, audit trail — visible to you and the people helping you.",
  },
  {
    n: "05",
    title: "You get on with your life",
    desc: "We remind you before deadlines, chase authorities on your behalf, and translate anything you don't understand.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          How it works
        </div>
        <h1 className="display-hero mt-3 font-semibold">
          Five steps.<br />No paperwork storm.
        </h1>
        <div className="mt-16 space-y-10">
          {steps.map((s) => (
            <div key={s.n} className="grid gap-6 border-t border-border/60 pt-10 sm:grid-cols-[120px_1fr]">
              <div className="font-display text-4xl font-semibold text-accent-foreground/70">{s.n}</div>
              <div>
                <h3 className="display-md font-semibold">{s.title}</h3>
                <p className="mt-2 text-lg text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-20 rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
          <div className="font-display text-2xl font-semibold">Ready when you are.</div>
          <p className="mt-2 text-muted-foreground">
            Free to start. Upgrade only when you need the human help.
          </p>
          <a href="/app" className="mt-4 inline-flex items-center gap-1 font-medium text-primary">
            Open your dashboard <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
