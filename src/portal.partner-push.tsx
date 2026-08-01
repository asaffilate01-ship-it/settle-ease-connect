import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PlugZap,
  RefreshCw,
  Send,
  Settings2,
} from "lucide-react";
import { Aal2Gate } from "@/components/security/aal2-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listPartnerEndpoints,
  listPartnerPushes,
  pushInsuranceLeadToPartner,
  retryPartnerPush,
  savePartnerEndpoint,
} from "@/lib/partner-push.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/partner-push")({
  component: PartnerDeliveryPage,
});

type PartnerEndpoint = {
  id: string;
  partner_code: string;
  display_name: string;
  endpoint_url: string;
  signing_secret_env: string;
  active: boolean;
  max_attempts: number;
  timeout_ms: number;
};
type EndpointForm = Omit<PartnerEndpoint, "id" | "max_attempts" | "timeout_ms"> & {
  id?: string;
  max_attempts: number | string;
  timeout_ms: number | string;
};
type PartnerPush = {
  id: string;
  partner_code: string;
  lead_id: string | null;
  status: string;
  attempt_count: number;
  created_at: string;
  delivered_at: string | null;
  last_error: string | null;
};
type DeliveryAttempt = {
  push_id: string;
  response_status: number | null;
  error_message: string | null;
  duration_ms: number | null;
};

