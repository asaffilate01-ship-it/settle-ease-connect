import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setStoredConsent } from "@/hooks/use-cookie-consent";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies — Beistand" },
      { name: "description", content: "Cookie-Einsatz und Einwilligung nach § 25 TDDDG und Art. 6 DSGVO." },
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
    <LegalArticle title="Cookies & Tracking (§ 25 TDDDG)" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="Rechtsgrundlage">
        <p>
          Der Zugriff auf Informationen in Ihrem Endgerät bzw. die Speicherung von Informationen
          darauf ist nach § 25 Abs. 1 TDDDG (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz)
          nur mit Ihrer ausdrücklichen Einwilligung zulässig. Ausgenommen sind gemäß § 25 Abs. 2
          TDDDG technisch unbedingt erforderliche Cookies. Die anschließende Verarbeitung
          personenbezogener Daten stützen wir auf Art. 6 Abs. 1 lit. a bzw. lit. f DSGVO.
        </p>
      </LegalSection>

      <LegalSection title="Kategorien">
        <ul>
          <li>
            <strong>Unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG)</strong> — Anmeldung, Session,
            Sprachauswahl, Betrugsprävention, Cookie-Einwilligung selbst. Kein Consent nötig.
          </li>
          <li>
            <strong>Statistik / Reichweitenmessung</strong> — nur mit Ihrer Einwilligung. Wir
            verwenden datensparsame, EU-gehostete Analytik ohne Werbe-Profile.
          </li>
        </ul>
        <p>Wir setzen <strong>keine</strong> Werbe-, Tracking- oder Social-Media-Cookies ohne Interaktion.</p>
      </LegalSection>

      <LegalSection title="Ihre Einwilligung">
        <div className="rounded-xl border border-border/60 bg-parchment/40 p-4">
          <p className="mb-3 text-sm">
            Aktuelle Auswahl: <strong>{state ?? "noch keine Auswahl"}</strong>.
            Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => set("all")}>Alle akzeptieren</Button>
            <Button size="sm" variant="outline" onClick={() => set("essential")}>Nur notwendige</Button>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Speicherdauer">
        <p>
          Der Einwilligungs-Cookie wird für 12 Monate gespeichert. Danach fragen wir erneut.
          Session-Cookies laufen mit dem Schließen des Browsers ab.
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Fragen zum Einsatz von Cookies richten Sie bitte an
          {" "}<a href="mailto:privacy@beistand.de">privacy@beistand.de</a>.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
