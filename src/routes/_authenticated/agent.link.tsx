import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyAgentProfile } from "@/lib/agents.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agent/link")({
  head: () => ({ meta: [{ title: "Agent — referral link" }] }),
  component: AgentLink,
});

function AgentLink() {
  const { t } = useTranslation();
  const profileFn = useServerFn(getMyAgentProfile);
  const { data: profile } = useQuery({
    queryKey: ["agent", "profile"],
    queryFn: () => profileFn(),
  });

  // SSR-safe: this route is `ssr: false` on the layout, but defend anyway.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const code = profile?.code ?? "…";
  const link = origin ? `${origin}/?ref=${code}` : `/?ref=${code}`;
  const funeralLink = origin
    ? `${origin}/bereavement-cover?ref=${code}`
    : `/bereavement-cover?ref=${code}`;
  const groupLink = origin ? `${origin}/group-cover?ref=${code}` : `/group-cover?ref=${code}`;
  const rate = Number(profile?.commission_rate ?? 5);

  async function copy(v: string) {
    try {
      await navigator.clipboard.writeText(v);
      toast.success(t("agent.link.copied", { defaultValue: "Copied" }));
    } catch {
      toast.error(t("agent.link.copyFail", { defaultValue: "Copy failed" }));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {t("agent.link.title", { defaultValue: "Your referral link" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("agent.link.subtitle", {
            defaultValue:
              "Anyone who signs up within 60 days of clicking your link is attributed to you.",
          })}{" "}
          {t("agent.link.codeLine", { defaultValue: "Your unique code is" })}{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{code}</code>.
        </p>
      </header>

      <LinkCard
        label={t("agent.link.universal", { defaultValue: "Universal link" })}
        value={link}
        onCopy={() => copy(link)}
        copyLabel={t("agent.link.copy", { defaultValue: "Copy" })}
      />
      <LinkCard
        label={t("agent.link.funeral", { defaultValue: "Funeral cover" })}
        value={funeralLink}
        onCopy={() => copy(funeralLink)}
        copyLabel={t("agent.link.copy", { defaultValue: "Copy" })}
      />
      <LinkCard
        label={t("agent.link.group", { defaultValue: "Group cover" })}
        value={groupLink}
        onCopy={() => copy(groupLink)}
        copyLabel={t("agent.link.copy", { defaultValue: "Copy" })}
      />

      <section className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-5 text-sm text-muted-foreground">
        <h2 className="mb-1 font-semibold text-foreground">
          {t("agent.link.tips", { defaultValue: "Selling tips" })}
        </h2>
        <ul className="list-disc space-y-1 ps-5">
          <li>
            {t("agent.link.tip1", {
              defaultValue:
                "Always say funeral cover — never funeral insurance. It’s a savings-and-arrangement plan, not a regulated insurance product.",
            })}
          </li>
          <li>
            {t("agent.link.tip2", {
              defaultValue:
                "Subscription tiers: Basic €5, Plus €10, Complete €25 per month (household).",
            })}
          </li>
          <li>
            {t("agent.link.tip3", {
              defaultValue:
                "You earn {{rate}}% recurring, for as long as the client stays subscribed.",
              rate,
            })}
          </li>
        </ul>
      </section>
    </div>
  );
}

function LinkCard({
  label,
  value,
  onCopy,
  copyLabel,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="sr-only" htmlFor={`agent-link-${label}`}>
          {label}
        </label>
        <input
          id={`agent-link-${label}`}
          readOnly
          value={value}
          className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
        />
        <Button variant="outline" size="sm" onClick={onCopy}>
          <Copy className="me-1 h-3 w-3" />
          {copyLabel}
        </Button>
      </div>
    </div>
  );
}
