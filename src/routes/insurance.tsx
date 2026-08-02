import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  HeartPulse,
  Home,
  Info,
  Languages,
  PawPrint,
  Scale,
  ShieldCheck,
  Stethoscope,
  Umbrella,
} from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RegulatedNotice } from "@/components/regulated-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitInsuranceCallback } from "@/lib/insurance-callback.functions";
import { enqueue, registerReplayHandler } from "@/lib/offline-queue";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance referral support in Germany — BeistandPlus" },
      {
        name: "description",
        content:
          "Plain-language orientation and an optional insurance referral. The receiving provider confirms advice, eligibility, price and policy terms.",
      },
      { property: "og:title", content: "Insurance referral support in Germany" },
      {
        property: "og:description",
        content:
          "Understand common insurance categories and request an introduction without committing to a purchase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://beistandplus.de/insurance" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/insurance" }],
  }),
  component: InsuranceLanding,
});

type ProductKey =
  "expat_health" | "liability" | "household" | "legal_expenses" | "term_life" | "pet";

type Product = {
  key: ProductKey;
  name: string;
  summary: string;
  prompts: string[];
  icon: React.ComponentType<{ className?: string }>;
};

const PRODUCTS: Product[] = [
  {
    key: "expat_health",
    name: "Health insurance",
    summary: "Ask about public, private or supplementary health-insurance routes.",
    prompts: [
      "Employment and residence situation",
      "Household members",
      "Provider-confirmed eligibility",
    ],
    icon: Stethoscope,
  },
  {
    key: "liability",
    name: "Personal liability",
    summary: "Explore whether personal liability cover fits your household.",
    prompts: ["People to include", "Limits and exclusions", "Territorial scope"],
    icon: Umbrella,
  },
  {
    key: "household",
    name: "Household contents",
    summary: "Ask about protection for belongings in your home.",
    prompts: ["Home and household details", "Theft options", "Exclusions and excesses"],
    icon: Home,
  },
  {
    key: "legal_expenses",
    name: "Legal expenses",
    summary: "Explore available legal-expenses categories and waiting periods.",
    prompts: ["Legal areas needed", "Waiting periods", "Excess and lawyer choice"],
    icon: Scale,
  },
  {
    key: "term_life",
    name: "Term life",
    summary: "Discuss protection needs with a qualified receiving provider.",
    prompts: ["People who rely on you", "Benefit and term needs", "Provider underwriting"],
    icon: HeartPulse,
  },
  {
    key: "pet",
    name: "Pet health or liability",
    summary: "Ask about products for animal health costs or third-party liability.",
    prompts: ["Animal details", "Waiting periods", "Local requirements"],
    icon: PawPrint,
  },
];

