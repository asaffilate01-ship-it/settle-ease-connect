import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Icon3D } from "@/components/icon3d";
import heroFamily from "@/assets/brand/hero-family.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Heart,
  Home,
  FileText,
  Sparkles,
  Users,
  ShieldCheck,
  Building2,
  MapPin,
  Languages,
  ClipboardCheck,
  Handshake,
  Phone,
  Church,
  Landmark,
  Plane,
  GraduationCap,
  Briefcase,
  HeartPulse,
  Car,
  Baby,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Beistand+ · Settlement, welfare & bereavement in Germany — 11 languages" },
      {
        name: "description",
        content:
          "Beistand+ helps families settle, claim benefits, manage documents and coordinate end-of-life care in Germany. One calm platform in 11 languages, with human case managers and vetted experts.",
      },
      { property: "og:title", content: "Beistand+ · For every path in Germany" },
      {
        property: "og:description",
        content:
          "Settlement, benefits, documents, community and end-of-life care — one calm platform for families in Germany and the organisations that stand with them.",
      },
      { property: "og:url", content: "https://beistandplus.de/" },
      { property: "og:image", content: "https://beistandplus.de/favicon.png" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Beistand+",
          alternateName: "Beistand",
          url: "https://beistandplus.de/",
          logo: "https://beistandplus.de/favicon.png",
          description:
            "Germany's digital welfare and integration platform: settlement, benefits, documents, community and end-of-life care in 11 languages.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Berlin",
            addressCountry: "DE",
          },
          areaServed: "DE",
          availableLanguage: [
            "German", "English", "Turkish", "Urdu", "Hindi", "Punjabi",
            "Pashto", "Arabic", "Kurdish", "Russian", "Ukrainian",
          ],
        }),
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <UrgencyTriage />
      <TrustBar />
      <Journeys />
      <LifeInGermany />
      <Pillars />
      <BereavementBand />
      <RolesGrid />
      <BenefitsShowcase />
      <NetworkMap />
      <AiAssistant />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-28">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Now onboarding partners in Berlin & NRW
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Für jeden Weg in{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Deutschland</span>
              <span className="absolute inset-x-0 bottom-2 -z-0 h-3 rounded-sm bg-accent/50" />
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Whether you're planning your move to Germany — for work, study or
            family — or already here and building a life, Beistand is the calm
            platform for visas, Anmeldung, housing, benefits, health, driving,
            births, marriages, deaths and everything in between.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/app">
                Open your dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/bereavement">Report a bereavement</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Languages className="h-4 w-4" /> DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · FA · PL · ZH
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> GDPR-first & bank-grade encryption
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" /> 24/7 human case manager
            </span>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl shadow-elevated ring-1 ring-primary/10">
            <img
              src={heroFamily}
              alt="A multicultural family in Berlin, supported by BeistandPlus"
              width={1600}
              height={1100}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                An Ihrer Seite — von Anfang an
              </div>
              <p className="mt-2 max-w-sm font-display text-lg leading-snug">
                "From the airport to the Bürgeramt to the hospital — one team,
                one plan, in our language."
              </p>
            </div>
          </div>
          <div className="mt-6 lg:absolute lg:-bottom-16 lg:-left-10 lg:mt-0 lg:w-[92%]">
            <HeroCard />
          </div>
        </div>
      </div>
      <div className="h-0 lg:h-24" />
    </section>
  );
}


function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-warm opacity-30 blur-3xl" />
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium">Your Beistand plan</div>
          </div>
          <Badge variant="secondary" className="bg-success/15 text-success">Active</Badge>
        </div>
        <div className="mt-6 space-y-3">
          <TaskRow done text="Anmeldung booked — Bürgeramt Mitte, 14 Nov" />
          <TaskRow done text="Blocked account opened (Fintiba)" />
          <TaskRow text="Residence permit appointment — 22 Nov, 09:30" urgent />
          <TaskRow text="Kindergeld application — draft ready to sign" />
          <TaskRow text="Find English-speaking Hausarzt in Neukölln" />
        </div>
        <div className="mt-6 rounded-xl border border-border/60 bg-parchment/50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <div className="font-medium">Fatima · Your case manager</div>
              <p className="mt-1 text-muted-foreground">
                Your Kindergeld draft is ready. I've prefilled everything from
                your Anmeldebestätigung — please review and e-sign.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ text, done, urgent }: { text: string; done?: boolean; urgent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/60 p-3">
      <span
        className={`grid h-5 w-5 place-items-center rounded-full border ${
          done ? "border-success bg-success text-success-foreground" : "border-border"
        }`}
      >
        {done && <span className="text-[10px]">✓</span>}
      </span>
      <span className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
        {text}
      </span>
      {urgent && (
        <Badge variant="outline" className="ml-auto border-warning/50 bg-warning/15 text-warning-foreground">
          Soon
        </Badge>
      )}
    </div>
  );
}

