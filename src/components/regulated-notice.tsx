import { ShieldCheck } from "lucide-react";

type Domain = "insurance" | "funeral" | "tax" | "legal" | "immigration" | "education";

const COPY: Record<Domain, string> = {
  insurance:
    "BeistandPlus is not an insurer and does not give insurance advice. Where a referral service is active, the licensed provider confirms its identity, regulatory status, offer, terms and pricing before you decide. Any commission is disclosed as required.",
  funeral:
    "BeistandPlus does not underwrite funeral cover or give insurance advice. Where an introduction is available, benefit amounts, eligibility, waiting periods, exclusions and payout handling are determined only by the licensed provider's policy documents.",
  tax: "BeistandPlus is not a tax advisor and gives no tax advice (§4 StBerG). Any estimate shown is an indication only. Filing and regulated advice are provided by independent Steuerberater partners who contract with you directly and set their own fees.",
  legal:
    "BeistandPlus is not a law firm and gives no legal advice (§3 RDG). We explain process, translate documents and coordinate paperwork. Legal advice, representation and any retainer come from independent lawyers or notaries who contract with you directly.",
  immigration:
    "BeistandPlus provides process guidance and translation only — not legal or immigration advice (§3 RDG). Decisions rest with the responsible German authority; where a legal assessment is needed we hand off to an independent immigration lawyer.",
  education:
    "Course places, funding eligibility and certification are decided by the course provider and the responsible authority (BAMF, Jobcenter or Agentur für Arbeit). BeistandPlus helps you prepare and submit, and does not guarantee approval, a place or an outcome.",
};

export function RegulatedNotice({
  domain,
  extra,
  className = "",
}: {
  domain: Domain;
  extra?: string;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 ${className}`}>
      <div className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-semibold text-foreground">Scope of our service. </span>
          {COPY[domain]}
          {extra ? ` ${extra}` : ""} Third-party costs are always shown separately and never hidden
          in our fee.
        </p>
      </div>
    </section>
  );
}
