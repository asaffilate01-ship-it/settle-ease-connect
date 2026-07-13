import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowRight } from "lucide-react";
import { Icon3D, type Icon3DName } from "@/components/icon3d";
import heroServices from "@/assets/brand/hero-services.jpg";


export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — BeistandPlus" },
      { name: "description", content: "Welfare, benefits, immigration, employment, housing, healthcare, community and end-of-life care in Germany." },
      { property: "og:title", content: "Services — BeistandPlus" },
      { property: "og:description", content: "Every service a new arrival or long-time resident in Germany needs, in one place." },
      { property: "og:url", content: "https://beistandplus.de/services" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/services" }],
  }),
  component: Services,
});

type Group = {
  icon: Icon3DName;
  title: string;
  summary: string;
  items: string[];
};

const groups: Group[] = [
  {
    icon: "settlement",
    title: "Settlement & registration",
    summary: "The first ninety days — Anmeldung, Tax ID, bank account and health insurance, calmly handled.",
    items: ["Anmeldung", "Tax ID", "Bank account", "Health insurance", "SIM & internet", "Utilities", "Deutschlandticket"],
  },
  {
    icon: "government",
    title: "Government & benefits",
    summary: "Every entitlement you're owed — filed accurately, tracked to the day, in your language.",
    items: ["Bürgergeld", "Kindergeld", "Wohngeld", "Elterngeld", "Pension guidance", "Residence permits", "Visa reminders"],
  },
  {
    icon: "visas",
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
    icon: "employment",
    title: "Employment",
    summary: "German-format CV, employer intros, Anerkennung of foreign qualifications — a route into meaningful work.",
    items: ["German CV builder", "Job matching", "Direct work-visa employers", "Apprenticeships", "Interview prep", "Skilled trades", "Anerkennung (qualification recognition)", "Delivery & driver jobs"],
  },
  {
    icon: "housing",
    title: "Housing",
    summary: "A home you can register at — from WG search to Sozialwohnung advice and deposit loans.",
    items: ["Apartments & WG", "Social housing advice", "Deposit loans", "Landlord references", "Utility setup"],
  },
  {
    icon: "healthcare",
    title: "Health insurance (mandatory)",
    summary: "Krankenversicherung is required by law from day one — public (GKV) or private (PKV), we get you covered before Anmeldung and TK/AOK/Barmer paperwork is done for you.",
    items: [
      "Gesetzliche Krankenversicherung (GKV): TK, AOK, Barmer, DAK, Techniker",
      "Private Krankenversicherung (PKV) comparison (Ottonova, Hallesche, Debeka)",
      "Expat / incoming health insurance (Mawista, Care Concept, DR-WALTER)",
      "Student health insurance (under 30 / over 30 rules)",
      "Family co-insurance (Familienversicherung — free for spouse & children)",
      "Freelancer & self-employed KV (voluntary GKV vs PKV)",
      "Pflegeversicherung (long-term care insurance, mandatory add-on)",
      "Switching provider & Kündigung help",
      "Reimbursement claims & bill translation",
    ],
  },
  {
    icon: "healthcare",
    title: "Healthcare",
    summary: "Doctors who speak your language, appointments booked for you, mental-health care that meets you where you are.",
    items: ["Multilingual doctors (English, Urdu, Turkish, Arabic, Russian and more)", "Termin booking (Facharzt waitlists)", "Mental health support", "Pregnancy & Hebamme services", "Dental & vision"],
  },
  {
    icon: "community",
    title: "Community",
    summary: "The people, places and rhythms of home — nearby, trusted and open to every faith and background.",
    items: ["Mosque, church, temple & gurdwara finder", "Prayer & service times", "Halal, kosher & vegetarian restaurants", "Faith & language schools", "Women's & parents' groups", "Youth clubs & sports"],
  },
  {
    icon: "experts",
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
    icon: "legal",
    title: "Legal & translations",
    summary: "Sworn translators, notaries and immigration lawyers on call — regulated, fixed-fee, no surprises.",
    items: ["Sworn translations", "Notary appointments", "Immigration lawyers", "Family & divorce law", "Tax advisors (Steuerberater)"],
  },
  {
    icon: "burials",
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
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-parchment/40">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-gradient-hero" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] opacity-[0.18] mix-blend-multiply">
          <img
            src={heroServices}
            alt=""
            aria-hidden
            width={1600}
            height={1000}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-foreground/80 backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {t("pages.services.eyebrow")}
          </span>
          <h1 className="display-hero text-balance mt-8 font-normal leading-[1.05] text-foreground">
            {t("pages.services.title1")}
            <br />
            <span className="italic text-primary">{t("pages.services.title2")}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("pages.services.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-elevated hover:-translate-y-0.5"
            >
              {t("pages.services.openCase")}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-6 py-3 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-card"
            >
              {t("pages.services.howItWorks")}
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial intro rule */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 border-t border-primary/10 pt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-foreground/70">
            {t("pages.services.ninePillars")}
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
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 p-2 transition-transform group-hover:-translate-y-0.5 group-hover:scale-105">
                  <Icon3D name={g.icon} alt={g.title} />
                </div>
                <span className="font-display text-xs italic tracking-wide text-muted-foreground/70">
                  {String(i + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")}
                </span>
              </div>
              <h3 className="display-md mt-7 font-normal text-foreground">
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
                    {t("pages.services.moreServices", { count: g.items.length - 5 })}
                  </li>
                )}
              </ul>
              <div className="mt-8 flex-grow" />
              <Link
                to="/app"
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-all group-hover:gap-3.5 group-hover:text-primary"
              >
                {t("pages.services.learnMore")}
                <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
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
              {t("pages.services.ribbon")}
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
            { k: t("pages.services.trustHuman"), v: t("pages.services.trustHumanBody") },
            { k: t("pages.services.trustGdpr"), v: t("pages.services.trustGdprBody") },
            { k: t("pages.services.trustBill"), v: t("pages.services.trustBillBody") },
          ].map((item) => (
            <div key={item.k}>
              <div className="h-px w-10 bg-accent" />
              <div className="mt-5 font-display text-xl text-foreground">{item.k}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.v}</p>
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
                {t("pages.services.readyEyebrow")}
              </div>
              <h2 className="display-lg text-balance mt-4">
                {t("pages.services.readyTitle1")}
                <br className="hidden sm:block" />
                <span className="italic"> {t("pages.services.readyTitle2")}</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/80">
                {t("pages.services.readyBody")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                {t("pages.services.openCase")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-6 py-3 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10"
              >
                {t("pages.services.seePricing")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
