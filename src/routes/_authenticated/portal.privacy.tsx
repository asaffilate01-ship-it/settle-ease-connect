import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, FileLock2, ShieldCheck } from "lucide-react";
import { Aal2Gate } from "@/components/security/aal2-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listPrivacyRequests, updatePrivacyRequest } from "@/lib/governance.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/privacy")({ component: PrivacyPage });
const STATUSES = [
  "submitted",
  "identity_check",
  "in_review",
  "waiting_requester",
  "fulfilled",
  "declined",
] as const;
type PrivacyStatus = (typeof STATUSES)[number];
type PrivacyRequest = {
  id: string;
  request_type: string;
  requester_email: string;
  description: string;
  status: PrivacyStatus;
  due_at: string;
  created_at: string;
  resolution: string | null;
};

function PrivacyPage() {
  const listFn = useServerFn(listPrivacyRequests);
  const updateFn = useServerFn(updatePrivacyRequest);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["privacy-requests"], queryFn: () => listFn() });
  const rows = (data?.rows ?? []) as PrivacyRequest[];
  const [selected, setSelected] = useState<PrivacyRequest | null>(null);
  const [resolution, setResolution] = useState("");
  const update = useMutation({
    mutationFn: (status: PrivacyStatus) =>
      updateFn({
        data: {
          id: selected!.id,
          status,
          resolution: resolution || null,
          identityVerified: status === "in_review",
        },
      }),
    onSuccess: async () => {
      setSelected(null);
      setResolution("");
      await qc.invalidateQueries({ queryKey: ["privacy-requests"] });
      toast.success("Privacy request updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const overdue = rows.filter(
    (row) => new Date(row.due_at) < new Date() && !["fulfilled", "declined"].includes(row.status),
  ).length;
  return (
    <Aal2Gate reason="Privacy requests contain data-subject information. Confirm MFA to continue.">
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <FileLock2 className="h-4 w-4" /> Data protection
          </div>
          <h1 className="display-lg mt-1 font-semibold">DPO request console</h1>
          <p className="text-sm text-muted-foreground">
            Identity verification, statutory deadlines, decisions and completion evidence.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi
            label="Open requests"
            value={rows.filter((row) => !["fulfilled", "declined"].includes(row.status)).length}
          />
          <Kpi
            label="Due in 7 days"
            value={
              rows.filter((row) => {
                const due = new Date(row.due_at).getTime() - Date.now();
                return due >= 0 && due <= 7 * 86_400_000;
              }).length
            }
          />
          <Kpi label="Overdue" value={overdue} danger />
        </div>
        <div className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-[1fr_420px]">
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-sm text-muted-foreground">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground">No requests.</div>
            ) : (
              rows.map((row) => (
                <button
                  key={row.id}
                  onClick={() => {
                    setSelected(row);
                    setResolution(row.resolution ?? "");
                  }}
                  className={`w-full p-4 text-left hover:bg-muted/30 ${selected?.id === row.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium capitalize">
                        {row.request_type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-muted-foreground">{row.requester_email}</div>
                    </div>
                    <Badge variant="outline">{row.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {row.description}
                  </p>
                  <div
                    className={`mt-2 flex items-center gap-1 text-xs ${new Date(row.due_at) < new Date() ? "font-semibold text-red-700" : "text-muted-foreground"}`}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Due {new Date(row.due_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
          <aside className="border-t p-5 lg:border-l lg:border-t-0">
            {!selected ? (
              <div className="grid min-h-72 place-items-center text-center text-sm text-muted-foreground">
                Select a request.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-xl font-semibold capitalize">
                    {selected.request_type.replace(/_/g, " ")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                  {selected.description}
                </div>
                <Textarea
                  rows={6}
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  placeholder="Resolution, refusal reason or completion evidence…"
                />
                {data?.readOnly ? (
                  <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                    <ShieldCheck className="mr-2 inline h-4 w-4" />
                    Auditor view is read-only.
                  </div>
                ) : (
                  <Select
                    value={selected.status}
                    onValueChange={(status) => update.mutate(status as PrivacyStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>
                  Close panel
                </Button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Aal2Gate>
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
