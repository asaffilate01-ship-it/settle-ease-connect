import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMySessions, listMyFactors } from "@/lib/session-activity.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const { t } = useTranslation();
  const listSessions = useServerFn(listMySessions);
  const listFactors = useServerFn(listMyFactors);
  const { data: sessions = [] } = useQuery({ queryKey: ["my-sessions"], queryFn: () => listSessions() });
  const { data: factors, refetch } = useQuery({ queryKey: ["my-factors"], queryFn: () => listFactors() });
  const [enrolling, setEnrolling] = useState(false);

  async function enrollPasskey() {
    setEnrolling(true);
    try {
      const { error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Passkey (mobile)" });
      if (error) throw error;
      toast.success(t("pages.sessions.enrolled"));
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? t("pages.sessions.enrollFailed"));
    } finally {
      setEnrolling(false);
    }
  }

  const allFactors = [...(factors?.totp ?? []), ...(factors?.phone ?? [])] as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">{t("pages.sessions.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pages.sessions.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 font-medium"><Key className="h-4 w-4" /> {t("pages.sessions.passkeys")}</div>
        <div className="mt-3 space-y-2">
          {allFactors.length === 0 && <p className="text-sm text-muted-foreground">{t("pages.sessions.noneEnrolled")}</p>}
          {allFactors.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
              <div>{f.friendly_name ?? f.factor_type}</div>
              <Badge variant="outline">{f.status}</Badge>
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={enrollPasskey} disabled={enrolling}>
          {enrolling ? t("pages.sessions.enrolling") : t("pages.sessions.addPasskey")}
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-medium"><Shield className="h-4 w-4" /> {t("pages.sessions.recent")}</div>
        <div className="space-y-2">
          {sessions.length === 0 && <p className="text-sm text-muted-foreground">{t("pages.sessions.noEvents")}</p>}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-sm">
              <div>
                <div className="font-medium">{s.event}</div>
                <div className="text-xs text-muted-foreground">{s.device_label ?? s.user_agent ?? t("pages.sessions.unknownDevice")}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
