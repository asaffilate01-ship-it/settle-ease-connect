import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BadgePercent,
  ShieldCheck,
  Languages,
  FileText,
  Wallet,
  Home,
  Briefcase,
  HeartPulse,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "For international students — BeistandPlus" },
      {
        name: "description",
        content:
          "30% off any BeistandPlus plan for international students in Germany. Visa, Anmeldung, health insurance, blocked account, Werkstudent rules, tax ID — sorted in your language. Verify with your student ID.",
      },
      { property: "og:title", content: "For international students — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Landing in Germany to study? Get 30% off your BeistandPlus membership with a valid student ID.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StudentsPage,
});

const HELPS = [
  { icon: FileText, title: "Student visa & residence permit", copy: "Visa application, appointment, extension and change of purpose after graduation." },
  { icon: Home, title: "Anmeldung & housing", copy: "City registration, WG/apartment search, deposit letters, Studentenwerk applications." },
  { icon: HeartPulse, title: "Health insurance", copy: "TK / AOK / DAK enrolment, private option comparison, dependents on your policy." },
  { icon: Wallet, title: "Blocked account & finance", copy: "Sperrkonto (Fintiba, Expatrio, Coracle), tax ID, EWR bank setup, currency transfer discounts." },
  { icon: Briefcase, title: "Werkstudent & internships", copy: "20h/week rules, Minijob vs Werkstudent, contract review, Anerkennung of foreign degrees." },
  { icon: Languages, title: "Any-language support", copy: "DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · PS — chat, calls and translated German letters." },
];

const STEPS = [
  { n: 1, title: "Sign up", copy: "Create your BeistandPlus account — free to browse, chat with the assistant, and see what your case looks like." },
  { n: 2, title: "Verify your student ID", copy: "Upload a photo of a valid student ID or an enrolment certificate (Immatrikulationsbescheinigung)." },
  { n: 3, title: "We check it (24h)", copy: "Our team confirms your university and expiry date — no manual back-and-forth." },
  { n: 4, title: "30% off, forever a student", copy: "Discount applies to any plan while your student status is valid. Renew each semester." },
];

function StudentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-24">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs backdrop-blur">
              <GraduationCap className="h-3.5 w-3.5" /> For international students
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Study in Germany —{" "}
              <span className="relative inline-block">
                <span className="relative z-10">without the paperwork panic</span>
                <span className="absolute inset-x-0 bottom-2 -z-0 h-3 rounded-sm bg-accent/50" />
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Visa, Anmeldung, health insurance, Sperrkonto, Werkstudent rules, tax ID, WG search — all sorted in your language,
              with a real case manager if you need one.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent-foreground">
              <BadgePercent className="h-4 w-4" /> 30% off any plan with a valid student ID
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
                <Link to="/auth">Claim my student discount</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">See plans</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elevated">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <ShieldCheck className="h-4 w-4" /> Verified student pricing
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground line-through">€10</span>
                <span className="font-display text-5xl font-semibold text-foreground">€7</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <div className="text-xs text-muted-foreground">Plus plan · billed monthly · cancel any time</div>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Personal case manager for visa & Anmeldung",
                  "Sworn translation of degrees & birth certificates",
                  "GKV / PKV comparison & enrolment",
                  "Werkstudent & tax filing support",
                  "AI translator for every German letter",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-parchment/50 p-3 text-xs text-muted-foreground">
                Accepted proof: student ID card, enrolment certificate (Immatrikulationsbescheinigung), Studierendenausweis,
                or a scholarship confirmation letter valid within the last 6 months.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we help with */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">What we help with</div>
        <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">Everything a student needs, one calm place.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {HELPS.map((h) => (
            <div key={h.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <h.icon className="h-6 w-6 text-primary" />
              <div className="mt-4 font-display text-lg font-semibold">{h.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{h.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-parchment/50 p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            Claim the discount
          </div>
          <h2 className="mt-2 font-display text-3xl font-semibold">Four steps, about five minutes.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="font-display text-3xl font-semibold text-primary">{s.n}</div>
                <div className="mt-2 font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.copy}</div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-gradient-primary">
              <Link to="/app/student-discount">Start verification</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
