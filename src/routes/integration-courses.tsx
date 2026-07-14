import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowUpRight, GraduationCap, Languages, Wallet, MapPin, Users, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/integration-courses")({
  head: () => ({
    meta: [
      { title: "Integration courses in Germany — a plain-language guide | BeistandPlus" },
      {
        name: "description",
        content:
          "Who can join a BAMF Integrationskurs, what it costs, how to apply, the A1–B1 language path, the 'Leben in Deutschland' orientation exam, and free alternatives (VHS, Goethe, DeutschAkademie).",
      },
      { property: "og:title", content: "Integration courses in Germany — BeistandPlus" },
      {
        property: "og:description",
        content: "Everything a newcomer needs to know about the Integrationskurs, from eligibility to the B1 exam — with direct links.",
      },
      { property: "og:url", content: "https://beistandplus.de/integration-courses" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/integration-courses" }],
  }),
  component: IntegrationCourses,
});

type LinkItem = { label: string; href: string; note?: string };

const OFFICIAL: LinkItem[] = [
  {
    label: "BAMF — Integrationskurs overview (DE/EN/TR/AR/RU/FA/UK)",
    href: "https://www.bamf.de/EN/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/integrationskurse-node.html",
    note: "The official page — eligibility, structure, costs, exam.",
  },
  {
    label: "NAvI — find a course near you (BAMF course finder)",
    href: "https://bamf-navi.bamf.de/",
    note: "Search by postcode, module, target group and start date.",
  },
  {
    label: "Apply for admission (Zulassungsantrag, form)",
    href: "https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Integrationskurse/Kursteilnehmer/AntraegeAlle/630-005_antrag-zulassung_pdf.html",
    note: "Form 630.005 — send to your regional BAMF office.",
  },
  {
    label: "Cost exemption / reimbursement (Kostenbefreiung)",
    href: "https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/KostenRueckerstattung/kostenrueckerstattung-node.html",
    note: "Bürgergeld, Wohngeld or low-income receivers can be exempted.",
  },
  {
    label: "Deutsch-Test für Zuwanderer (DTZ, A2/B1 exam)",
    href: "https://www.telc.net/pruefungen/deutsch-test-fuer-zuwanderer.html",
    note: "The BAMF-recognised final language exam, offered by telc & g.a.s.t.",
  },
  {
    label: "Leben in Deutschland — orientation exam",
    href: "https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/TestLeben/testlebenindeutschland-node.html",
    note: "33 questions on law, history, culture — also counts toward naturalisation.",
  },
];

const ALTERNATIVES: LinkItem[] = [
  { label: "Volkshochschule (VHS) — course finder", href: "https://www.volkshochschule.de/vhs-kurssuche/index.php", note: "Local adult-education centres in every city — often the cheapest option." },
  { label: "Goethe-Institut — courses & A1–C2 exams", href: "https://www.goethe.de/ins/de/en/kur.html", note: "Recognised worldwide, also online." },
  { label: "DeutschAkademie — free online grammar trainer", href: "https://www.deutschakademie.de/online-deutschkurs/", note: "20,000+ free grammar exercises, no signup." },
  { label: "Deutsche Welle — Deutsch lernen (free, 16 languages)", href: "https://learngerman.dw.com/", note: "Full A1–B1 audio/video course, government-funded." },
  { label: "VHS-Lernportal — free A1–B2 online course", href: "https://www.vhs-lernportal.de/deutsch", note: "Free, mobile-friendly, moderated by real tutors." },
  { label: "Berufssprachkurs (job-related German, §45a AufenthG)", href: "https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/DeutschBeruf/deutschberuf-node.html", note: "Follow-on B2/C1/C2 courses tied to your profession." },
];

