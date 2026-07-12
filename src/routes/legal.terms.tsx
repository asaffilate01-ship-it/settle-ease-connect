import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Beistand" },
      { name: "description", content: "The agreement between you and Beistand when you use the platform." },
      { property: "og:title", content: "Terms of service — Beistand" },
      { property: "og:url", content: "/legal/terms" },
    ],
    links: [{ rel: "canonical", href: "/legal/terms" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Terms of service" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="1. Who we are">
        <p>
          Beistand GmbH ("Beistand", "we", "us") is a company registered in Berlin, Germany.
          Our full company details are on the <a href="/legal/impressum">Imprint</a> page.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          Beistand is a settlement and welfare platform for people living in — or moving to — Germany.
          We provide case management, checklists, a family document vault, an AI assistant, and
          coordination with vetted third-party experts (lawyers, notaries, tax advisers, doctors,
          funeral directors, translators). Third-party fees are always separate from your
          subscription and are quoted transparently in your case.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You must be at least 18 years old to create a Beistand account. You are responsible for
          keeping your login details safe and for everything done under your account. Tell us
          immediately if you suspect unauthorised access.
        </p>
      </LegalSection>

      <LegalSection title="4. Subscriptions and payment">
        <p>
          Beistand plans are billed monthly (Basic €5, Plus €10, Complete €25 per household).
          You can cancel at any time from your account; cancellation takes effect at the end of your
          current billing period. Third-party fees, government fees and insurance premiums are not
          part of your subscription and are billed separately with full itemised invoicing.
        </p>
      </LegalSection>

      <LegalSection title="5. What Beistand is not">
        <p>
          Beistand is not a law firm, tax firm, insurance broker, medical practice or funeral home.
          We coordinate with regulated professionals on your behalf. Advice you receive from a
          third-party expert is between you and that expert.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>
          Don't use Beistand to break the law, defraud authorities, harass others, or upload
          content you don't have the right to share. We may suspend accounts that do.
        </p>
      </LegalSection>

      <LegalSection title="7. Liability">
        <p>
          Nothing in these terms limits our liability where it can't legally be limited (in
          particular for personal injury caused by our negligence, and for intentional or grossly
          negligent breaches). Otherwise our liability is limited to typical foreseeable damages
          arising from the use of the service.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing law">
        <p>
          These terms are governed by the laws of the Federal Republic of Germany. Consumers keep
          the protection of mandatory law in the country where they usually live.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We may update these terms. Material changes will be communicated at least 30 days in
          advance by email and in-app notice.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
