import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Clock, FileText, MapPin, Plus, Trash2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

import {
  getMyPartnerOrg,
  listMyPartnerCases,
  listMyPartnerDocuments,
  respondToCaseInvitation,
} from "@/lib/partner.functions";
import { recordPartnerDocument, deletePartnerDocument } from "@/lib/partner-docs.functions";
import {
  listPartnerCategories,
  addPartnerCategory,
  updatePartnerCategory,
  removePartnerCategory,
  listPartnerRegions,
  addPartnerRegion,
  removePartnerRegion,
  listPartnerAvailability,
  addPartnerAvailability,
  removePartnerAvailability,
} from "@/lib/partner-editors.functions";

const orgQ = queryOptions({ queryKey: ["partner", "me"], queryFn: () => getMyPartnerOrg() });

export const Route = createFileRoute("/_authenticated/partner/")({
  head: () => ({ meta: [{ title: "Partner Portal — BeistandPlus" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(orgQ),
  component: PartnerHome,
  errorComponent: ({ error }) => (
    <div className="p-6 flex items-center gap-2 text-destructive">
      <AlertTriangle className="h-5 w-5" /> {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function PartnerHome() {
  const { data } = useSuspenseQuery(orgQ);

  if (!data?.org) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Alert>
          <AlertTitle>No partner organisation linked</AlertTitle>
          <AlertDescription>
            Your account is not linked to a partner organisation yet. Ask your BeistandPlus contact to send you an
            invitation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const org = data.org;
  const link = data.link;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display-lg font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> {org.trading_name ?? org.legal_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {org.primary_category.replaceAll("_", " ")} · {org.city ?? "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <Badge variant={org.verified ? "default" : "outline"}>{org.verified ? "Verified" : "Not verified"}</Badge>
          <Badge variant="outline">{org.status}</Badge>
          {link?.is_admin && <Badge variant="secondary">Admin</Badge>}
        </div>
      </header>

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Assigned cases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="profile">Organisation profile</TabsTrigger>
        </TabsList>
        <TabsContent value="cases" className="mt-4">
          <PartnerCases orgId={org.id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <PartnerDocs orgId={org.id} isAdmin={!!link?.is_admin} />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <ProfileCard org={org} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PartnerCases({ orgId }: { orgId: string }) {
  const casesQ = queryOptions({
    queryKey: ["partner", "cases", orgId],
    queryFn: () => listMyPartnerCases({ data: { orgId } }),
  });
  const { data } = useSuspenseQuery(casesQ);
  const qc = useQueryClient();
  const respond = useServerFn(respondToCaseInvitation);

  const mut = useMutation({
    mutationFn: (v: { id: string; response: "accept" | "decline"; reason?: string }) =>
      respond({ data: { assignmentId: v.id, response: v.response, declineReason: v.reason } }),
    onSuccess: () => {
      toast.success("Response recorded");
      qc.invalidateQueries({ queryKey: ["partner", "cases", orgId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (data.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No cases assigned yet.</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((a: any) => (
        <Card key={a.id}>
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{a.cases?.title ?? "(case)"}</div>
              <div className="text-xs text-muted-foreground">
                Role: {a.role ?? "—"} · Stage: {a.cases?.current_stage ?? "—"} · Priority:{" "}
                {a.cases?.priority ?? "—"}
              </div>
              <div className="text-xs">Status: {a.status}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!a.accepted_at && !a.declined_at && (
                <>
                  <Button size="sm" onClick={() => mut.mutate({ id: a.id, response: "accept" })}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mut.mutate({ id: a.id, response: "decline", reason: "Not available" })}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PartnerDocs({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const docsQ = queryOptions({
    queryKey: ["partner", "docs", orgId],
    queryFn: () => listMyPartnerDocuments({ data: { orgId } }),
  });
  const { data } = useSuspenseQuery(docsQ);
  const qc = useQueryClient();
  const record = useServerFn(recordPartnerDocument);
  const remove = useServerFn(deletePartnerDocument);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<
    "licence" | "insurance" | "registration" | "bank_details" | "vat" | "gdpr" | "other"
  >("licence");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Document removed");
      qc.invalidateQueries({ queryKey: ["partner", "docs", orgId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Choose a file");
    if (!title.trim()) return toast.error("Enter a title");
    if (file.size > 25 * 1024 * 1024) return toast.error("File too large (max 25 MB)");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${orgId}/${category}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("partner-docs").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
      });
      if (upErr) throw upErr;
      await record({
        data: {
          orgId,
          category,
          title: title.trim(),
          storagePath: path,
          validUntil: validUntil || undefined,
        },
      });
      toast.success("Uploaded — awaiting review");
      setTitle("");
      setValidUntil("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["partner", "docs", orgId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload compliance document
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="licence">Licence</SelectItem>
                  <SelectItem value="insurance">Insurance certificate</SelectItem>
                  <SelectItem value="registration">Business registration</SelectItem>
                  <SelectItem value="bank_details">Bank details</SelectItem>
                  <SelectItem value="vat">VAT / tax</SelectItem>
                  <SelectItem value="gdpr">GDPR / DPA</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Berufshaftpflicht 2026" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Valid until (optional)</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">File (PDF/image, max 25 MB)</Label>
              <Input ref={fileRef} type="file" accept="application/pdf,image/*" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleUpload} disabled={uploading} size="sm">
                <Upload className="h-4 w-4 mr-1" /> {uploading ? "Uploading…" : "Upload document"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Compliance documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet. Upload licence, insurance certificate, bank details, and registration.
            </p>
          ) : (
            data.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.category} · {d.valid_from ?? "—"} → {d.valid_until ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{d.status}</Badge>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMut.mutate(d.id)}
                      disabled={deleteMut.isPending}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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

function ProfileCard({ org }: { org: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organisation profile</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Field label="Legal name" value={org.legal_name} />
        <Field label="Trading name" value={org.trading_name} />
        <Field label="Category" value={org.primary_category?.replaceAll("_", " ")} />
        <Field label="Registration no." value={org.registration_no} />
        <Field label="VAT no." value={org.vat_no} />
        <Field label="Contact email" value={org.contact_email} />
        <Field label="Contact phone" value={org.contact_phone} />
        <Field label="City" value={org.city} />
        <Field label="Bundesland" value={org.bundesland} />
        <Field label="Website" value={org.website} />
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value ?? ""} readOnly className="mt-1" />
    </div>
  );
}
