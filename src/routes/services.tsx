import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Home, FileText, Users, Briefcase, Building, HeartPulse, GraduationCap, Scale, Flower2, ArrowRight } from "lucide-react";
import type { ComponentType } from "react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Beistand" },
      { name: "description", content: "Welfare, benefits, immigration, employment, housing, healthcare, community and end-of-life care in Germany." },
      { property: "og:title", content: "Services — Beistand" },
      { property: "og:description", content: "Every service a new arrival or long-time resident in Germany needs, in one place." },
    ],
  }),
  component: Services,
});

type Group = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  items: string[];
};

const groups: Group[] = [
  {
    icon: Home,
    title: "Settlement & registration",
    summary: "The first ninety days — Anmeldung, Tax ID, bank account and health insurance, calmly handled.",
    items: ["Anmeldung", "Tax ID", "Bank account", "Health insurance", "SIM & internet", "Utilities", "Deutschlandticket"],
  },
  {
    icon: FileText,
    title: "Government & benefits",
    summary: "Every entitlement you're owed — filed accurately, tracked to the day, in your language.",
    items: ["Bürgergeld", "Kindergeld", "Wohngeld", "Elterngeld", "Pension guidance", "Residence permits", "Visa reminders"],
  },
  {
    icon: Scale,
    title: "Visas, immigration & nationality",
    summary: "From Chancenkarte to Niederlassungserlaubnis and dual citizenship — the full statutory path, one caseworker.",
    items: [
      "Student visa (§16b AufenthG)",
      "Job-seeker visa (§20)",
      "Skilled worker visa (§18a / §18b)",
      "EU Blue Card (§18g)",
      "Chancenkarte (opportunity card, points-based)",
      "Vocational training / Ausbildung visa (§16a)",
      "Freelance / self-employment visa (§21)",
      "Family reunification (§27–§36)",
      "Visa extensions & change of purpose",
      "Permanent residence (Niederlassungserlaubnis)",
      "EU long-term residence",
      "Naturalisation & dual citizenship (StAG)",
      "Passport renewals & home-country consular help",
      "Ausländerbehörde bookings & escort",
    ],
  },
  {
    icon: Briefcase,
    title: "Employment",
    summary: "German-format CV, employer intros, Anerkennung of foreign qualifications — a route into meaningful work.",
    items: ["German CV builder", "Job matching", "Direct work-visa employers", "Apprenticeships", "Interview prep", "Skilled trades", "Anerkennung (qualification recognition)", "Delivery & driver jobs"],
  },
  {
    icon: Building,
    title: "Housing",
    summary: "A home you can register at — from WG search to Sozialwohnung advice and deposit loans.",
    items: ["Apartments & WG", "Social housing advice", "Deposit loans", "Landlord references", "Utility setup"],
  },
  {
    icon: HeartPulse,
    title: "Healthcare",
    summary: "Doctors who speak your language, insurance you understand, mental-health care that meets you where you are.",
    items: ["English- & Urdu-speaking doctors", "Insurance comparison", "Mental health support", "Pregnancy services"],
  },
  {
    icon: Users,
    title: "Community",
    summary: "The people, places and rhythms of home — nearby, trusted, and open to your family.",
    items: ["Mosque finder", "Prayer times", "Halal restaurants", "Islamic schools", "Women's groups", "Youth clubs"],
  },
  {
    icon: GraduationCap,
    title: "Students & universities",
    summary: "uni-assist, TestAS, Sperrkonto, Studienkolleg and the post-study 18-month permit — the academic runway.",
    items: [
      "University shortlisting (TU9, Fachhochschulen)",
      "uni-assist & DAAD applications",
      "APS certificate (India, China, Vietnam)",
      "TestAS, TestDaF, DSH, IELTS booking",
      "Motivation letters & CV review",
      "Studienkolleg placement",
      "Blocked account (Sperrkonto) setup",
      "Student visa & National D-Visa",
      "BAföG & scholarships (DAAD, Deutschlandstipendium)",
      "Semester ticket & enrolment",
      "Werkstudent & 20h/week rules",
      "Post-study 18-month residence permit",
    ],
  },
  {
    icon: Flower2,
    title: "Burials, cremations & last rites",
    summary: "Dignified end-of-life care that honours faith and law — Islamic, Jewish, Hindu, Sikh and secular rites.",
    items: [
      "Erdbestattung (earth burial)",
      "Feuerbestattung (cremation) + 2. Leichenschau",
      "Urnenbeisetzung & columbarium",
      "Islamic burial (Qibla-aligned, sargloses Bestatten)",
      "Jewish burial (Chevra Kadisha)",
      "Hindu / Sikh cremation + ashes export",
      "Baumbestattung / Ruheforst / Seebestattung",
      "Sozialbestattung (§74 SGB XII)",
      "International repatriation",
    ],
  },
];

