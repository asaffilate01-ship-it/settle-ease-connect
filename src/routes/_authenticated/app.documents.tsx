import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Upload,
  Download,
  AlertTriangle,
  ShieldCheck,
  Lock,
  UserPlus,
  Trash2,
  Users,
  ScrollText,
  KeyRound,
} from "lucide-react";
import {
  VAULT_CATEGORIES,
  SENSITIVE_CATEGORIES,
  type VaultCategory,
  listVaultDocuments,
  createVaultDocument,
  deleteVaultDocument,
  getVaultDownloadUrl,
  listVaultDeputies,
  inviteVaultDeputy,
  revokeVaultDeputy,
  listVaultUnlockRequests,
  listVaultAccessLog,
} from "@/lib/vault.functions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Aal2Gate } from "@/components/security/aal2-gate";

export const Route = createFileRoute("/_authenticated/app/documents")({
  head: () => ({
    meta: [
      { title: "Secure vault — BeistandPlus" },
      {
        name: "description",
        content:
          "Encrypted document vault with MFA, GDPR compliance, and second-person access on death or incapacity.",
      },
    ],
  }),
  component: VaultPage,
});

const CATEGORY_LABELS: Record<VaultCategory, string> = {
  passport: "Passport",
  visa: "Visa",
  residence_card: "Residence card",
  national_id: "National ID",
  birth_cert: "Birth certificate",
  marriage_cert: "Marriage certificate",
  death_cert: "Death certificate",
  divorce_cert: "Divorce certificate",
  driving_licence: "Driving licence",
  vehicle_docs: "Vehicle documents",
  bank_details: "Bank details",
  insurance: "Insurance",
  tax: "Tax",
  benefits: "Benefits",
  social_security: "Social security",
  medical: "Medical",
  education: "Education",
  employment: "Employment",
  property: "Property",
  rental: "Rental",
  will_testament: "Will & testament",
  power_of_attorney: "Power of attorney",
  advance_directive: "Advance directive",
  other: "Other",
};

