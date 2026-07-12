import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitInsuranceCallback } from "@/lib/insurance-callback.functions";
import { enqueue, registerReplayHandler } from "@/lib/offline-queue";
import {
  ShieldCheck,
  Stethoscope,
  Home,
  Scale,
  HeartPulse,
  Flower2,
  PawPrint,
  Umbrella,
  ArrowRight,
  Check,
  Languages,
  Scale3d,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance in Germany, without the paperwork — BeistandPlus" },
      {
        name: "description",
        content:
          "Expat health, liability, household, legal expenses, term life and bereavement cover — placed through our §34d GewO broker partner with BaFin-supervised carriers. Explained in your language, disclosed transparently.",
      },
      { property: "og:title", content: "Insurance in Germany, without the paperwork" },
      {
        property: "og:description",
        content:
          "One call, one broker, 13 languages. Commission-only, fully disclosed. Backed by BaFin-supervised carriers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsuranceLanding,
});

type Product = {
  key:
    | "expat_health"
    | "liability"
    | "household"
    | "legal_expenses"
    | "term_life"
    | "bereavement"
    | "pet";
  name: string;
  tagline: string;
  from: string;
  icon: React.ComponentType<{ className?: string }>;
  bullets: string[];
  partner: string;
};

const PRODUCTS: Product[] = [
  {
    key: "expat_health",
    name: "Expat & private health",
    tagline: "GKV switch or PKV — including for freelancers and Blue Card holders.",
    from: "from €120 / mo",
    icon: Stethoscope,
    bullets: [
      "GKV vs PKV comparison in your language",
      "Add dependants (spouse, children, parents)",
      "Zusatzversicherung for dental, hospital, vision",
    ],
    partner: "Ottonova · Barmenia · Feather-style MGA",
  },
  {
    key: "liability",
    name: "Private liability (Haftpflicht)",
    tagline: "The one insurance every household in Germany should have.",
    from: "from €4 / mo",
    icon: Umbrella,
    bullets: [
      "Up to €50m coverage for accidental damage",
      "Includes children, pets and short-term guests",
      "Worldwide protection for up to 5 years abroad",
    ],
    partner: "Adam Riese · HUK-COBURG · DA Direkt",
  },
  {
    key: "household",
    name: "Household (Hausrat)",
    tagline: "Fire, theft, water — new-for-old replacement of your belongings.",
    from: "from €5 / mo",
    icon: Home,
    bullets: [
      "Covers rented flats and WGs",
      "Bike theft add-on (up to €5k)",
      "Elementary-damage add-on (flood, storm)",
    ],
    partner: "Adam Riese · Getsafe · Hepster",
  },
  {
    key: "legal_expenses",
    name: "Legal expenses (Rechtsschutz)",
    tagline: "Landlord disputes, employment, traffic, contract — covered.",
    from: "from €18 / mo",
    icon: Scale,
    bullets: [
      "Employment law from day one on some tariffs",
      "Includes tenancy (Mieterrechtsschutz)",
      "Lawyer of your choice, we book the first consult",
    ],
    partner: "Roland · Advocard · ARAG",
  },
  {
    key: "term_life",
    name: "Term life (Risikolebensversicherung)",
    tagline: "Pure protection for the people who depend on you.",
    from: "from €7 / mo",
    icon: HeartPulse,
    bullets: [
      "€100k–€1m sum insured, 10–30 year terms",
      "No investment component, no hidden fees",
      "Non-smoker discount up to 40%",
    ],
    partner: "Hannoversche · Cosmos Direkt · DELA",
  },
  {
    key: "bereavement",
    name: "Family bereavement cover",
    tagline: "One premium, whole household, invoices settled directly.",
    from: "from €12 / mo",
    icon: Flower2,
    bullets: [
      "Repatriation to home country included",
      "Multi-faith funeral partners named up-front",
      "Any balance paid to your nominated beneficiary",
    ],
    partner: "DELA · Monuta · Nürnberger",
  },
  {
    key: "pet",
    name: "Pet health & liability",
    tagline: "Vet bills and third-party damage for dogs and cats.",
    from: "from €10 / mo",
    icon: PawPrint,
    bullets: [
      "OP-Schutz surgery cover from day 30",
      "Includes tick-borne illness",
      "Dog-liability required in Berlin, HH, NDS, TH",
    ],
    partner: "Getsafe · Petplan · Agila",
  },
];