function TrustBar() {
  const items = [
    "20M+ people in Germany with a migration background",
    "Berlin · NRW · Hamburg · Frankfurt · München",
    "Mosques · Churches · Temples · Gurdwaras",
    "Funeral directors · Hospitals · Consulates",
  ];
  return (
    <div className="border-y border-border/60 bg-parchment/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-xs uppercase tracking-[0.14em] text-muted-foreground sm:px-6 lg:px-8">
        {items.map((i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
    </div>
  );
}

function UrgencyTriage() {
  const paths = [
    {
      tone: "urgent" as const,
      tag: "I need help now",
      icon: "urgent" as const,
      title: "Something happened — a death, a deadline, a letter I can't read.",
      copy: "Talk to a human case manager within one hour. We triage, translate and act — bereavement, eviction notices, visa expiries, hospital paperwork, Jobcenter appointments.",
      bullets: [
        "24/7 bereavement & emergency line",
        "Sworn translators on standby",
        "We call authorities on your behalf",
      ],
      cta: { label: "Start an urgent case", to: "/app/cases/new" as const },
      secondary: { label: "Report a bereavement", to: "/bereavement" as const },
    },
    {
      tone: "plan" as const,
      tag: "I'm planning ahead",
      icon: "plan" as const,
      title: "Set up my life in Germany — properly, calmly, one step at a time.",
      copy: "Store documents in the family vault, apply for visas, benefits and housing, keep pensions and insurance in one place, and hand over cleanly to loved ones when the time comes.",
      bullets: [
        "Family vault with deputy access",
        "Guided intake for every service",
        "One transparent monthly bill",
      ],
      cta: { label: "Open your dashboard", to: "/app" as const },
      secondary: { label: "See pricing", to: "/pricing" as const },
    },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Where should we start?
        </div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Two doors. One <span className="text-destructive">calm</span> team behind both.
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Tell us whether today is an emergency or a plan. We'll match you to the right case manager, in your language, in minutes.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {paths.map((p) => {
          const isUrgent = p.tone === "urgent";
          return (
            <div
              key={p.tag}
              className={`group relative overflow-hidden rounded-3xl border p-8 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated ${
                isUrgent
                  ? "border-destructive/25 bg-destructive/5"
                  : "border-primary/15 bg-card"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  isUrgent ? "bg-destructive" : "bg-gradient-warm"
                }`}
              />
              <div className="flex items-center gap-4">
                <div
                  className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl p-1.5 ${
                    isUrgent
                      ? "bg-destructive/10"
                      : "bg-accent/10"
                  }`}
                >
                  <Icon3D name={p.icon} alt="" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {p.tag}
                </div>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold leading-snug">
                {p.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p.copy}
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        isUrgent ? "bg-destructive" : "bg-accent"
                      }`}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className={
                    isUrgent
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }
                >
                  <Link to={p.cta.to}>
                    {p.cta.label}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to={p.secondary.to}>{p.secondary.label}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Journeys() {
  const journeys = [
    {
      icon: Plane,
      tag: "Before you arrive",
      title: "Planning your move to Germany",
      copy: "Student visas, job-seeker visas, EU Blue Card, Chancenkarte, family reunification, Ausbildung, freelance — we prepare the paperwork, book your embassy slot and line up housing, insurance and a bank account for day one.",
      cta: { label: "Start pre-arrival plan", to: "/services" as const },
    },
    {
      icon: MapPin,
      tag: "Already in Germany",
      title: "Staying, working, thriving",
      copy: "Extend or change your visa, apply for Niederlassungserlaubnis or naturalisation, claim benefits, rent or buy a home, register a business, sort your Steuererklärung — one case manager for every stage.",
      cta: { label: "Open your dashboard", to: "/app" as const },
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Two journeys, one companion
        </div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Wherever you are on the road to Germany.
        </h2>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {journeys.map((j) => (
          <div key={j.title} className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <j.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {j.tag}
              </div>
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold">{j.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{j.copy}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link to={j.cta.to}>
                {j.cta.label}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LifeInGermany() {
  const areas = [
    { icon: Briefcase, title: "Work & careers", copy: "Visa sponsorship, Anerkennung of foreign qualifications, contracts, Steuerklasse, joining a union." },
    { icon: GraduationCap, title: "Study & universities", copy: "Uni-Assist, TestAS/TestDaF, semester enrolment, BAföG, scholarships, Werkstudent rules." },
    { icon: Home, title: "Renting & buying", copy: "Schufa, Mietvertrag review, Wohnberechtigungsschein, mortgages, Grunderwerbsteuer, Notar." },
    { icon: FileText, title: "Benefits & welfare", copy: "Bürgergeld, Kindergeld, Wohngeld, Elterngeld, Rente, disability & carer support." },
    { icon: HeartPulse, title: "Health & insurance", copy: "GKV vs PKV, Hausarzt in your language, pregnancy care, mental health, chronic conditions." },
    { icon: Car, title: "Driving & mobility", copy: "Führerschein conversion, Kfz registration, insurance, ÖPNV, Deutschlandticket, points system." },
    { icon: Baby, title: "Births & family", copy: "Geburtsurkunde, Vaterschaftsanerkennung, Elterngeld, Kita-Platz, paediatric care." },
    { icon: Heart, title: "Marriage & partnership", copy: "Standesamt, foreign document legalisation, Ehefähigkeitszeugnis, religious ceremonies." },
    { icon: Church, title: "Deaths & end-of-life", copy: "Sterbeurkunde, burial, cremation, Islamic Janazah, repatriation, insurance & inheritance." },
  ];
  return (
    <section className="bg-parchment/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            Every chapter of life in Germany
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            From arrival to inheritance — we've got you.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One account, one case manager, one AI assistant that speaks your
            language across every German authority, form and Fristen.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <div key={a.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent-foreground">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="font-display text-lg font-semibold">{a.title}</div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild size="lg" className="bg-gradient-primary shadow-soft">
            <Link to="/services">
              See all services
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}



function Pillars() {
  const pillars = [
    {
      icon: Home,
      title: "Settle",
      german: "Ankommen",
      desc: "Anmeldung, tax ID, bank account, health insurance, residence permit — checklists that actually get you through the first 30 days.",
    },
    {
      icon: FileText,
      title: "Claim",
      german: "Beantragen",
      desc: "Bürgergeld, Kindergeld, Wohngeld, Elterngeld, BAföG. An eligibility checker that speaks your language and knows the small print.",
    },
    {
      icon: Users,
      title: "Belong",
      german: "Gemeinschaft",
      desc: "Find your mosque, church, temple or gurdwara. Halal food, prayer times, women's groups, youth clubs, community events.",
    },
    {
      icon: Heart,
      title: "Stand with",
      german: "Beistehen",
      desc: "End-of-life care from the first call to the final ceremony — burial in Germany or repatriation home, coordinated in one case file.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Was Beistand macht
        </div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Four pillars, one platform.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Most tools solve one step. Beistand carries you across all of them,
          with a human case manager and an AI assistant that never sleeps.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <p.icon className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {p.german}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold">{p.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BereavementBand() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 opacity-20 bg-gradient-warm" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-6">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            End-of-Life Care
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            When the worst happens, one call is enough.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/80">
            Beistand coordinates every party — family, funeral director,
            hospital, Standesamt, mosque or church, cemetery, airline,
            consulate, insurance — inside a single, timestamped case file. In
            German, English, Turkish, Urdu, Hindi, Punjabi, Pashto, Arabic,
            Kurdish, Russian or Ukrainian.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/bereavement">See the full workflow</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/app/cases/new">Report a death now</Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <Workflow />
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const stages = [
    { t: "Reported", d: "Family calls or files in the app — 60 seconds." },
    { t: "Case Manager assigned", d: "Human contact within 15 minutes, 24/7." },
    { t: "Authority signed", d: "Digital GDPR & mandate signatures." },
    { t: "Body collection", d: "Verified funeral director dispatched." },
    { t: "Standesamt", d: "Death registered, certificates issued." },
    { t: "Ceremony or repatriation", d: "Mosque, church, temple, or airline cargo." },
    { t: "Insurance & admin", d: "Claims, pension, employer, utilities closed." },
  ];
  return (
    <div className="rounded-3xl border border-primary-foreground/20 bg-primary-foreground/5 p-6 backdrop-blur">
      <div className="text-xs uppercase tracking-widest text-accent">Case BST-2410-0042</div>
      <div className="mt-1 font-display text-2xl">Repatriation · Berlin → Lahore</div>
      <ol className="mt-6 space-y-3">
        {stages.map((s, i) => (
          <li key={s.t} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                  i < 4
                    ? "bg-accent text-accent-foreground"
                    : "border border-primary-foreground/30 text-primary-foreground/70"
                }`}
              >
                {i + 1}
              </div>
              {i < stages.length - 1 && (
                <div className="my-1 h-6 w-px bg-primary-foreground/20" />
              )}
            </div>
            <div className="pb-2">
              <div className="text-sm font-medium">{s.t}</div>
              <div className="text-xs text-primary-foreground/70">{s.d}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RolesGrid() {
  const roles = [
    { icon: Users, title: "Families & members", copy: "Report cases, track benefits, store documents, ask anything." },
    { icon: Handshake, title: "Case managers", copy: "One workspace for every case, every stage, every stakeholder." },
    { icon: Building2, title: "Funeral directors", copy: "Referrals, quotes, invoices, documents — all in one portal." },
    { icon: Church, title: "Mosques & churches", copy: "Janazah, funeral, ceremony bookings and imam/priest scheduling." },
    { icon: Landmark, title: "Temples & Gurdwaras", copy: "Ceremony bookings and religious representative scheduling." },
    { icon: ShieldCheck, title: "Hospitals & authorities", copy: "Secure handoff of certification and mortuary handover." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Roles</div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Every stakeholder, their own portal.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Secure logins, role-scoped permissions, and a shared case file. No
          more WhatsApp threads and lost paperwork.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <div key={r.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent-foreground">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="font-display text-lg font-semibold">{r.title}</div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BenefitsShowcase() {
  const items = [
    { name: "Kindergeld", desc: "€250 per child, monthly", tag: "Family" },
    { name: "Bürgergeld", desc: "€563 + rent + heating", tag: "Income" },
    { name: "Wohngeld", desc: "Rent subsidy up to €800", tag: "Housing" },
    { name: "Elterngeld", desc: "Up to €1,800 in first year", tag: "Parents" },
    { name: "BAföG", desc: "Study financing up to €992", tag: "Students" },
    { name: "Blue Card", desc: "Fast-track skilled workers", tag: "Immigration" },
  ];
  return (
    <section className="bg-parchment/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Benefits Checker</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Know exactly what you're entitled to.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Bürgergeld, Kindergeld, Wohngeld, Elterngeld, BAföG, Rente. Answer
            a few questions — Beistand tells you what to apply for, how much
            you could receive, and prepares the paperwork.
          </p>
          <Button asChild className="mt-8 bg-gradient-primary shadow-soft" size="lg">
            <Link to="/app/benefits">Run the benefits checker</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
          {items.map((b) => (
            <div key={b.name} className="rounded-xl border border-border/60 bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className="font-display text-xl font-semibold">{b.name}</div>
                <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent-foreground">{b.tag}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NetworkMap() {
  const cities = [
    { name: "Berlin", role: "Launch city", partners: 42 },
    { name: "Köln", role: "NRW hub", partners: 28 },
    { name: "Düsseldorf", role: "NRW", partners: 18 },
    { name: "Dortmund", role: "NRW", partners: 14 },
    { name: "Frankfurt", role: "Aviation hub", partners: 22 },
    { name: "Hamburg", role: "Coming Q2", partners: 9 },
    { name: "München", role: "Coming Q2", partners: 11 },
    { name: "Stuttgart", role: "Planned", partners: 4 },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Provider Network</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A verified partner in every city.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Funeral directors, mosques, churches, temples, gurdwaras,
            hospitals, cemeteries, airlines, consulates, translators and
            lawyers — vetted, rated, and connected in one workflow.
          </p>
          <Button asChild variant="outline" className="mt-8" size="lg">
            <Link to="/for-providers">Join the network</Link>
          </Button>
        </div>
        <div className="lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {cities.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-semibold">{c.partners}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">partners</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AiAssistant() {
  const asks = [
    "Can I get Bürgergeld?",
    "How do I register my address?",
    "Where's the nearest mosque?",
    "Can I bring my wife on a family reunion visa?",
    "Find me a plumber who speaks Urdu.",
    "What's the process if my father dies at home?",
  ];
  return (
    <section className="bg-parchment/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">AI Assistant</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Ask anything, in any language.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Trained on German bureaucracy, immigration, welfare, healthcare,
            and religious end-of-life practice. Answers in plain language, in
            the language you're most comfortable with.
          </p>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elevated">
            <div className="grid gap-3 sm:grid-cols-2">
              {asks.map((a) => (
                <button
                  key={a}
                  className="rounded-xl border border-border/60 bg-background/60 p-4 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="text-muted-foreground">›</span> {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 text-primary-foreground shadow-elevated lg:p-20">
        <div className="absolute inset-0 opacity-30 bg-gradient-warm" />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Standing with you, from your first day to your last.
          </h2>
          <p className="mt-5 text-lg text-primary-foreground/80">
            Join the Beistand community. Members get 24/7 case management, an
            AI assistant, digital document vault, benefits checker and full
            end-of-life coordination — from €5/month.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/app">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
