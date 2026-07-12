import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & GDPR — Beistand" },
      { name: "description", content: "How Beistand collects, uses and protects your personal data under the GDPR." },
      { property: "og:title", content: "Privacy & GDPR — Beistand" },
      { property: "og:url", content: "/legal/privacy" },
    ],
    links: [{ rel: "canonical", href: "/legal/privacy" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Privacy notice (GDPR)" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="Data controller">
        <p>
          Beistand GmbH, Berlin, Germany, is the controller of personal data processed through the
          platform. Contact us at <a href="mailto:privacy@beistand.de">privacy@beistand.de</a>.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>Depending on how you use Beistand we may process:</p>
        <ul>
          <li>Account data — name, email, phone, preferred language.</li>
          <li>Case data — documents, correspondence, appointment notes you upload or ask us to file on your behalf.</li>
          <li>Family vault data — sensitive documents you choose to store, encrypted at rest.</li>
          <li>Payment data — handled by our payment processor; we don't store full card numbers.</li>
          <li>Usage data — pages viewed, features used (only with your consent for analytics cookies).</li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we process it (legal bases)">
        <ul>
          <li><strong>To perform our contract with you</strong> (Art. 6(1)(b) GDPR) — running your account, cases and payments.</li>
          <li><strong>Legal obligations</strong> (Art. 6(1)(c) GDPR) — tax, accounting, KYC.</li>
          <li><strong>Legitimate interests</strong> (Art. 6(1)(f) GDPR) — securing the platform and preventing fraud.</li>
          <li><strong>Your consent</strong> (Art. 6(1)(a) GDPR) — analytics, marketing emails, sensitive data in the vault.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>
          Only where necessary and always under a data-processing agreement: our cloud host (in the
          EU), our payment provider, our email provider, and — with your explicit instruction —
          the vetted experts working on your case.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Account and case data: for as long as your account is active and up to 3 years after you
          close it (or longer where required by law, e.g. 10 years for invoices). Vault data:
          deleted on request or on account closure. Analytics data: 14 months.
        </p>
      </LegalSection>

      <LegalSection title="Your GDPR rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the data we hold about you (Art. 15).</li>
          <li>Correct inaccurate data (Art. 16).</li>
          <li>Ask us to delete it (Art. 17).</li>
          <li>Restrict or object to processing (Art. 18, 21).</li>
          <li>Receive a portable copy (Art. 20).</li>
          <li>Withdraw consent at any time, without affecting past processing.</li>
        </ul>
        <p>
          To exercise any of these rights, email <a href="mailto:privacy@beistand.de">privacy@beistand.de</a>.
          You also have the right to lodge a complaint with your local data-protection authority — in
          Germany, the Berliner Beauftragte für Datenschutz und Informationsfreiheit.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We encrypt data in transit (TLS) and at rest, store passwords using industry-standard
          hashing, and enforce access controls internally. Sensitive vault documents are encrypted
          with additional keys and access is logged.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
