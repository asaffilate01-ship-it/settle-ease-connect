import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PortalHeader } from "@/components/portal/portal-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  listStudentVerifications,
  reviewStudentVerification,
} from "@/lib/students.functions";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/students")({
  head: () => ({ meta: [{ title: "Student verifications — BeistandPlus" }] }),
  component: StudentsQueue,
});

function StudentsQueue() {
  const qc = useQueryClient();
  const load = useServerFn(listStudentVerifications);
  const review = useServerFn(reviewStudentVerification);
  const [filter, setFilter] = useState<string>("pending");

  const q = useQuery({
    queryKey: ["student-verifications", filter],
    queryFn: () => load({ data: { status: filter === "all" ? undefined : filter } }),
  });

  const reviewMut = useMutation({
    mutationFn: (v: {
      id: string;
      status: "approved" | "rejected";
      discount_percent?: number;
      reviewer_notes?: string;
    }) => review({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["student-verifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openDocument(path: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage.from("vault").createSignedUrl(path, 300);
    if (error || !data) return toast.error(error?.message ?? "Cannot open");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      <PortalHeader
        eyebrow="Membership"
        title="Student verifications"
        subtitle="Approve or reject student discount claims. Approved members receive their configured percent off automatically."
      />

      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nothing to review.
        </div>
      ) : (
        <ul className="space-y-4">
          {(q.data ?? []).map((v) => (
            <Card key={v.id} v={v} onOpen={openDocument} onReview={(input) => reviewMut.mutate(input)} />
          ))}
        </ul>
      )}
    </div>
  );
}

type Row = Awaited<ReturnType<Awaited<ReturnType<typeof useServerFn<typeof listStudentVerifications>>>>>[number];

function Card({
  v,
  onOpen,
  onReview,
}: {
  v: Row;
  onOpen: (p: string | null) => void;
  onReview: (i: {
    id: string;
    status: "approved" | "rejected";
    discount_percent?: number;
    reviewer_notes?: string;
  }) => void;
}) {
  const [pct, setPct] = useState<number>(v.discount_percent ?? 30);
  const [notes, setNotes] = useState<string>(v.reviewer_notes ?? "");
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold">{v.university}</div>
          <div className="text-xs text-muted-foreground">
            User {v.user_id.slice(0, 8)} · submitted {new Date(v.created_at).toLocaleString()}
            {v.valid_until ? ` · valid until ${new Date(v.valid_until).toLocaleDateString()}` : ""}
          </div>
          {v.student_id_number && (
            <div className="mt-1 text-xs">Matriculation #: {v.student_id_number}</div>
          )}
        </div>
        <Badge variant={v.status === "approved" ? "default" : "secondary"}>{v.status}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
        <Button variant="outline" size="sm" onClick={() => onOpen(v.id_document_path)}>
          <ExternalLink className="mr-2 h-4 w-4" /> Open ID document
        </Button>
        <div>
          <label className="text-xs text-muted-foreground">Discount %</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Note (optional)</label>
          <Textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="bg-gradient-primary"
          onClick={() => onReview({ id: v.id, status: "approved", discount_percent: pct, reviewer_notes: notes || undefined })}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReview({ id: v.id, status: "rejected", reviewer_notes: notes || undefined })}
        >
          Reject
        </Button>
      </div>
    </li>
  );
}
