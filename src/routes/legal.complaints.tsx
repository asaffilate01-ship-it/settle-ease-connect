import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

export const Route = createFileRoute("/legal/complaints")({
  head: () => ({
    meta: [
      { title: "Complaints — Beistand" },
      { name: "description", content: "How to raise a complaint with Beistand and what to expect at each stage." },
      { property: "og:title", content: "Complaints — Beistand" },
      { property: "og:url", content: "/legal/complaints" },
    ],
    links: [{ rel: "canonical", href: "/legal/complaints" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Complaints procedure" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="Talk to your case manager first">
        <p>
          Most issues are resolved fastest by messaging your case manager directly from your case
          workspace. Give us the case number and a short description of what went wrong.
        </p>
      </LegalSection>

      <LegalSection title="Formal complaint">
        <p>
          If you would prefer to raise a formal complaint, email <a href="mailto:complaints@beistand.de">complaints@beistand.de</a>.
          A written complaint should include:
        </p>
        <ul>
          <li>Your full name and account email.</li>
          <li>The case number (if any).</li>
          <li>A short description of what happened and when.</li>
          <li>What outcome you'd like.</li>
        </ul>
        <p>We acknowledge every complaint within <strong>2 working days</strong> and give a full response within <strong>15 working days</strong>. Where investigation takes longer, we tell you why and give a new date.</p>
      </LegalSection>

      <LegalSection title="If you're still not satisfied">
        <p>
          You may refer a consumer dispute to the Universalschlichtungsstelle des Bundes
          (Kehl, Germany) or, for online-purchased services, the European Commission's
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer noopener"> Online Dispute Resolution platform</a>.
          We are not obliged, and are generally not willing, to take part in dispute-resolution
          proceedings before a consumer-arbitration board — but we will always try to resolve any
          complaint with you directly first.
        </p>
      </LegalSection>

      <LegalSection title="Data-protection complaints">
        <p>
          Complaints about how we handle personal data should go to <a href="mailto:privacy@beistand.de">privacy@beistand.de</a>.
          You may also complain directly to the Berliner Beauftragte für Datenschutz und Informationsfreiheit.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
