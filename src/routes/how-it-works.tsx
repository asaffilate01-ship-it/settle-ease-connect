import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — BeistandPlus" },
      { name: "description", content: "The Beistand workflow: settle, claim, belong, stand with — coordinated by a human case manager and an AI assistant." },
      { property: "og:title", content: "How it works — BeistandPlus" },
      { property: "og:description", content: "From your first Anmeldung to the hardest moments, here's how BeistandPlus carries you." },
      { property: "og:url", content: "https://beistandplus.de/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/how-it-works" }],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { n: "01", title: t("pages.howItWorks.steps.s1Title"), desc: t("pages.howItWorks.steps.s1Desc") },
    { n: "02", title: t("pages.howItWorks.steps.s2Title"), desc: t("pages.howItWorks.steps.s2Desc") },
    { n: "03", title: t("pages.howItWorks.steps.s3Title"), desc: t("pages.howItWorks.steps.s3Desc") },
    { n: "04", title: t("pages.howItWorks.steps.s4Title"), desc: t("pages.howItWorks.steps.s4Desc") },
    { n: "05", title: t("pages.howItWorks.steps.s5Title"), desc: t("pages.howItWorks.steps.s5Desc") },
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          {t("pages.howItWorks.eyebrow")}
        </div>
        <h1 className="display-hero text-balance mt-3 font-semibold">
          {t("pages.howItWorks.title1")}<br />{t("pages.howItWorks.title2")}
        </h1>
        <div className="mt-16 space-y-10">
          {steps.map((s) => (
            <div key={s.n} className="grid gap-6 border-t border-border/60 pt-10 sm:grid-cols-[120px_1fr]">
              <div className="font-display text-4xl font-semibold text-foreground/60">{s.n}</div>
              <div>
                <h3 className="display-md font-semibold">{s.title}</h3>
                <p className="mt-2 text-lg text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-20 rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
          <div className="font-display text-2xl font-semibold">{t("pages.howItWorks.readyTitle")}</div>
          <p className="mt-2 text-muted-foreground">{t("pages.howItWorks.readyBody")}</p>
          <a href="/app" className="mt-4 inline-flex items-center gap-1 font-medium text-primary">
            {t("pages.howItWorks.openDashboard")} <ArrowRight className="h-4 w-4 rtl-flip" />
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
