import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCrmComplaints, updateComplaintStatus } from "@/lib/crm.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["open","in_review","resolved","rejected","withdrawn"] as const;

export const Route = createFileRoute("/_authenticated/portal/crm/complaints")({
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const fn = useServerFn(listCrmComplaints);
  const updateFn = useServerFn(updateComplaintStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["crm-complaints"], queryFn: () => fn() });

  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: (typeof STATUSES)[number] }) => updateFn({ data: { id, status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-complaints"] }); toast.success("Complaint updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Complaints ({data.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 && <p className="text-sm text-muted-foreground">No complaints on file. Nice.</p>}
        {data.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{c.subject}</div>
              <div className="text-xs text-muted-foreground">
                {c.reference} · severity {c.severity} · opened {new Date(c.opened_at).toLocaleDateString()}
              </div>
              {c.description && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={c.status === "open" ? "destructive" : "secondary"}>{c.status}</Badge>
              <Select value={c.status} onValueChange={(v) => mut.mutate({ id: c.id, status: v as any })}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
