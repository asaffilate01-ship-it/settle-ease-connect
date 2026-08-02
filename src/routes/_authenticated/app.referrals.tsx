import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getMyReferralSummary, createMemberReferral } from "@/lib/member-referrals.functions";

export const Route = createFileRoute("/_authenticated/app/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const { t } = useTranslation();
  const get = useServerFn(getMyReferralSummary);
  const create = useServerFn(createMemberReferral);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-referrals"], queryFn: () => get() });
  const [email, setEmail] = useState("");
  const invite = useMutation({
    mutationFn: async () => create({ data: { email } }),
    onSuccess: (row: any) => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["my-referrals"] });
      toast.success(t("pages.referrals.inviteCreated", { code: row.code }));
    },
    onError: (e: any) => toast.error(e?.message ?? t("pages.referrals.failed")),
  });

  const referrals = data?.referrals ?? [];
  const totals = data?.totals ?? { pending: 0, subscribed: 0, rewardEur: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">{t("pages.referrals.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pages.referrals.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Tile
          icon={<Gift className="h-4 w-4" />}
          label={t("pages.referrals.pending")}
          value={String(totals.pending)}
        />
        <Tile
          icon={<Gift className="h-4 w-4" />}
          label={t("pages.referrals.subscribed")}
          value={String(totals.subscribed)}
        />
        <Tile
          icon={<Gift className="h-4 w-4" />}
          label={t("pages.referrals.rewards")}
          value={`€${totals.rewardEur.toFixed(2)}`}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="text-sm font-medium">{t("pages.referrals.inviteByEmail")}</div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <Button disabled={!email || invite.isPending} onClick={() => invite.mutate()}>
            {invite.isPending ? t("pages.referrals.sending") : t("pages.referrals.createInvite")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold">{t("pages.referrals.yourInvites")}</h2>
        {referrals.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("pages.referrals.noInvites")}</p>
        )}
        {referrals.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-sm"
          >
            <div>
              <div className="font-medium">{r.referred_email}</div>
              <div className="text-xs text-muted-foreground">
                {r.status} · code {r.code}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${r.code}`);
                toast.success(t("pages.referrals.linkCopied"));
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
