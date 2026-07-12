import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, Upload, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyStudentVerification,
  signStudentIdUpload,
  submitStudentVerification,
} from "@/lib/students.functions";

export const Route = createFileRoute("/_authenticated/app/student-discount")({
  head: () => ({ meta: [{ title: "Student discount — BeistandPlus" }] }),
  component: StudentDiscountPage,
});

type Verification = Awaited<ReturnType<typeof getMyStudentVerification>>;

function StudentDiscountPage() {
  const getMine = useServerFn(getMyStudentVerification);
  const signUpload = useServerFn(signStudentIdUpload);
  const submit = useServerFn(submitStudentVerification);

  const [existing, setExisting] = useState<Verification>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [form, setForm] = useState({
    university: "",
    country: "",
    student_id_number: "",
    valid_until: "",
  });

  useEffect(() => {
    getMine().then((v) => {
      setExisting(v);
      setLoading(false);
    });
  }, [getMine]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { path, token } = await signUpload({ data: { filename: file.name } });
      const { error } = await supabase.storage.from("vault").uploadToSignedUrl(path, token, file);
      if (error) throw new Error(error.message);
      setDocumentPath(path);
      toast.success("Document uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentPath) return toast.error("Please upload your student ID first");
    if (!form.university) return toast.error("Please enter your university");
    setSubmitting(true);
    try {
      const row = await submit({
        data: {
          university: form.university,
          country: form.country || undefined,
          student_id_number: form.student_id_number || undefined,
          id_document_path: documentPath,
          valid_until: form.valid_until || undefined,
        },
      });
      setExisting(row);
      toast.success("Sent for review — we'll confirm within 24 hours");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <GraduationCap className="h-4 w-4" /> Student discount
        </div>
        <h1 className="display-lg mt-1 font-semibold">Verify your student status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a valid student ID or enrolment certificate. Once approved, 30% is deducted from any plan for as long as
          your status is valid.
        </p>
      </header>

      {existing && existing.status !== "expired" && (
        <StatusCard v={existing} />
      )}

      {(!existing || existing.status === "expired" || existing.status === "rejected") && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="university">University *</Label>
              <Input
                id="university"
                required
                placeholder="TU Berlin, LMU München…"
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="country">Country of study</Label>
              <Input
                id="country"
                placeholder="Germany"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="student_id_number">Student / matriculation number</Label>
              <Input
                id="student_id_number"
                value={form.student_id_number}
                onChange={(e) => setForm({ ...form, student_id_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="valid_until">Valid until</Label>
              <Input
                id="valid_until"
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Student ID or enrolment certificate *</Label>
            <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-parchment/40 p-6 text-sm hover:bg-parchment/60">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : documentPath ? (
                <>
                  <BadgeCheck className="h-4 w-4 text-success" /> Uploaded — click to replace
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Choose a PDF or image (max 10MB)
                </>
              )}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={onFile} />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Stored encrypted in your private vault — only reviewed by our verification team.
            </p>
          </div>

          <Button type="submit" disabled={submitting || uploading} className="bg-gradient-primary">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit for review
          </Button>
        </form>
      )}
    </div>
  );
}

function StatusCard({ v }: { v: NonNullable<Verification> }) {
  const tone =
    v.status === "approved" ? "border-success/40 bg-success/10" :
    v.status === "rejected" ? "border-destructive/40 bg-destructive/10" :
    "border-border/60 bg-parchment/50";
  return (
    <div className={`rounded-2xl border p-6 ${tone}`}>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
        <ShieldCheck className="h-4 w-4" /> Status: {v.status}
      </div>
      <div className="mt-2 text-sm">
        <div><span className="text-muted-foreground">University:</span> {v.university}</div>
        {v.valid_until && <div><span className="text-muted-foreground">Valid until:</span> {new Date(v.valid_until).toLocaleDateString()}</div>}
        {v.status === "approved" && (
          <div className="mt-2 font-semibold text-success">
            {v.discount_percent}% discount active on your BeistandPlus membership.
          </div>
        )}
        {v.reviewer_notes && (
          <div className="mt-2 rounded-lg border border-border/60 bg-card p-3 text-xs">
            <div className="font-semibold">Reviewer note</div>
            <div className="mt-1 text-muted-foreground">{v.reviewer_notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Textarea kept imported for future note field.
void Textarea;
