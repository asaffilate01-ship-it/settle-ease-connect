import { createFileRoute } from "@tanstack/react-router";
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
  const profileFn = useServerFn(getMyAgentProfile);
  const { data: profile } = useQuery({ queryKey: ["agent", "profile"], queryFn: () => profileFn() });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://beistandplus.313test.co.uk";
  const code = profile?.code ?? "…";
  const link = `${origin}/?ref=${code}`;
  const funeralLink = `${origin}/bereavement-cover?ref=${code}`;
  const groupLink = `${origin}/group-cover?ref=${code}`;

  async function copy(v: string) {
    try { await navigator.clipboard.writeText(v); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">Your referral link</h1>
        <p className="mt-1 text-muted-foreground">
          Anyone who signs up within 60 days of clicking your link is attributed to you.
          Your unique code is <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{code}</code>.
        </p>
      </header>

      <LinkCard label="Universal link" value={link} onCopy={() => copy(link)} />
      <LinkCard label="Funeral cover" value={funeralLink} onCopy={() => copy(funeralLink)} />
      <LinkCard label="Group cover" value={groupLink} onCopy={() => copy(groupLink)} />

      <section className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-5 text-sm text-muted-foreground">
        <h2 className="mb-1 font-semibold text-foreground">Selling tips</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Always say <strong>funeral cover</strong> — never <em>funeral insurance</em>. It’s a savings-and-arrangement plan, not a regulated insurance product.</li>
          <li>Subscription tiers: Basic €5, Plus €10, Complete €25 per month (household).</li>
          <li>You earn 5% recurring, for as long as the client stays subscribed.</li>
        </ul>
      </section>
    </div>
  );
}

function LinkCard({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <input readOnly value={value} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" />
        <Button variant="outline" size="sm" onClick={onCopy}><Copy className="mr-1 h-3 w-3" />Copy</Button>
      </div>
    </div>
  );
}