export default function IntegrationCourses() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Masthead */}
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>Newcomer's Guide · No. 04</span>
          <span>Integration &amp; Language</span>
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          A plain-language guide
        </div>
        <h1 className="display-hero text-balance mt-3 font-semibold">
          Integration courses<br />
          <span className="text-muted-foreground">in Germany.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          The <em>Integrationskurs</em> is Germany's official welcome programme: 700 hours of language plus a 100-hour orientation on
          law, history and everyday life. Passing it gives you a B1 certificate, shortens the road to permanent residence, and cuts
          the naturalisation waiting time from 8 years to 6 (or fewer). Here's how it works — and what to do if you're not eligible.
        </p>
      </section>

      {/* Facts strip */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 border-y border-border/60 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Languages className="h-4 w-4" />, k: "600h language", v: "A1 → B1, six modules of 100 hours." },
            { icon: <GraduationCap className="h-4 w-4" />, k: "100h orientation", v: "Law, history, culture — 'Leben in Deutschland'." },
            { icon: <Wallet className="h-4 w-4" />, k: "€2.29 / hour", v: "Or free if you receive Bürgergeld / Wohngeld." },
            { icon: <ShieldCheck className="h-4 w-4" />, k: "Two exams", v: "DTZ (language) + Leben in Deutschland (orientation)." },
          ].map((f) => (
            <div key={f.k}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/80">
                {f.icon} {f.k}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{f.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Eligibility */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[180px_1fr]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">01 · Who can join</div>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              <strong className="text-foreground">Entitled (Anspruch):</strong> new residents with a permit under §§ 23, 28, 30, 32, 36
              AufenthG, EU citizens with an integration need, late repatriates, and recognised refugees.
            </p>
            <p>
              <strong className="text-foreground">Obligated (Verpflichtung):</strong> anyone whose German is below B1 and who receives
              Bürgergeld, or whose Ausländerbehörde decides integration is required — non-attendance can affect your permit.
            </p>
            <p>
              <strong className="text-foreground">On request:</strong> EU citizens, Germans without adequate German, students and
              workers can apply for a spot if courses are available in their region.
            </p>
          </div>
        </div>
      </section>

      {/* Structure */}
      <section className="mx-auto max-w-4xl border-t border-border/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[180px_1fr]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">02 · What's inside</div>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              A general Integrationskurs is <strong className="text-foreground">700 hours</strong>: six language modules (A1.1 → B1.2)
              plus the orientation course. Specialised versions exist for parents, women, young adults, people who never learned to read
              (Alphabetisierungskurs), and slower-paced learners (Förderkurs, up to 900 hours).
            </p>
            <p>
              You end with two federal exams — the <em>Deutsch-Test für Zuwanderer</em> (DTZ, A2/B1) and <em>Leben in Deutschland</em>
              (33 multiple-choice questions). Pass both and you receive the <em>Zertifikat Integrationskurs</em>, which counts toward
              your permanent-residence (Niederlassungserlaubnis) and naturalisation applications.
            </p>
          </div>
        </div>
      </section>

      {/* Cost */}
      <section className="mx-auto max-w-4xl border-t border-border/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[180px_1fr]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">03 · What it costs</div>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              <strong className="text-foreground">€2.29 per hour</strong> (2026 rate) — about €1,600 for the full course. You pay half up
              front per module; the other half is refunded by BAMF when you complete the course and pass the DTZ within two years.
            </p>
            <p>
              <strong className="text-foreground">Free</strong> if you receive Bürgergeld, Wohngeld, Asylbewerberleistungen, or your
              income is below the exemption threshold — apply for <em>Kostenbefreiung</em> together with your admission form.
            </p>
            <p>
              <strong className="text-foreground">Travel costs</strong> can be reimbursed if your course is more than 3 km away.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl border-t border-border/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">04 · Step by step</div>
        <div className="mt-8 space-y-8">
          {[
            {
              n: "1",
              t: "Get your admission letter",
              d: "Ask your Ausländerbehörde or Jobcenter for a Berechtigungs- or Verpflichtungsschein, or file BAMF form 630.005 yourself. EU citizens apply directly to BAMF.",
            },
            {
              n: "2",
              t: "Choose a school",
              d: "Use the BAMF NAvI course finder to pick a licensed provider (VHS, Inlingua, Berlitz, DeutschAkademie and hundreds more). Ask for a placement test — you may skip modules.",
            },
            {
              n: "3",
              t: "Attend the modules",
              d: "Full-time (~4 months) or part-time (~1 year). If you move city, transfer your admission letter to a new school — you don't restart.",
            },
            {
              n: "4",
              t: "Sit the two exams",
              d: "DTZ costs about €120 (waived if you're exempt). Leben in Deutschland is €25. Both are usually taken at your school.",
            },
            {
              n: "5",
              t: "Claim the refund and your certificate",
              d: "Send the completion certificate to BAMF within two years to reclaim half the fees. Keep the certificate — you'll need it for residence, naturalisation and many jobs.",
            },
          ].map((s) => (
            <div key={s.n} className="grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-[60px_1fr]">
              <div className="font-display text-3xl font-semibold text-foreground/60">{s.n}</div>
              <div>
                <h3 className="display-md font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official links */}
      <section className="mx-auto max-w-4xl border-t border-border/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          <MapPin className="h-4 w-4" /> 05 · Official links
        </div>
        <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
          {OFFICIAL.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between gap-4 p-5 transition hover:bg-accent/30"
            >
              <div>
                <div className="font-medium">{l.label}</div>
                {l.note && <div className="mt-1 text-sm text-muted-foreground">{l.note}</div>}
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      </section>

      {/* Alternatives */}
      <section className="mx-auto max-w-4xl border-t border-border/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          <Users className="h-4 w-4" /> 06 · If you're not eligible — free & cheap alternatives
        </div>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Not everyone qualifies for a state-funded Integrationskurs (e.g. tourists, some short-term workers, second-time applicants).
          These trusted resources take you from zero to B2 at low or no cost.
        </p>
        <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
          {ALTERNATIVES.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between gap-4 p-5 transition hover:bg-accent/30"
            >
              <div>
                <div className="font-medium">{l.label}</div>
                {l.note && <div className="mt-1 text-sm text-muted-foreground">{l.note}</div>}
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
          <div className="font-display text-2xl font-semibold">Not sure where to start?</div>
          <p className="mt-2 text-muted-foreground">
            Every BeistandPlus member — including the free Basic tier — gets our first-30-days roadmap and a checklist to apply for the
            Integrationskurs in your Bundesland. Plus and Complete members get a case manager who submits the paperwork and books your
            placement test for you.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/pricing" className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground">
              See plans
            </a>
            <a href="/app" className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2 font-medium">
              Open dashboard
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
