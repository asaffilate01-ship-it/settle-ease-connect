import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setStoredConsent } from "@/hooks/use-cookie-consent";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies — Beistand" },
      { name: "description", content: "How Beistand uses cookies and how to change your consent." },
      { property: "og:title", content: "Cookies — Beistand" },
      { property: "og:url", content: "/legal/cookies" },
    ],
    links: [{ rel: "canonical", href: "/legal/cookies" }],
  }),
  component: Page,
});

function Page() {
  const [state, setState] = useState<string | null>(() => getStoredConsent());
  const set = (v: "all" | "essential") => {
    setStoredConsent(v);
    setState(v);
  };
  return (
    <LegalArticle title="Cookies" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="What we use">
        <p>Beistand uses two categories of cookies:</p>
        <ul>
          <li><strong>Essential cookies</strong> — needed to sign you in, keep you signed in and remember your language. These are set regardless of consent because the site can't work without them.</li>
          <li><strong>Analytics cookies</strong> — help us understand how the platform is used so we can improve it. Only set if you accept them.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your current choice">
        <div className="rounded-xl border border-border/60 bg-parchment/40 p-4">
          <p className="mb-3 text-sm">
            You have currently chosen: <strong>{state ?? "no choice yet"}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => set("all")}>Accept all</Button>
            <Button size="sm" variant="outline" onClick={() => set("essential")}>Essential only</Button>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          We do not use advertising cookies. Embedded content from third parties (for example a
          shared blog article on a social network) may set cookies once you interact with it — that
          is handled by the network in question.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Any question about cookies goes to <a href="mailto:privacy@beistand.de">privacy@beistand.de</a>.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
