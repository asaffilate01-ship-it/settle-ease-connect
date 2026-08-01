import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, PlugZap, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Aal2Gate } from "@/components/security/aal2-gate";
import { toast } from "sonner";
import { pushInsuranceLeadToPartner } from "@/lib/partner-push.functions";
import {
  listPartnerEndpoints,
  listPushAttempts,
  retryPartnerPush,
  savePartnerEndpoint,
} from "@/lib/partner-delivery.functions";

export const Route = createFileRoute("/_authenticated/portal/partner-push")({
  head: () => ({ meta: [{ title: "Partner delivery centre — BeistandPlus" }] }),
  component: PartnerDeliveryCentre,
});

type Endpoint = {
  id: string;
  partner_code: string;
  label: string;
  endpoint_url: string;
  signing_secret_env: string;
  max_attempts: number;
  timeout_ms: number;
  active: boolean;
  notes: string | null;
};
type Push = {
  id: string;
  partner_code: string;
  status: string;
  attempt_count: number;
  response_status: number | null;
  last_error: string | null;
  next_attempt_at: string | null;
  delivered_at: string | null;
  dead_lettered_at: string | null;
  created_at: string;
};

function PartnerDeliveryCentre() {
  const listFn = useServerFn(listPartnerEndpoints);
  const saveFn = useServerFn(savePartnerEndpoint);
  const retryFn = useServerFn(retryPartnerPush);
  const attemptsFn = useServerFn(listPushAttempts);
  const queueLeadFn = useServerFn(pushInsuranceLeadToPartner);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["partner-delivery"],
    queryFn: () => listFn(),
  });
  const endpoints = (data?.endpoints ?? []) as Endpoint[];
  const pushes = (data?.pushes ?? []) as Push[];
  const health = data?.health;

  const [form, setForm] = useState({
    partnerCode: "",
    label: "",
    endpointUrl: "https://",
    signingSecretEnv: "PARTNER_SIGNING_SECRET_",
    maxAttempts: 6,
    timeoutMs: 10_000,
    notes: "",
  });
  const [leadId, setLeadId] = useState("");
  const [leadPartner, setLeadPartner] = useState("");
  const [openPushId, setOpenPushId] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["partner-delivery"] });

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          partnerCode: form.partnerCode,
          label: form.label,
          endpointUrl: form.endpointUrl,
          signingSecretEnv: form.signingSecretEnv,
          maxAttempts: form.maxAttempts,
          timeoutMs: form.timeoutMs,
          active: true,
          notes: form.notes || null,
        },
      }),
    onSuccess: async () => {
      toast.success("Endpoint registered");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const queueLead = useMutation({
    mutationFn: () => queueLeadFn({ data: { leadId, partnerCode: leadPartner } }),
    onSuccess: async () => {
      setLeadId("");
      toast.success("Lead queued for signed delivery");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const retry = useMutation({
    mutationFn: (id: string) => retryFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Re-queued with a fresh attempt");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const attempts = useQuery({
    queryKey: ["push-attempts", openPushId],
    queryFn: () => attemptsFn({ data: { pushId: openPushId! } }),
    enabled: Boolean(openPushId),
  });

  return (
    <Aal2Gate reason="The delivery centre controls outbound partner data flows. Confirm MFA to continue.">
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <PlugZap className="h-4 w-4" /> Integrations
          </div>
          <h1 className="display-lg mt-1 font-semibold">Partner delivery centre</h1>
          <p className="text-sm text-muted-foreground">
            Signed HTTPS delivery with timestamps, idempotency keys, exponential retries and
            dead-letter handling. Register the secret environment-variable name — never the value.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-4">
          <Kpi label="Queued" value={health?.queued ?? 0} />
          <Kpi label="Retrying" value={health?.retrying ?? 0} />
          <Kpi label="Delivered" value={health?.delivered ?? 0} />
          <Kpi label="Dead letter" value={health?.deadLetter ?? 0} danger />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="font-display text-xl font-semibold">Register an endpoint</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Partner code">
                <Input
                  value={form.partnerCode}
                  onChange={(event) => setForm({ ...form, partnerCode: event.target.value })}
                  placeholder="dela"
                />
              </Field>
              <Field label="Label">
                <Input
                  value={form.label}
                  onChange={(event) => setForm({ ...form, label: event.target.value })}
                  placeholder="DELA lead intake"
                />
              </Field>
            </div>
            <Field label="HTTPS endpoint URL">
              <Input
                value={form.endpointUrl}
                onChange={(event) => setForm({ ...form, endpointUrl: event.target.value })}
              />
            </Field>
            <Field label="Signing secret environment-variable NAME">
              <Input
                value={form.signingSecretEnv}
                onChange={(event) => setForm({ ...form, signingSecretEnv: event.target.value })}
              />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Max attempts">
                <Input
                  type="number"
                  value={form.maxAttempts}
                  onChange={(event) =>
                    setForm({ ...form, maxAttempts: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Timeout (ms)">
                <Input
                  type="number"
                  value={form.timeoutMs}
                  onChange={(event) => setForm({ ...form, timeoutMs: Number(event.target.value) })}
                />
              </Field>
            </div>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Payload contract, retention agreement, incident contacts…"
            />
            <Button
              onClick={() => save.mutate()}
              disabled={!form.partnerCode || !form.label || save.isPending}
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Register endpoint
            </Button>
            <p className="text-xs text-muted-foreground">
              The host must also appear in <code>PARTNER_DELIVERY_ALLOWED_HOSTS</code>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="font-display text-xl font-semibold">Queue an insurance lead</h2>
              <Input
                value={leadId}
                onChange={(event) => setLeadId(event.target.value)}
                placeholder="Lead ID (UUID)"
              />
              <Input
                value={leadPartner}
                onChange={(event) => setLeadPartner(event.target.value)}
                placeholder="Partner code of a registered endpoint"
              />
              <Button
                disabled={!leadId || !leadPartner || queueLead.isPending}
                onClick={() => queueLead.mutate()}
              >
                <Activity className="mr-2 h-4 w-4" /> Queue signed delivery
              </Button>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="font-display text-xl font-semibold">Registered endpoints</h2>
              <div className="mt-3 space-y-2">
                {endpoints.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No endpoints registered yet.</p>
                ) : (
                  endpoints.map((endpoint) => (
                    <div key={endpoint.id} className="rounded-xl border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {endpoint.label} · {endpoint.partner_code}
                        </span>
                        <Badge variant="outline">
                          {endpoint.active ? "active" : "disabled"}
                        </Badge>
                      </div>
                      <div className="mt-1 break-all text-xs text-muted-foreground">
                        {endpoint.endpoint_url}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        secret env {endpoint.signing_secret_env} · {endpoint.max_attempts} attempts ·{" "}
                        {endpoint.timeout_ms} ms
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">Delivery queue</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pushes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing has been queued yet.</p>
          ) : (
            pushes.map((push) => (
              <div key={push.id} className="rounded-xl border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{push.partner_code}</div>
                    <div className="text-xs text-muted-foreground">
                      attempt {push.attempt_count} · created{" "}
                      {new Date(push.created_at).toLocaleString()}
                      {push.next_attempt_at
                        ? ` · next ${new Date(push.next_attempt_at).toLocaleString()}`
                        : ""}
                    </div>
                    {push.last_error && (
                      <div className="mt-1 text-xs text-red-700">{push.last_error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        push.status === "dead_letter"
                          ? "border-red-500/40 text-red-700"
                          : push.status === "sent"
                            ? "border-emerald-500/40 text-emerald-700"
                            : ""
                      }
                    >
                      {push.status}
                      {push.response_status ? ` · ${push.response_status}` : ""}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenPushId(openPushId === push.id ? null : push.id)}
                    >
                      Attempts
                    </Button>
                    {(push.status === "failed" ||
                      push.status === "dead_letter" ||
                      push.status === "retrying") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retry.mutate(push.id)}
                        disabled={retry.isPending}
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
                      </Button>
                    )}
                  </div>
                </div>
                {openPushId === push.id && (
                  <div className="mt-3 space-y-2 border-t pt-3 text-xs">
                    {attempts.isLoading ? (
                      <p className="text-muted-foreground">Loading attempts…</p>
                    ) : (attempts.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground">No attempts recorded yet.</p>
                    ) : (
                      (attempts.data ?? []).map((attempt: any) => (
                        <div key={attempt.id} className="rounded-lg bg-muted/30 p-2">
                          <div className="font-medium">
                            Attempt {attempt.attempt_number} ·{" "}
                            {attempt.response_status ?? "no response"} · {attempt.duration_ms} ms
                          </div>
                          {attempt.error_message && (
                            <div className="text-red-700">{attempt.error_message}</div>
                          )}
                          {attempt.response_excerpt && (
                            <div className="mt-1 break-all text-muted-foreground">
                              {attempt.response_excerpt.slice(0, 300)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </Aal2Gate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Kpi({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-4 ${danger && value ? "border-red-500/30" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-display text-3xl font-semibold ${danger && value ? "text-red-700" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