const languages = ["Deutsch", "English", "Türkçe", "اردو", "हिन्दी", "ਪੰਜਾਬੀ", "العربية", "کوردی", "Русский", "Українська", "فارسی", "Polski", "中文"];

function Services() {
  return (
    <div className="min-h-screen bg-parchment/40">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-hero" />
        <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-foreground/80 backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-accent" />
            Expert guidance for life in Germany
          </span>
          <h1 className="mt-8 font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-7xl">
            A companion for every
            <br />
            <span className="italic text-primary">essential milestone.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            From your first Anmeldung to securing your family's future, Beistand
            offers dignified, expert support to navigate German administration
            with confidence — in thirteen languages, with a human by your side.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:-translate-y-0.5"
            >
              Open a case
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-6 py-3 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-card"
            >
              How Beistand works
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial intro rule */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 border-t border-primary/10 pt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-foreground/70">
            Nine areas of care
          </div>
          <div className="h-px w-16 bg-accent/60" />
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => (
            <article
              key={g.title}
              className="group relative flex flex-col rounded-sm border border-primary/10 bg-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-elevated sm:p-10"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent-foreground transition-colors group-hover:bg-accent/25">
                  <g.icon className="h-5 w-5" />
                </div>
                <span className="font-display text-xs italic tracking-wide text-muted-foreground/70">
                  {String(i + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-7 font-display text-2xl font-normal leading-snug tracking-tight text-foreground">
                {g.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {g.summary}
              </p>
              <ul className="mt-6 space-y-1.5 text-[13px] leading-relaxed text-foreground/70">
                {g.items.slice(0, 5).map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 h-px w-3 shrink-0 bg-accent/70" />
                    <span>{item}</span>
                  </li>
                ))}
                {g.items.length > 5 && (
                  <li className="pl-5 pt-1 text-xs italic text-muted-foreground/80">
                    +{g.items.length - 5} more services
                  </li>
                )}
              </ul>
              <div className="mt-8 flex-grow" />
              <Link
                to="/app"
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-all group-hover:gap-3.5 group-hover:text-primary"
              >
                Learn more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Language ribbon */}
      <section className="border-y border-primary/10 bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-foreground/70">
              We work with you in your language
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display text-lg text-foreground/80 sm:gap-x-8">
              {languages.map((l, i) => (
                <span key={l} className="flex items-center gap-6 sm:gap-8">
                  <span>{l}</span>
                  {i < languages.length - 1 && (
                    <span className="hidden h-1 w-1 rounded-full bg-accent/60 sm:inline-block" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            { k: "Human first", v: "Real case managers in Berlin, Hamburg, München and Köln — every case answered by a person, not a bot." },
            { k: "GDPR-native", v: "Your documents live in an encrypted vault, hosted in Germany, with deputy access for illness or bereavement." },
            { k: "One transparent bill", v: "Subscription for our work, at-cost for third-party fees, and full visibility of every euro." },
          ].map((t) => (
            <div key={t.k}>
              <div className="h-px w-10 bg-accent" />
              <div className="mt-5 font-display text-xl text-foreground">{t.k}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-sm border border-primary/15 bg-primary p-10 text-primary-foreground sm:p-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                Ready when you are
              </div>
              <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
                Let's take the next step,
                <br className="hidden sm:block" />
                <span className="italic">together.</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/80">
                Open a free case in minutes. A case manager reviews it within
                one working day and maps out your options — no obligation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Open a case
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-6 py-3 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
