import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileLock2, Send } from "lucide-react";
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
import { listMyPrivacyRequests, submitPrivacyRequest } from "@/lib/governance.functions";
import { toast } from "sonner";
import { Aal2Gate } from "@/components/security/aal2-gate";

export const Route = createFileRoute("/_authenticated/app/privacy-requests")({
  component: PrivacyRequestsPage,
});
const TYPES = [
  "access",
  "rectification",
  "erasure",
  "portability",
  "restriction",
  "objection",
  "consent_withdrawal",
] as const;
type PrivacyType = (typeof TYPES)[number];
type PrivacyRequest = {
  id: string;
  request_type: PrivacyType;
  description: string;
  status: string;
  created_at: string;
  due_at: string;
};

function PrivacyRequestsPage() {
  return (
    <Aal2Gate reason="Privacy requests expose sensitive account information and require two-factor verification.">
      <PrivacyRequestsContent />
    </Aal2Gate>
  );
}

function PrivacyRequestsContent() {
  const listFn = useServerFn(listMyPrivacyRequests);
  const submitFn = useServerFn(submitPrivacyRequest);
  const qc = useQueryClient();
  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ["my-privacy-requests"],
    queryFn: () => listFn(),
  });
  const rows = rawRows as PrivacyRequest[];
  const [type, setType] = useState<PrivacyType>("access");
  const [description, setDescription] = useState("");
  const submit = useMutation({
    mutationFn: () => submitFn({ data: { requestType: type, description } }),
    onSuccess: async () => {
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["my-privacy-requests"] });
      toast.success("Privacy request submitted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <FileLock2 className="h-4 w-4" /> Your data
        </div>
        <h1 className="display-lg mt-1 font-semibold">Privacy requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit a verified request and track its review target date.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
          className="space-y-4 rounded-2xl border bg-card p-5"
        >
          <Select value={type} onValueChange={(value) => setType(value as PrivacyType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            required
            minLength={10}
            rows={7}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what you are requesting and any relevant records or dates."
          />
          <Button className="w-full" disabled={submit.isPending || description.trim().length < 10}>
            <Send className="mr-2 h-4 w-4" />
            Submit request
          </Button>
        </form>
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b p-5">
            <h2 className="font-display text-xl font-semibold">Request history</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">No privacy requests yet.</div>
          ) : (
            <div className="divide-y">
              {rows.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium capitalize">
                        {row.request_type.replace(/_/g, " ")}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {row.description}
                      </p>
                    </div>
                    <Badge variant="outline">{row.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Submitted {new Date(row.created_at).toLocaleDateString()} · review target{" "}
                    {new Date(row.due_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