function PartnerDeliveryPage() {
  const endpointsFn = useServerFn(listPartnerEndpoints);
  const pushesFn = useServerFn(listPartnerPushes);
  const queueFn = useServerFn(pushInsuranceLeadToPartner);
  const retryFn = useServerFn(retryPartnerPush);
  const saveEndpointFn = useServerFn(savePartnerEndpoint);
  const qc = useQueryClient();
  const { roles } = useCurrentUser();
  const isAdmin = roles.includes("admin");
  const endpointsQ = useQuery({ queryKey: ["partner-endpoints"], queryFn: () => endpointsFn() });
  const pushesQ = useQuery({
    queryKey: ["partner-pushes"],
    queryFn: () => pushesFn(),
    refetchInterval: 30_000,
  });
  const endpoints = useMemo(() => (endpointsQ.data ?? []) as PartnerEndpoint[], [endpointsQ.data]);
  const pushes = useMemo(
    () => (pushesQ.data?.pushes ?? []) as PartnerPush[],
    [pushesQ.data?.pushes],
  );
  const attempts = useMemo(
    () => (pushesQ.data?.attempts ?? []) as DeliveryAttempt[],
    [pushesQ.data?.attempts],
  );
  const [leadId, setLeadId] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [editing, setEditing] = useState<EndpointForm | null>(null);
  const attemptsByPush = useMemo(
    () =>
      new Map(
        pushes.map((push) => [push.id, attempts.filter((attempt) => attempt.push_id === push.id)]),
      ),
    [pushes, attempts],
  );

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["partner-endpoints"] }),
      qc.invalidateQueries({ queryKey: ["partner-pushes"] }),
    ]);
  const queue = useMutation({
    mutationFn: () => queueFn({ data: { leadId, endpointId } }),
    onSuccess: async () => {
      setLeadId("");
      await refresh();
      toast.success("Partner delivery queued");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const retry = useMutation({
    mutationFn: (id: string) => retryFn({ data: { id } }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const save = useMutation({
    mutationFn: () =>
      saveEndpointFn({
        data: {
          id: editing!.id,
          partnerCode: editing!.partner_code,
          displayName: editing!.display_name,
          endpointUrl: editing!.endpoint_url,
          signingSecretEnv: editing!.signing_secret_env,
          active: editing!.active,
          maxAttempts: Number(editing!.max_attempts),
          timeoutMs: Number(editing!.timeout_ms),
        },
      }),
    onSuccess: async () => {
      setEditing(null);
      await refresh();
      toast.success("Endpoint saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const active = endpoints.filter((endpoint) => endpoint.active);
  return (
    <Aal2Gate reason="Partner delivery exposes personal lead data. Confirm MFA to continue.">
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <PlugZap className="h-4 w-4" /> Integrations
            </div>
            <h1 className="display-lg mt-1 font-semibold">Partner delivery centre</h1>
            <p className="text-sm text-muted-foreground">
              Signed webhooks, automatic retries, delivery evidence and dead-letter recovery.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() =>
                setEditing({
                  partner_code: "",
                  display_name: "",
                  endpoint_url: "https://",
                  signing_secret_env: "PARTNER_SIGNING_SECRET_",
                  active: false,
                  max_attempts: 6,
                  timeout_ms: 10000,
                })
              }
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Register endpoint
            </Button>
          )}
        </header>

        <div className="grid gap-3 sm:grid-cols-4">
          <Kpi label="Active endpoints" value={active.length} />
          <Kpi
            label="Queued / retrying"
            value={
              pushes.filter((push) => ["queued", "processing", "retrying"].includes(push.status))
                .length
            }
          />
          <Kpi
            label="Delivered"
            value={pushes.filter((push) => ["sent", "acknowledged"].includes(push.status)).length}
          />
          <Kpi
            label="Dead letter"
            value={pushes.filter((push) => push.status === "dead_letter").length}
            danger
          />
        </div>

        {editing && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
            className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2"
          >
            <Field label="Partner code">
              <Input
                required
                pattern="[a-z0-9_-]+"
                value={editing.partner_code}
                onChange={(event) => setEditing({ ...editing, partner_code: event.target.value })}
              />
            </Field>
            <Field label="Display name">
              <Input
                required
                value={editing.display_name}
                onChange={(event) => setEditing({ ...editing, display_name: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="HTTPS endpoint">
                <Input
                  required
                  type="url"
                  value={editing.endpoint_url}
                  onChange={(event) => setEditing({ ...editing, endpoint_url: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Signing-secret environment variable">
              <Input
                required
                value={editing.signing_secret_env}
                onChange={(event) =>
                  setEditing({ ...editing, signing_secret_env: event.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Timeout (ms)">
              <Input
                required
                type="number"
                min={1000}
                max={30000}
                value={editing.timeout_ms}
                onChange={(event) => setEditing({ ...editing, timeout_ms: event.target.value })}
              />
            </Field>
            <Field label="Maximum attempts">
              <Input
                required
                type="number"
                min={1}
                max={12}
                value={editing.max_attempts}
                onChange={(event) => setEditing({ ...editing, max_attempts: event.target.value })}
              />
            </Field>
            <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
              <Switch
                checked={editing.active}
                onCheckedChange={(active) => setEditing({ ...editing, active })}
              />
              <span>
                <strong>Endpoint active</strong>
                <span className="block text-xs text-muted-foreground">
                  Only enable after sandbox signature verification.
                </span>
              </span>
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                Save endpoint
              </Button>
            </div>
          </form>
        )}

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-xl font-semibold">Queue insurance lead</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Only registered endpoints can receive data; arbitrary URLs are rejected.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Insurance lead UUID"
              value={leadId}
              onChange={(event) => setLeadId(event.target.value)}
            />
            <Select value={endpointId} onValueChange={setEndpointId}>
              <SelectTrigger>
                <SelectValue placeholder="Select active partner" />
              </SelectTrigger>
              <SelectContent>
                {active.map((endpoint) => (
                  <SelectItem key={endpoint.id} value={endpoint.id}>
                    {endpoint.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!leadId || !endpointId || queue.isPending}
              onClick={() => queue.mutate()}
            >
              <Send className="mr-2 h-4 w-4" />
              Queue
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Endpoint health</h2>
              <p className="text-xs text-muted-foreground">
                Secret names are shown; secret values never leave the deployment environment.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y">
            {endpoints.length === 0 ? (
              <Empty text="No endpoints registered." />
            ) : (
              endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setEditing({ ...endpoint })}
                  className="flex w-full flex-wrap items-center gap-4 p-4 text-left hover:bg-muted/30 disabled:cursor-default"
                >
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl ${endpoint.active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {endpoint.active ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{endpoint.display_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {endpoint.endpoint_url}
                    </div>
                  </div>
                  <Badge variant="outline">{endpoint.active ? "active" : "disabled"}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {endpoint.max_attempts} attempts · {endpoint.timeout_ms}ms
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b p-4">
            <h2 className="font-display text-xl font-semibold">Delivery ledger</h2>
          </div>
          {pushesQ.isLoading ? (
            <Empty text="Loading deliveries…" />
          ) : pushes.length === 0 ? (
            <Empty text="No deliveries have been queued." />
          ) : (
            <div className="divide-y">
              {pushes.map((push) => {
                const history = attemptsByPush.get(push.id) ?? [];
                return (
                  <div key={push.id} className="p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <StatusIcon status={push.status} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {push.partner_code} · lead {push.lead_id?.slice(0, 8) ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Queued {new Date(push.created_at).toLocaleString()} · {push.attempt_count}{" "}
                          attempts
                          {push.delivered_at
                            ? ` · delivered ${new Date(push.delivered_at).toLocaleString()}`
                            : ""}
                        </div>
                        {push.last_error && (
                          <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-700">
                            {push.last_error}
                          </div>
                        )}
                        {history.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Latest attempt:{" "}
                            {history[0].response_status
                              ? `HTTP ${history[0].response_status}`
                              : history[0].error_message || "no response"}{" "}
                            · {history[0].duration_ms ?? "—"}ms
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">{push.status.replace(/_/g, " ")}</Badge>
                      {["failed", "dead_letter"].includes(push.status) && (
                        <Button size="sm" variant="outline" onClick={() => retry.mutate(push.id)}>
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Aal2Gate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
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
function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
function StatusIcon({ status }: { status: string }) {
  if (["sent", "acknowledged"].includes(status))
    return (
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  if (["dead_letter", "failed"].includes(status))
    return (
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/10 text-red-700">
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-700">
      <Clock3 className="h-4 w-4" />
    </div>
  );
}