function VaultPage() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  const listDocs = useServerFn(listVaultDocuments);
  const listDeps = useServerFn(listVaultDeputies);
  const listReqs = useServerFn(listVaultUnlockRequests);
  const listLog = useServerFn(listVaultAccessLog);

  const docsQ = useQuery({ queryKey: ["vault", "docs"], queryFn: () => listDocs() });
  const depsQ = useQuery({ queryKey: ["vault", "deps"], queryFn: () => listDeps() });
  const reqsQ = useQuery({ queryKey: ["vault", "reqs"], queryFn: () => listReqs() });
  const logQ = useQuery({ queryKey: ["vault", "log"], queryFn: () => listLog() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["vault"] });

  const docs = docsQ.data ?? [];
  const now = new Date();
  const expiringSoon = docs.filter((d) => {
    if (!d.expiry_date) return false;
    const days = (new Date(d.expiry_date).getTime() - now.getTime()) / 86400000;
    return days > 0 && days <= 90;
  });
  const totalBytes = docs.reduce((s, d) => s + (d.file_size ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg font-semibold">Secure vault</h1>
          <p className="text-sm text-muted-foreground">
            Encrypted, MFA-gated, GDPR-first — with second-person access if life takes a turn.
          </p>
        </div>
        <UploadDialog userId={user?.id} onDone={invalidate} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Documents stored"
          value={String(docs.length)}
          icon={<FileText className="h-4 w-4" />}
        />
        <Stat
          label="Expiring in 90 days"
          value={String(expiringSoon.length)}
          tone={expiringSoon.length > 0 ? "warning" : undefined}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <Stat
          label="Vault used"
          value={formatBytes(totalBytes)}
          icon={<Lock className="h-4 w-4" />}
        />
        <Stat
          label="Deputies active"
          value={String((depsQ.data ?? []).filter((d) => d.status === "accepted").length)}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <SecurityCard />

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">
            <FileText className="mr-1 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="deputies">
            <Users className="mr-1 h-4 w-4" />
            Deputies
          </TabsTrigger>
          <TabsTrigger value="unlock">
            <KeyRound className="mr-1 h-4 w-4" />
            Unlock requests
          </TabsTrigger>
          <TabsTrigger value="log">
            <ScrollText className="mr-1 h-4 w-4" />
            Access log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTable rows={docs} loading={docsQ.isLoading} onChanged={invalidate} />
        </TabsContent>

        <TabsContent value="deputies" className="mt-6">
          <DeputiesTab rows={depsQ.data ?? []} loading={depsQ.isLoading} onChanged={invalidate} />
        </TabsContent>

        <TabsContent value="unlock" className="mt-6">
          <Aal2Gate reason="Vault unlock requests handle end-of-life records. Confirm your authenticator code to continue.">
            <UnlockRequestsTab rows={reqsQ.data ?? []} loading={reqsQ.isLoading} />
          </Aal2Gate>
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <AccessLogTab rows={logQ.data ?? []} loading={logQ.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Security / MFA card ----------

function SecurityCard() {
  const [factors, setFactors] = useState<{ verified: number; unverified: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useMemo(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (!data) return;
      const v = data.totp?.filter((f) => (f.status as string) === "verified").length ?? 0;
      const u = data.totp?.filter((f) => (f.status as string) === "unverified").length ?? 0;
      setFactors({ verified: v, unverified: u });
    });
  }, []);

  async function enrolTotp() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      const qr = data.totp.qr_code;
      const secret = data.totp.secret;
      const w = window.open("", "_blank", "width=420,height=560");
      if (w) {
        w.document.write(`<html><head><title>Set up MFA</title></head>
          <body style="font-family:system-ui;padding:24px;text-align:center">
            <h2>Scan with your authenticator app</h2>
            <img src="${qr}" style="max-width:280px" />
            <p>Or enter this secret manually:</p>
            <code style="user-select:all;background:#f4f4f4;padding:8px 12px;border-radius:6px">${secret}</code>
            <p style="color:#666;margin-top:16px">Then return to BeistandPlus and enter the 6-digit code.</p>
          </body></html>`);
      }
      const code = window.prompt("Enter the 6-digit code from your authenticator app:");
      if (!code) return;
      const chal = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (chal.error) throw chal.error;
      const verify = await supabase.auth.mfa.verify({
        factorId: data.id,
        challengeId: chal.data.id,
        code,
      });
      if (verify.error) throw verify.error;
      toast.success("MFA enabled — sensitive documents are now protected.");
      const { data: refreshed } = await supabase.auth.mfa.listFactors();
      const v = refreshed?.totp?.filter((f) => (f.status as string) === "verified").length ?? 0;
      const u = refreshed?.totp?.filter((f) => (f.status as string) === "unverified").length ?? 0;
      setFactors({ verified: v, unverified: u });
    } catch (e: any) {
      toast.error(e.message ?? "Could not enable MFA");
    } finally {
      setBusy(false);
    }
  }

  const enabled = (factors?.verified ?? 0) > 0;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${enabled ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/10"}`}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck
          className={`mt-0.5 h-5 w-5 ${enabled ? "text-success-foreground" : "text-warning-foreground"}`}
        />
        <div className="flex-1">
          <div className="font-medium">
            {enabled
              ? "MFA is on — sensitive documents are protected"
              : "MFA is off — sensitive documents will be blocked"}
          </div>
          <p className="text-sm text-muted-foreground">
            Bank details, tax, benefits, medical, wills and power-of-attorney documents require a
            second factor before download.
          </p>
        </div>
        {!enabled && (
          <Button size="sm" onClick={enrolTotp} disabled={busy}>
            {busy ? "…" : "Enable MFA"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------- Upload ----------

function UploadDialog({ userId, onDone }: { userId?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<VaultCategory>("passport");
  const [label, setLabel] = useState("");
  const [issuer, setIssuer] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [country, setCountry] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const create = useServerFn(createVaultDocument);

  async function submit() {
    if (!userId) return;
    if (!label.trim()) {
      toast.error("Give the document a name.");
      return;
    }
    setUploading(true);
    try {
      const id = crypto.randomUUID();
      const file = fileRef.current?.files?.[0];
      let storage_path: string | null = null;
      let file_name: string | null = null;
      let mime_type: string | null = null;
      let file_size: number | null = null;
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        storage_path = `${userId}/${id}/${safe}`;
        const up = await supabase.storage.from("vault").upload(storage_path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
        if (up.error) throw up.error;
        file_name = file.name;
        mime_type = file.type;
        file_size = file.size;
      }
      await create({
        data: {
          id,
          category,
          label: label.trim(),
          issuer: issuer || null,
          document_number: docNumber || null,
          country: country || null,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
          notes: notes || null,
          storage_path,
          file_name,
          mime_type,
          file_size,
        },
      });
      toast.success("Saved to vault.");
      setOpen(false);
      setLabel("");
      setIssuer("");
      setDocNumber("");
      setCountry("");
      setIssueDate("");
      setExpiryDate("");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary">
          <Upload className="mr-1 h-4 w-4" /> Add document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to your vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VaultCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {VAULT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                    {SENSITIVE_CATEGORIES.includes(c) && (
                      <Lock className="ml-2 inline h-3 w-3 text-warning-foreground" />
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. UK Passport (Anna)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issuer</Label>
              <Input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="HMPO, Ausländerbehörde…"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="DE, UK…"
              />
            </div>
          </div>
          <div>
            <Label>Document number</Label>
            <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issue date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label>Expiry date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>File</Label>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              capture="environment"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              On a phone, you can photograph the document with the rear camera.
            </p>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={uploading} className="bg-gradient-primary">
            {uploading ? "Saving…" : "Save to vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Documents table ----------

function DocumentsTable({
  rows,
  loading,
  onChanged,
}: {
  rows: any[];
  loading: boolean;
  onChanged: () => void;
}) {
  const getUrl = useServerFn(getVaultDownloadUrl);
  const del = useServerFn(deleteVaultDocument);

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      onChanged();
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  async function download(id: string, sensitive: boolean) {
    if (sensitive) {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (data?.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp?.find((f) => (f.status as string) === "verified");
        if (!factor) {
          toast.error("Enable MFA above to open sensitive documents.");
          return;
        }
        const code = window.prompt("Sensitive document — enter your 6-digit MFA code:");
        if (!code) return;
        const chal = await supabase.auth.mfa.challenge({ factorId: factor.id });
        if (chal.error) {
          toast.error(chal.error.message);
          return;
        }
        const v = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: chal.data.id,
          code,
        });
        if (v.error) {
          toast.error(v.error.message);
          return;
        }
      }
    }
    try {
      const { url } = await getUrl({ data: { id } });
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e.message ?? "Could not open document");
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Your vault is empty. Add your first document above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left">Document</th>
            <th className="px-5 py-3 text-left">Category</th>
            <th className="px-5 py-3 text-left">Expires</th>
            <th className="px-5 py-3 text-left">Size</th>
            <th className="px-5 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((d) => {
            const cat = d.category as VaultCategory;
            const sensitive = d.is_sensitive || SENSITIVE_CATEGORIES.includes(cat);
            const exp = d.expiry_date ? new Date(d.expiry_date) : null;
            const days = exp ? (exp.getTime() - Date.now()) / 86400000 : null;
            const expiringSoon = days !== null && days > 0 && days <= 90;
            const expired = days !== null && days <= 0;
            return (
              <tr key={d.id} className="hover:bg-parchment/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                      {sensitive ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{d.label}</div>
                      {d.issuer && (
                        <div className="text-xs text-muted-foreground">
                          {d.issuer}
                          {d.country ? ` · ${d.country}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{CATEGORY_LABELS[cat] ?? cat}</td>
                <td className="px-5 py-4">
                  {d.expiry_date ? (
                    <span className="inline-flex items-center gap-2">
                      {d.expiry_date}
                      {expired && (
                        <Badge className="bg-destructive/20 text-destructive border border-destructive/40">
                          Expired
                        </Badge>
                      )}
                      {expiringSoon && (
                        <Badge className="bg-warning/20 text-warning-foreground border border-warning/40">
                          Soon
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {d.file_size ? formatBytes(d.file_size) : "—"}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {d.storage_path && (
                      <Button variant="ghost" size="sm" onClick={() => download(d.id, sensitive)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete "${d.label}"? This cannot be undone.`))
                          delMut.mutate(d.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Deputies tab ----------

function DeputiesTab({
  rows,
  loading,
  onChanged,
}: {
  rows: any[];
  loading: boolean;
  onChanged: () => void;
}) {
  const revoke = useServerFn(revokeVaultDeputy);
  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      toast.success("Deputy revoked");
      onChanged();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Nominate trusted people who can access parts of your vault — either right away, or only
          after we've verified an incapacity or death event. You control exactly which categories
          each deputy can see.
        </p>
        <InviteDeputyDialog onDone={onChanged} />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No deputies yet. Nominate a spouse, lawyer, or trusted family member.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{d.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.invite_email}
                    {d.relationship ? ` · ${d.relationship}` : ""}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Access:</span>{" "}
                  {accessRuleLabel(d.access_rule)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Verification:</span>{" "}
                  {d.verification_method === "case_manager"
                    ? "Beistand case manager"
                    : `${d.min_confirmations} co-deputies confirm`}
                </div>
                <div>
                  <span className="font-medium text-foreground">Can see:</span>{" "}
                  {d.allowed_categories?.length
                    ? d.allowed_categories
                        .map((c: string) => CATEGORY_LABELS[c as VaultCategory] ?? c)
                        .join(", ")
                    : "—"}
                </div>
                {d.access_granted && (
                  <div className="text-success-foreground font-medium">
                    Access currently granted
                  </div>
                )}
              </dl>
              {d.status !== "revoked" && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Revoke ${d.full_name}'s access?`)) revokeMut.mutate(d.id);
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteDeputyDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [accessRule, setAccessRule] = useState<"immediate" | "on_incapacity" | "on_death">(
    "on_death",
  );
  const [verificationMethod, setVerificationMethod] = useState<"case_manager" | "multi_deputy">(
    "case_manager",
  );
  const [minConfirmations, setMinConfirmations] = useState(2);
  const [cats, setCats] = useState<Set<string>>(new Set());
  const invite = useServerFn(inviteVaultDeputy);

  function toggle(c: string) {
    const s = new Set(cats);
    if (s.has(c)) s.delete(c);
    else s.add(c);
    setCats(s);
  }
  const allChecked = cats.has("all");

  async function submit() {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    if (cats.size === 0) {
      toast.error("Choose at least one category (or 'All').");
      return;
    }
    try {
      await invite({
        data: {
          full_name: fullName.trim(),
          invite_email: email.trim().toLowerCase(),
          relationship: relationship || null,
          phone: phone || null,
          access_rule: accessRule,
          verification_method: verificationMethod,
          min_confirmations: verificationMethod === "multi_deputy" ? minConfirmations : 2,
          allowed_categories: Array.from(cats),
        },
      });
      toast.success(`Invited ${fullName}.`);
      setOpen(false);
      setFullName("");
      setEmail("");
      setRelationship("");
      setPhone("");
      setAccessRule("on_death");
      setVerificationMethod("case_manager");
      setMinConfirmations(2);
      setCats(new Set());
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Invite failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-1 h-4 w-4" />
          Nominate deputy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nominate a deputy</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Relationship</Label>
              <Input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Spouse, sibling…"
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label>When can they access?</Label>
            <Select value={accessRule} onValueChange={(v) => setAccessRule(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediately (e.g. spouse)</SelectItem>
                <SelectItem value="on_incapacity">Only if I'm incapacitated</SelectItem>
                <SelectItem value="on_death">Only after my death</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accessRule !== "immediate" && (
            <>
              <div>
                <Label>How is the event verified?</Label>
                <Select
                  value={verificationMethod}
                  onValueChange={(v) => setVerificationMethod(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="case_manager">
                      Beistand case manager (upload certificate)
                    </SelectItem>
                    <SelectItem value="multi_deputy">Multiple deputies confirm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {verificationMethod === "multi_deputy" && (
                <div>
                  <Label>Minimum co-deputies to confirm</Label>
                  <Input
                    type="number"
                    min={2}
                    max={10}
                    value={minConfirmations}
                    onChange={(e) => setMinConfirmations(parseInt(e.target.value || "2"))}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Which categories can they see?</Label>
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={allChecked} onCheckedChange={() => toggle("all")} />
                <span className="font-medium">All categories</span>
              </label>
              {!allChecked && (
                <div className="grid grid-cols-2 gap-1 pl-1 pt-1 max-h-40 overflow-y-auto rounded border border-border/40 p-2">
                  {VAULT_CATEGORIES.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-xs">
                      <Checkbox checked={cats.has(c)} onCheckedChange={() => toggle(c)} />
                      {CATEGORY_LABELS[c]}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="bg-gradient-primary">
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Unlock requests / Log ----------

function UnlockRequestsTab({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
        <KeyRound className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No unlock requests. Deputies can open a request from their own dashboard when the time
          comes.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4"
        >
          <div>
            <div className="font-medium capitalize">
              {r.event_type} — via{" "}
              {r.verification_method === "case_manager" ? "case manager" : "co-deputy confirmation"}
            </div>
            <div className="text-xs text-muted-foreground">
              Opened {new Date(r.created_at).toLocaleString()}
            </div>
          </div>
          <StatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}

function AccessLogTab({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No activity yet.</div>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left">When</th>
            <th className="px-5 py-3 text-left">Action</th>
            <th className="px-5 py-3 text-left">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="px-5 py-3 text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </td>
              <td className="px-5 py-3 capitalize">{e.action.replace(/_/g, " ")}</td>
              <td className="px-5 py-3 text-muted-foreground">{e.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- helpers ----------

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "warning";
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${tone === "warning" ? "border-warning/40 bg-warning/10" : "border-border/60 bg-card"}`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/20 text-warning-foreground border-warning/40",
    accepted: "bg-success/20 text-success-foreground border-success/40",
    declined: "bg-muted text-muted-foreground border-border",
    revoked: "bg-destructive/20 text-destructive border-destructive/40",
    verified: "bg-success/20 text-success-foreground border-success/40",
    rejected: "bg-destructive/20 text-destructive border-destructive/40",
    cancelled: "bg-muted text-muted-foreground border-border",
  };
  return <Badge className={`border capitalize ${map[status] ?? "bg-muted"}`}>{status}</Badge>;
}

function accessRuleLabel(r: string) {
  return r === "immediate" ? "Immediate" : r === "on_incapacity" ? "On incapacity" : "On death";
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