function InsuranceLanding() {
  const [selected, setSelected] = useState<ProductKey>("expat_health");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_15%_15%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(45%_55%_at_85%_25%,oklch(0.68_0.22_25/0.22),transparent)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                <ShieldCheck className="h-3.5 w-3.5" /> Independent referral support
              </div>
              <h1 className="display-hero mt-4 text-balance font-semibold">
                Understand your options, then{" "}
                <span className="text-teal">choose what happens next.</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/70">
                BeistandPlus provides general orientation and, with your consent, can refer your
                enquiry. We do not advise on, arrange, underwrite or issue insurance contracts.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <HeroChip icon={Languages}>Multilingual intake</HeroChip>
                <HeroChip icon={Check}>Consent before sharing</HeroChip>
                <HeroChip icon={ShieldCheck}>Provider confirms all terms</HeroChip>
              </div>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90"
              >
                <a href="#referral">
                  Request a referral <ArrowRight className="ml-2 h-4 w-4 rtl-flip" />
                </a>
              </Button>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                What this service does
              </div>
              <ul className="mt-4 space-y-4 text-sm">
                {[
                  "Captures the category and contact preference you choose.",
                  "Explains what information a receiving provider may request.",
                  "Shares your enquiry only after you submit the form.",
                  "Leaves recommendations, pricing, eligibility and contracts to the receiving provider.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Referral categories
            </p>
            <h2 className="display-lg mt-3 text-balance font-semibold">
              Start with the topic you want to explore.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              These cards are orientation only. Selecting one pre-fills the form; it does not create
              a quote, recommendation or insurance cover.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => {
              const active = product.key === selected;
              return (
                <button
                  key={product.key}
                  type="button"
                  onClick={() => {
                    setSelected(product.key);
                    document.getElementById("referral")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group flex flex-col rounded-2xl border p-6 text-start shadow-soft transition ${
                    active
                      ? "border-primary bg-primary/5 shadow-elevated"
                      : "border-border/60 bg-card hover:-translate-y-0.5 hover:shadow-elevated"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <product.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-border/60 bg-parchment/50 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Referral enquiry
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.summary}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    {product.prompts.map((prompt) => (
                      <li key={prompt} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {active ? "Selected" : "Select"} <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-parchment/50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.35fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Clear boundaries
              </p>
              <h2 className="display-lg mt-3 text-balance font-semibold">
                A referral is not insurance advice.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                The receiving provider is responsible for its regulatory disclosures, advice,
                demands-and-needs assessment, quote, product documents and contract.
              </p>
              <Link
                to="/trust"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Read our service boundaries <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FactCard
                title="No placement"
                body="BeistandPlus does not bind cover or collect insurance premiums."
              />
              <FactCard
                title="Provider verification"
                body="Review the provider's identity and disclosures before buying."
              />
              <FactCard
                title="No automatic recommendation"
                body="A category selection is not personal product advice."
              />
              <FactCard
                title="No purchase obligation"
                body="Submitting an enquiry does not require you to sign or buy."
              />
            </div>
          </div>
        </section>

        <section
          id="referral"
          className="mx-auto max-w-4xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Request a referral
            </p>
            <h2 className="display-lg mt-3 text-balance font-semibold">
              Tell us how to contact you.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              We use your details to handle the referral you request. The receiving provider is
              identified before or when your data is shared. See our{" "}
              <Link to="/legal/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
          <ReferralForm selectedProduct={selected} />
        </section>

        <RegulatedNotice domain="insurance" />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/85">
      <Icon className="h-3.5 w-3.5 text-teal" /> {children}
    </span>
  );
}

function FactCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
        <Info className="h-4 w-4 text-primary" /> {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

type ReferralPayload = {
  full_name: string;
  email: string;
  phone: string | null;
  product_line: ProductKey | "other";
  preferred_contact: "email" | "phone" | "whatsapp";
  preferred_language: string;
  notes: string | null;
};

function ReferralForm({ selectedProduct }: { selectedProduct: ProductKey }) {
  const submit = useServerFn(submitInsuranceCallback);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    product_line: selectedProduct as ProductKey | "other",
    preferred_contact: "email" as "email" | "phone" | "whatsapp",
    preferred_language: "en",
    notes: "",
  });

  useEffect(() => {
    setForm((current) => ({ ...current, product_line: selectedProduct }));
  }, [selectedProduct]);

  useEffect(() => {
    registerReplayHandler("insurance_callback", async (payload) => {
      await submit({ data: payload as ReferralPayload });
    });
  }, [submit]);

  const buildPayload = (): ReferralPayload => ({
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    product_line: form.product_line,
    preferred_contact: form.preferred_contact,
    preferred_language: form.preferred_language,
    notes: form.notes.trim() || null,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueReferral(payload);
        return { queued: true as const };
      }
      try {
        await submit({ data: payload });
        return { queued: false as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/network|fetch|failed|timeout/i.test(message)) {
          await queueReferral(payload);
          return { queued: true as const };
        }
        throw error;
      }
    },
    onSuccess: ({ queued }) => {
      toast.success(
        queued ? "Saved offline — it will send when you reconnect." : "Referral request received.",
      );
      setForm((current) => ({ ...current, full_name: "", email: "", phone: "", notes: "" }));
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit request"),
  });

  async function queueReferral(payload: ReferralPayload) {
    await enqueue({
      kind: "insurance_callback",
      label: `Referral: ${payload.full_name} · ${payload.product_line}`,
      handler: "insurance_callback",
      payload,
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="mt-10 grid gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:grid-cols-2 sm:p-8"
    >
      <Field label="Full name" htmlFor="ref-name">
        <Input
          id="ref-name"
          value={form.full_name}
          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
          required
        />
      </Field>
      <Field label="Email" htmlFor="ref-email">
        <Input
          id="ref-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </Field>
      <Field label="Phone (optional)" htmlFor="ref-phone">
        <Input
          id="ref-phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </Field>
      <Field label="Category" htmlFor="ref-product">
        <select
          id="ref-product"
          value={form.product_line}
          onChange={(event) =>
            setForm({ ...form, product_line: event.target.value as ProductKey | "other" })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {PRODUCTS.map((product) => (
            <option key={product.key} value={product.key}>
              {product.name}
            </option>
          ))}
          <option value="other">Something else</option>
        </select>
      </Field>
      <Field label="Preferred contact" htmlFor="ref-contact">
        <select
          id="ref-contact"
          value={form.preferred_contact}
          onChange={(event) =>
            setForm({
              ...form,
              preferred_contact: event.target.value as typeof form.preferred_contact,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="email">Email</option>
          <option value="phone">Phone call</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </Field>
      <Field label="Preferred language" htmlFor="ref-language">
        <select
          id="ref-language"
          value={form.preferred_language}
          onChange={(event) => setForm({ ...form, preferred_language: event.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {[
            ["de", "Deutsch"],
            ["en", "English"],
            ["tr", "Türkçe"],
            ["ar", "العربية"],
            ["ur", "اردو"],
            ["hi", "हिन्दी"],
            ["pa", "ਪੰਜਾਬੀ"],
            ["ku", "Kurdî"],
            ["ru", "Русский"],
            ["uk", "Українська"],
            ["fa", "فارسی"],
            ["pl", "Polski"],
            ["zh", "中文"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Label htmlFor="ref-notes">Anything else? (optional)</Label>
        <Textarea
          id="ref-notes"
          rows={3}
          maxLength={2000}
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          placeholder="Share only what is needed for the referral. Do not include medical records here."
        />
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs text-muted-foreground">
          Submitting requests contact about a referral only. It does not create insurance cover.
        </p>
        <Button type="submit" disabled={mutation.isPending} className="bg-gradient-primary">
          {mutation.isPending ? "Sending…" : "Request referral"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
