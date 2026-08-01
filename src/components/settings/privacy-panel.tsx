import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listMyPrivacyRequests,
  exportMyData,
  requestAccountDeletion,
  cancelPrivacyRequest,
} from "@/lib/privacy.functions";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Trash2, Loader2, ShieldCheck } from "lucide-react";

/**
 * GDPR self-service panel: portable data export (Art. 20) and erasure
 * request (Art. 17), plus the member's request history.
 */
export function PrivacyPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyPrivacyRequests);
  const exportFn = useServerFn(exportMyData);
  const deleteFn = useServerFn(requestAccountDeletion);
  const cancelFn = useServerFn(cancelPrivacyRequest);
  const [reason, setReason] = useState("");

  const requestsQ = useQuery({ queryKey: ["privacy-requests"], queryFn: () => listFn() });

  const exportM = useMutation({
    mutationFn: () => exportFn(),
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `beistandplus-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data export has been downloaded.");
      qc.invalidateQueries({ queryKey: ["privacy-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: () => deleteFn({ data: { reason: reason.trim() || undefined } }),
    onSuccess: (r) => {
      toast.success(
        r.alreadyOpen
          ? "You already have a deletion request in progress."
          : "Deletion request received. Our team will confirm within 30 days.",
      );
      setReason("");
      qc.invalidateQueries({ queryKey: ["privacy-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelM = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Request cancelled.");
      qc.invalidateQueries({ queryKey: ["privacy-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-3xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" /> Download my data
          </CardTitle>
          <CardDescription>
            A machine-readable copy of your profile, cases, documents index, plan, checklists and event
            registrations (GDPR Art. 20).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => exportM.mutate()} disabled={exportM.isPending}>
            {exportM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Export as JSON
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-destructive/30 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4 text-destructive" /> Delete my account
          </CardTitle>
          <CardDescription>
            We close your account and erase your data, except records we must keep by law (invoices,
            regulated case files) for their retention period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional: tell us why you're leaving"
            className="min-h-20"
          />
          <Button variant="destructive" onClick={() => deleteM.mutate()} disabled={deleteM.isPending}>
            {deleteM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Request deletion
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-soft lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Request history
          </CardTitle>
          <CardDescription>Every export and deletion request is logged for auditability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {requestsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (requestsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No privacy requests yet.</p>
          ) : (
            (requestsQ.data ?? []).map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium capitalize">{r.kind}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {r.status}
                  </Badge>
                  {r.kind === "deletion" && (r.status === "pending" || r.status === "in_progress") && (
                    <Button size="sm" variant="ghost" onClick={() => cancelM.mutate(r.id)} disabled={cancelM.isPending}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