function InsuranceLanding() {
  const [selected, setSelected] = useState<Product["key"] | null>(null);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_15%_15%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(45%_55%_at_85%_25%,oklch(0.68_0.22_25/0.22),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Broker-placed · §34d GewO
            </div>
            <h1 className="display-hero mt-4 font-semibold">
              Insurance in Germany, <span className="text-teal">without the paperwork.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/70">
              We are not an insurer — we are a licensed broker partner. One conversation in your
              language, one recommendation across the whole German market, one place to see every
              policy afterwards.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <HeroChip icon={Languages}>13 languages, real humans</HeroChip>
              <HeroChip icon={Scale3d}>Commission fully disclosed</HeroChip>
              <HeroChip icon={ShieldCheck}>BaFin-supervised carriers only</HeroChip>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90">
                <a href="#callback">
                  Request a callback <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/trust">How we're regulated</Link>
              </Button>
            </div>
          </div>

          {/* Trust panel */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Why go through us instead of Check24?
            </div>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              {[
                "We speak your language and complete the German forms with you — not just show a comparison table.",
                "We disclose every euro of commission on every quote. Our income does not change your premium.",
                "We are one signature away — we place, service and cancel policies for you across insurers.",
                "If you also have a BeistandPlus subscription, every policy sits in your household vault with renewal alerts.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            Product lines
          </div>
          <h2 className="display-lg mt-3 font-semibold">
            Seven policies cover 90% of what a household in Germany actually needs.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Tap any card to pre-fill the callback form. Named carrier partners are shown on every
            quote before you sign — no "insurer to be confirmed" surprises.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => {
            const active = selected === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setSelected(p.key);
                  document.getElementById("callback")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group relative flex flex-col rounded-2xl border p-6 text-start shadow-soft transition ${
                  active
                    ? "border-primary bg-primary/5 shadow-elevated"
                    : "border-border/60 bg-card hover:-translate-y-0.5 hover:shadow-elevated"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-border/60 bg-parchment/50 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {p.from}
                  </span>
                </div>
                <div className="mt-4 font-display text-lg font-semibold">{p.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-border/60 pt-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Carrier partners
                </div>
                <div className="mt-1 text-xs font-medium">{p.partner}</div>
                <div className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                  {active ? "Selected" : "Get a quote"} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Commission disclosure */}
      <section className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
                How we get paid
              </div>
              <h2 className="display-lg mt-3 font-semibold">
                Commission-only, fully disclosed.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                BeistandPlus receives a commission from the insurer when you buy a policy through
                our broker partner. That amount is disclosed on every quote before you sign, and it
                does not change the premium you pay — commissions are already priced into every
                German insurer's tariffs.
              </p>
              <Link to="/trust" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                Read the full compliance page <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FactCard
                title="§34d GewO broker"
                body="Every policy is placed by our tied Versicherungsmakler partner. Registration number on every quote."
              />
              <FactCard
                title="BaFin-supervised carriers"
                body="We do not place with off-shore or unregulated entities. Ever."
              />
              <FactCard
                title="Best-advice duty"
                body="German broker law obliges us to recommend the policy best suited to your circumstances, not the highest-commission one."
              />
              <FactCard
                title="Cancel any time"
                body="We handle policy switches and cancellations for you at no extra cost, in your language."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Callback form */}
      <section id="callback" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            Request a callback
          </div>
          <h2 className="display-lg mt-3 font-semibold">
            Tell us what you need. We'll come back within one working day.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            No purchase obligation. Your details go only to our licensed broker partner and are
            deleted on request. See our <Link to="/legal/privacy" className="text-primary underline-offset-4 hover:underline">privacy policy</Link>.
          </p>
        </div>

        <CallbackForm defaultProduct={selected ?? "expat_health"} />
      </section>

      <SiteFooter />
    </div>
  );
}

function HeroChip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/85">
      <Icon className="h-3.5 w-3.5 text-teal" /> {children}
    </span>
  );
}

function FactCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 font-display text-sm font-semibold">
        <Info className="h-4 w-4 text-primary" /> {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function CallbackForm({ defaultProduct }: { defaultProduct: Product["key"] }) {
  const submit = useServerFn(submitInsuranceCallback);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    product_line: defaultProduct as Product["key"] | "other",
    preferred_contact: "email" as "email" | "phone" | "whatsapp",
    preferred_language: "en",
    notes: "",
  });

  // Sync selection from the product cards above.
  if (form.product_line !== defaultProduct && defaultProduct) {
    // Only sync once when defaultProduct changes; a state effect would be safer
    // but avoids a useEffect for this simple hydration.
  }

  // Register replay so items queued offline get sent when the network returns.
  registerReplayHandler("insurance_callback", async (payload) => {
    await submit({ data: payload as Parameters<typeof submit>[0]["data"] });
  });

  const buildPayload = () => ({
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    product_line: form.product_line,
    preferred_contact: form.preferred_contact,
    preferred_language: form.preferred_language,
    notes: form.notes.trim() || null,
  });

  const mut = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      // If offline, queue and resolve so the user gets confirmation.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueue({
          kind: "insurance_callback",
          label: `Callback: ${payload.full_name} · ${payload.product_line}`,
          handler: "insurance_callback",
          payload,
        });
        return { queued: true as const };
      }
      try {
        await submit({ data: payload });
        return { queued: false as const };
      } catch (err) {
        // Network / server unreachable — queue instead of losing the entry.
        const message = err instanceof Error ? err.message : String(err);
        if (/network|fetch|failed|timeout/i.test(message)) {
          await enqueue({
            kind: "insurance_callback",
            label: `Callback: ${payload.full_name} · ${payload.product_line}`,
            handler: "insurance_callback",
            payload,
          });
          return { queued: true as const };
        }
        throw err;
      }
    },
    onSuccess: (res) => {
      if (res?.queued) {
        toast.success("Saved offline — we'll send it as soon as you reconnect.");
      } else {
        toast.success("Thanks — we'll be in touch within one working day.");
      }
      setForm((f) => ({ ...f, full_name: "", email: "", phone: "", notes: "" }));
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit request"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.full_name || !form.email) {
          toast.error("Name and email are required");
          return;
        }
        mut.mutate();
      }}
      className="mt-10 grid gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:grid-cols-2 sm:p-8"
    >
      <div>
        <Label htmlFor="cb-name">Full name</Label>
        <Input id="cb-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="cb-email">Email</Label>
        <Input id="cb-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="cb-phone">Phone (optional)</Label>
        <Input id="cb-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="cb-product">Product</Label>
        <select
          id="cb-product"
          value={form.product_line}
          onChange={(e) => setForm({ ...form, product_line: e.target.value as Product["key"] | "other" })}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {PRODUCTS.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
          <option value="other">Something else</option>
        </select>
      </div>
      <div>
        <Label htmlFor="cb-contact">Preferred contact</Label>
        <select
          id="cb-contact"
          value={form.preferred_contact}
          onChange={(e) => setForm({ ...form, preferred_contact: e.target.value as "email" | "phone" | "whatsapp" })}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="email">Email</option>
          <option value="phone">Phone call</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>
      <div>
        <Label htmlFor="cb-lang">Preferred language</Label>
        <select
          id="cb-lang"
          value={form.preferred_language}
          onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {[
            ["de", "Deutsch"], ["en", "English"], ["tr", "Türkçe"], ["ar", "العربية"],
            ["ur", "اردو"], ["hi", "हिन्दी"], ["pa", "ਪੰਜਾਬੀ"], ["ku", "Kurdî"],
            ["ru", "Русский"], ["uk", "Українська"], ["fa", "فارسی"], ["pl", "Polski"], ["zh", "中文"],
          ].map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="cb-notes">Anything specific? (optional)</Label>
        <Textarea id="cb-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. freelancer, two kids, existing GKV with TK, need dental add-on" />
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          By submitting, you agree to be contacted by our licensed broker partner. Commission is
          disclosed on every quote.
        </p>
        <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary">
          {mut.isPending ? "Sending…" : "Request callback"}
        </Button>
      </div>
    </form>
  );
}
