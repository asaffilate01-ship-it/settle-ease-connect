import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/group-cover/fiduciary-clause")({
  head: () => ({
    meta: [
      { title: "Treuhandvereinbarung · Fiduciary Clause | BeistandPlus" },
      {
        name: "description",
        content:
          "Sample Treuhandvereinbarung (fiduciary clause) for members enrolling in a group Sterbegeldversicherung. Print-ready template — for legal review before signing.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "https://beistandplus.de/group-cover/fiduciary-clause" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/group-cover/fiduciary-clause" }],
  }),
  component: FiduciaryClausePage,
});

function FiduciaryClausePage() {
  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 print:py-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Button asChild variant="ghost" size="sm">
            <Link to="/group-cover">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to group cover
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>

        <article className="prose prose-neutral max-w-none prose-headings:font-display print:prose-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground print:text-black">
            Template · not legal advice · for association counsel review
          </p>
          <h1>Treuhandvereinbarung zur Sterbegeld-Gruppenversicherung</h1>
          <p className="italic">
            Fiduciary Agreement for the Group Death Benefit Insurance
          </p>

          <h2>§ 1 Parties</h2>
          <p>
            This fiduciary agreement (Treuhandvereinbarung) is concluded between{" "}
            <strong>[Association / Employer — legal name, address, Register No.]</strong>{" "}
            (hereinafter <em>the Trustee / Treuhänder</em>) and the undersigned member{" "}
            <strong>[Member full name, date of birth, member ID]</strong> (hereinafter{" "}
            <em>the Member</em>).
          </p>

          <h2>§ 2 Purpose</h2>
          <p>
            The Trustee holds a collective death-benefit insurance policy
            (Sterbegeld-Gruppenversicherung) with{" "}
            <strong>[Insurer — DELA / Solidar VVaG / Münchener Verein / ERGO]</strong>{" "}
            (hereinafter <em>the Insurer</em>) covering the Member with a sum insured of{" "}
            <strong>€20,000</strong>. The Trustee is designated as the primary revocable
            beneficiary (widerrufliches Bezugsrecht) under the policy solely for the
            fiduciary purpose set out in this agreement.
          </p>

          <h2>§ 3 Fiduciary Mandate</h2>
          <ol>
            <li>
              Upon the death of the Member, the Trustee shall promptly claim the sum
              insured from the Insurer without requiring a certificate of inheritance
              (Erbschein).
            </li>
            <li>
              The funds shall be received into a ring-fenced trust account
              (Treuhandkonto), legally separated from the Trustee's operating cash and
              from any insolvency estate of the Trustee.
            </li>
            <li>
              The Trustee shall settle verified invoices of the funeral director,
              cemetery, and directly related bereavement costs from the sum insured, on
              behalf of and to the exclusive benefit of the Member's estate and family.
            </li>
            <li>
              Any remaining balance shall be transferred by SEPA (or international wire,
              where applicable) to the Named Beneficiary (§ 5) within{" "}
              <strong>14 calendar days</strong> of settlement of the funeral invoices.
            </li>
          </ol>

          <h2>§ 4 Duties &amp; Standard of Care</h2>
          <ol>
            <li>
              The Trustee acts with the diligence of a prudent trustee (Sorgfalt eines
              ordentlichen Treuhänders, § 662 ff. BGB analog).
            </li>
            <li>
              The Trustee shall provide the Named Beneficiary with an itemised statement
              of all disbursements from the sum insured within 30 days of final payout.
            </li>
            <li>
              The Trustee shall not use the sum insured for any purpose other than those
              set out in § 3 and shall not commingle it with membership dues, donations,
              or association assets.
            </li>
          </ol>

          <h2>§ 5 Named Beneficiary (Bezugsberechtigte/r für den Restbetrag)</h2>
          <p>
            The Member designates the following person to receive the balance remaining
            after funeral settlement:
          </p>
          <ul>
            <li>Full name: <strong>[__________________]</strong></li>
            <li>Relationship to Member: <strong>[__________________]</strong></li>
            <li>Date of birth: <strong>[__________________]</strong></li>
            <li>Address: <strong>[__________________]</strong></li>
            <li>IBAN / bank account for transfer: <strong>[__________________]</strong></li>
          </ul>
          <p>
            The Member may update this designation at any time by written notice to the
            Trustee. If no beneficiary is designated at the time of death, the balance
            is paid to the legal heirs upon presentation of an Erbschein.
          </p>

          <h2>§ 6 Revocation &amp; Portability</h2>
          <p>
            The Member may revoke this fiduciary designation at any time in writing.
            Revocation ends the Trustee's beneficiary status; the Member may then
            continue the cover privately with the Insurer where the insurer's group
            terms permit portability.
          </p>

          <h2>§ 7 Data Protection</h2>
          <p>
            Personal data is processed in accordance with Art. 6(1)(b) GDPR
            (performance of a contract) and Art. 6(1)(f) GDPR (legitimate interest in
            executing the fiduciary mandate). The Trustee's privacy notice applies.
          </p>

          <h2>§ 8 Term &amp; Termination</h2>
          <p>
            This agreement is effective from the date of signature and remains in force
            for as long as the Member is enrolled in the group policy. Termination of
            membership terminates this agreement without prejudice to obligations
            already accrued.
          </p>

          <h2>§ 9 Governing Law &amp; Jurisdiction</h2>
          <p>
            This agreement is governed by the law of the Federal Republic of Germany.
            Exclusive place of jurisdiction, where legally permissible, is the seat of
            the Trustee.
          </p>

          <h2>§ 10 Severability</h2>
          <p>
            Should any provision of this agreement be or become invalid, the validity
            of the remaining provisions shall not be affected.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-8">
            <div>
              <div className="border-t border-black pt-2 text-sm">
                Place, date
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-2 text-sm">
                Member (signature)
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-2 text-sm">
                For the Trustee (signature, name, function)
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-2 text-sm">
                Witness (optional)
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-foreground print:text-black">
            <strong>Disclaimer:</strong> This template is a starting point for
            association counsel and does not constitute legal or insurance advice.
            Have it reviewed by a qualified German lawyer before members sign.
          </p>
        </article>
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
