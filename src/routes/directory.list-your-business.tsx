import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/directory/list-your-business")({
  head: () => ({
    meta: [
      { title: "List your business — free — Beistand directory" },
      { name: "description", content: "Get discovered by Beistand member families across Germany. Free listing in the community directory — no per-lead fees, no commissions." },
      { property: "og:title", content: "List your business — free — Beistand directory" },
      { property: "og:description", content: "Free listing in the Beistand directory. Contact details are shown to Beistand members only, so every enquiry is a serious one." },
    ],
  }),
  component: ListYourBusiness,
});

function ListYourBusiness() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Community directory
        </div>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Free to list. Seen by every Beistand member.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          The Beistand directory is where our paying members search when they
          need a lawyer, doctor, translator, tax advisor, imam, teacher, or
          trades business who speaks their language. Listing is completely
          free — your contact details are only shown to Beistand members, so
          every enquiry is from a serious, subscribed household.
        </p>

        <div className="mt-10 rounded-3xl border border-border/60 bg-card p-8 shadow-card">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold">€0</span>
            <span className="text-muted-foreground">/ forever</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Public name, category, city and languages on beistand.de/directory",
              "Contact details (phone, email, website) revealed only to members",
              "Filter by language, city and Bundesland",
              "Free updates any time",
              "Optional featured placement (paid add-on)",
              "No per-lead fees, no commissions",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 w-full bg-gradient-primary shadow-elevated">
            <Link to="/auth">Create your free listing</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sign in or create an account to submit your listing.
          </p>
        </div>

        <div className="mt-10 flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-clay-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <strong className="text-foreground">Why is the directory members-only?</strong>{" "}
            <span className="text-muted-foreground">
              Beistand members pay €5–€25/month for a supported settlement
              journey. Gating contact details keeps time-wasters out and means
              you only hear from serious households ready to hire you.
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-parchment/40 p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Different from our vetted expert network.</strong>{" "}
          The free directory is public — anyone can create a listing. Our
          verified consultant network — lawyers, doctors, imams etc. who
          deliver actual casework — is invitation-only and works on
          agreed wholesale rates or a referral fee.
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
