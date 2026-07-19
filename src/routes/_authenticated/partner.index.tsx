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
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-clay">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold">{org.trading_name ?? org.legal_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                {org.primary_category.replaceAll("_", " ")} · {org.city ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant={org.verified ? "default" : "outline"} className="gap-1">
              {org.verified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {org.verified ? "Verified" : "Not verified"}
            </Badge>
            <Badge variant="outline" className="capitalize">{org.status}</Badge>
            {link?.is_admin && <Badge variant="secondary">Admin</Badge>}
          </div>
        </div>
      </header>


      <Tabs defaultValue="cases">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="cases">Assigned cases</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="profile">Organisation profile</TabsTrigger>
        </TabsList>
        <TabsContent value="cases" className="mt-4">
          <PartnerCases orgId={org.id} />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <PartnerServices orgId={org.id} isAdmin={!!link?.is_admin} />
        </TabsContent>
        <TabsContent value="coverage" className="mt-4">
          <PartnerCoverage orgId={org.id} isAdmin={!!link?.is_admin} />
        </TabsContent>
        <TabsContent value="availability" className="mt-4">
          <PartnerAvailability orgId={org.id} isAdmin={!!link?.is_admin} />
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

const CATEGORIES = [
  "funeral_director","lawyer","translator","religious_org","hospital","airline","driving_school","childcare","relocation","other",
] as const;
const TRANSLATOR_TYPES = [
  "general","interpreting","certified","sworn","medical","authority_appointment","urgent_phone",
] as const;
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function PartnerServices({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["partner","cats",orgId], queryFn: () => listPartnerCategories({ data: { orgId } }) });
  const add = useServerFn(addPartnerCategory);
  const update = useServerFn(updatePartnerCategory);
  const remove = useServerFn(removePartnerCategory);

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("lawyer");
  const [tType, setTType] = useState<(typeof TRANSLATOR_TYPES)[number]>("general");
  const [courtInput, setCourtInput] = useState<Record<string, string>>({});

  const addMut = useMutation({
    mutationFn: () => add({ data: { orgId, category, translatorServiceType: category === "translator" ? tType : undefined } }),
    onSuccess: () => { toast.success("Added"); qc.invalidateQueries({ queryKey: ["partner","cats",orgId] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const rmMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["partner","cats",orgId] }); },
  });
  const updMut = useMutation({
    mutationFn: (v: { id: string; active?: boolean; swornCourts?: string[]; translatorServiceType?: (typeof TRANSLATOR_TYPES)[number] | null }) =>
      update({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["partner","cats",orgId] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add a service</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replaceAll("_"," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {category === "translator" && (
              <div>
                <Label className="text-xs">Translator service type</Label>
                <Select value={tType} onValueChange={(v) => setTType(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRANSLATOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replaceAll("_"," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending}>
                <Plus className="h-4 w-4 mr-1"/> Add service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Registered services</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
           (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No services registered yet.</p> :
           (list.data ?? []).map((r: any) => (
            <div key={r.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{r.category.replaceAll("_"," ")}
                    {r.translator_service_type && <span className="text-muted-foreground"> · {r.translator_service_type.replaceAll("_"," ")}</span>}
                  </div>
                  {r.category === "translator" && r.translator_service_type === "sworn" && (
                    <div className="text-xs text-muted-foreground">
                      Sworn courts: {r.sworn_courts?.length ? r.sworn_courts.join(", ") : "none listed"}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Switch checked={r.active} onCheckedChange={(v) => isAdmin && updMut.mutate({ id: r.id, active: v })} disabled={!isAdmin}/>
                    <span className="text-xs">{r.active ? "Active" : "Off"}</span>
                  </div>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" onClick={() => rmMut.mutate(r.id)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  )}
                </div>
              </div>
              {isAdmin && r.category === "translator" && r.translator_service_type === "sworn" && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add court (e.g. LG Berlin)"
                    value={courtInput[r.id] ?? ""}
                    onChange={(e) => setCourtInput(s => ({ ...s, [r.id]: e.target.value }))}
                    className="h-8"
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    const v = (courtInput[r.id] ?? "").trim();
                    if (!v) return;
                    updMut.mutate({ id: r.id, swornCourts: [...(r.sworn_courts ?? []), v] });
                    setCourtInput(s => ({ ...s, [r.id]: "" }));
                  }}>Add</Button>
                  {(r.sworn_courts ?? []).map((c: string) => (
                    <Badge key={c} variant="outline" className="cursor-pointer" onClick={() =>
                      updMut.mutate({ id: r.id, swornCourts: (r.sworn_courts ?? []).filter((x: string) => x !== c) })
                    }>{c} ✕</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerCoverage({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["partner","regions",orgId], queryFn: () => listPartnerRegions({ data: { orgId } }) });
  const add = useServerFn(addPartnerRegion);
  const remove = useServerFn(removePartnerRegion);
  const [city, setCity] = useState("");
  const [bundesland, setBundesland] = useState("");
  const [postalPrefix, setPostalPrefix] = useState("");
  const [radius, setRadius] = useState("");

  const addMut = useMutation({
    mutationFn: () => add({ data: { orgId, city: city || undefined, bundesland: bundesland || undefined, postalPrefix: postalPrefix || undefined, radiusKm: radius ? Number(radius) : undefined } }),
    onSuccess: () => { toast.success("Region added"); qc.invalidateQueries({ queryKey: ["partner","regions",orgId] }); setCity(""); setBundesland(""); setPostalPrefix(""); setRadius(""); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const rmMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner","regions",orgId] }),
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4"/> Add coverage area</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div><Label className="text-xs">City</Label><Input value={city} onChange={e => setCity(e.target.value)} className="mt-1"/></div>
            <div><Label className="text-xs">Bundesland</Label><Input value={bundesland} onChange={e => setBundesland(e.target.value)} className="mt-1"/></div>
            <div><Label className="text-xs">PLZ prefix</Label><Input value={postalPrefix} onChange={e => setPostalPrefix(e.target.value)} placeholder="e.g. 10" className="mt-1"/></div>
            <div><Label className="text-xs">Radius (km)</Label><Input type="number" value={radius} onChange={e => setRadius(e.target.value)} className="mt-1"/></div>
            <div className="md:col-span-4">
              <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending}><Plus className="h-4 w-4 mr-1"/> Add area</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Coverage areas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
           (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No coverage areas yet.</p> :
           (list.data ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="text-sm">
                <div className="font-medium">{[r.city, r.bundesland].filter(Boolean).join(", ") || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {r.postal_prefix ? `PLZ ${r.postal_prefix}*` : ""} {r.radius_km ? ` · ${r.radius_km} km radius` : ""}
                </div>
              </div>
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => rmMut.mutate(r.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive"/></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerAvailability({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["partner","avail",orgId], queryFn: () => listPartnerAvailability({ data: { orgId } }) });
  const add = useServerFn(addPartnerAvailability);
  const remove = useServerFn(removePartnerAvailability);
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [urgent, setUrgent] = useState(false);

  const addMut = useMutation({
    mutationFn: () => add({ data: { orgId, weekday: Number(weekday), startTime: start, endTime: end, acceptsUrgent: urgent } }),
    onSuccess: () => { toast.success("Slot added"); qc.invalidateQueries({ queryKey: ["partner","avail",orgId] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const rmMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner","avail",orgId] }),
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4"/> Add weekly slot</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <div>
              <Label className="text-xs">Day</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                <SelectContent>{WEEKDAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Start</Label><Input type="time" value={start} onChange={e => setStart(e.target.value)} className="mt-1"/></div>
            <div><Label className="text-xs">End</Label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} className="mt-1"/></div>
            <div className="flex items-end gap-2">
              <Switch checked={urgent} onCheckedChange={setUrgent}/>
              <span className="text-xs">Accepts urgent</span>
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending}><Plus className="h-4 w-4 mr-1"/> Add slot</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Weekly availability</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
           (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No availability slots yet.</p> :
           (list.data ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <span className="font-medium">{WEEKDAYS[r.weekday]}</span>{" "}
                <span className="text-muted-foreground">{r.start_time}–{r.end_time}</span>
                {r.accepts_urgent && <Badge className="ml-2" variant="outline">Urgent OK</Badge>}
              </div>
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => rmMut.mutate(r.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive"/></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
