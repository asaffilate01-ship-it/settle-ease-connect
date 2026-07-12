import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/directory/list-your-business")({
  head: () => ({
    meta: [
      { title: "List your business — €10/yr — Beistand directory" },
      { name: "description", content: "Get discovered by expat and migrant families across Germany. €10 per year to appear in the Beistand community directory." },
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
          €10 a year. Every family that needs you finds you.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          The Beistand directory is where our members search when they need a
          lawyer, doctor, translator, tax advisor, imam, teacher, or trades
          business who speaks their language. One flat fee of €10 per year — no
          commissions, no per-lead charges.
        </p>

        <div className="mt-10 rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold">€10</span>
            <span className="text-muted-foreground">/ year</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Public listing on beistand.de/directory",
              "Filter by language, city and Bundesland",
              "Contact details, website, and description",
              "Free updates any time",
              "Optional featured placement (add-on)",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 w-full bg-gradient-primary shadow-elevated">
            <Link to="/auth">Create your listing</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sign in or create an account to submit your listing. Payment (€10/yr) is charged at checkout.
          </p>
        </div>

        <div className="mt-12 rounded-xl border border-border/60 bg-parchment/40 p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Different from our vetted expert network.</strong>{" "}
          The €10/yr directory is a public listing anyone can pay to join.
          Our verified consultant network — lawyers, doctors, imams etc.
          who deliver casework — is invitation-only and free for the
          professional (we agree wholesale rates instead).
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
