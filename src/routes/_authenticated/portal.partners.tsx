import { createFileRoute } from "@tanstack/react-router";
import {
  queryOptions,
  useSuspenseQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Plus, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { listPartnerOrgs, createPartnerOrg, setPartnerOrgStatus } from "@/lib/partner.functions";
import {
  listPartnerDocsPendingReview,
  reviewPartnerDocument,
} from "@/lib/partner-editors.functions";

const CATEGORIES = [
  "funeral_director",
  "lawyer",
  "translator",
  "religious_org",
  "hospital",
  "airline",
  "driving_school",
  "childcare",
  "relocation",
  "other",
] as const;

const orgsQ = queryOptions({ queryKey: ["portal", "partners"], queryFn: () => listPartnerOrgs() });

export const Route = createFileRoute("/_authenticated/portal/partners")({
  head: () => ({ meta: [{ title: "Partner Organisations — BeistandPlus" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(orgsQ),
  component: PartnersAdmin,
  errorComponent: ({ error }) => (
    <div className="p-6 flex items-center gap-2 text-destructive">
      <AlertTriangle className="h-5 w-5" /> {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function PartnersAdmin() {
  const { data: orgs } = useSuspenseQuery(orgsQ);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display-lg font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Partner organisations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage funeral directors, lawyers, translators, and other service providers.
          </p>
        </div>
        <NewOrgDialog />
      </header>

      <VerificationQueue />

      <Card>
        <CardContent className="p-0">
          {orgs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No partner organisations yet.</p>
          ) : (
            <div className="divide-y">
              {orgs.map((o) => (
                <OrgRow key={o.id} org={o} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VerificationQueue() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["portal", "partners", "doc-queue"],
    queryFn: () => listPartnerDocsPendingReview(),
  });
  const review = useServerFn(reviewPartnerDocument);
  const mut = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected"; notes?: string }) =>
      review({ data: v }),
    onSuccess: () => {
      toast.success("Reviewed");
      qc.invalidateQueries({ queryKey: ["portal", "partners", "doc-queue"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const rows = q.data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Compliance documents awaiting review
          <Badge variant="outline">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing pending.</p>
        ) : (
          rows.map((d: any) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-md border p-3 gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {d.partner_organisations?.trading_name ??
                    d.partner_organisations?.legal_name ??
                    d.org_id}
                  {" · "}
                  {d.category}
                  {d.valid_until ? ` · valid to ${d.valid_until}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{d.status}</Badge>
                <Button size="sm" onClick={() => mut.mutate({ id: d.id, decision: "approved" })}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const reason = window.prompt("Reason for rejection (optional):") ?? undefined;
                    mut.mutate({ id: d.id, decision: "rejected", notes: reason || undefined });
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function OrgRow({ org }: { org: any }) {
  const qc = useQueryClient();
  const setStatus = useServerFn(setPartnerOrgStatus);
  const mut = useMutation({
    mutationFn: (v: { status: any; verified?: boolean }) =>
      setStatus({ data: { id: org.id, status: v.status, verified: v.verified } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["portal", "partners"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-medium">{org.trading_name ?? org.legal_name}</div>
        <div className="text-xs text-muted-foreground">
          {org.primary_category.replaceAll("_", " ")} · {org.city ?? "—"}
          {org.bundesland && <> · {org.bundesland}</>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={org.verified ? "default" : "outline"}>
          {org.verified ? "Verified" : "Unverified"}
        </Badge>
        <Badge variant="outline">{org.status}</Badge>
        {org.status !== "active" && (
          <Button size="sm" onClick={() => mut.mutate({ status: "active", verified: true })}>
            Activate
          </Button>
        )}
        {org.status === "active" && (
          <Button size="sm" variant="outline" onClick={() => mut.mutate({ status: "suspended" })}>
            Suspend
          </Button>
        )}
      </div>
    </div>
  );
}

function NewOrgDialog() {
  const [open, setOpen] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("funeral_director");
  const [city, setCity] = useState("");
  const [bundesland, setBundesland] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const qc = useQueryClient();
  const create = useServerFn(createPartnerOrg);
  const mut = useMutation({
    mutationFn: () =>
      create({
        data: {
          legalName,
          tradingName: tradingName || undefined,
          primaryCategory: category,
          city: city || undefined,
          bundesland: bundesland || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Organisation created");
      qc.invalidateQueries({ queryKey: ["portal", "partners"] });
      setOpen(false);
      setLegalName("");
      setTradingName("");
      setCity("");
      setBundesland("");
      setContactEmail("");
      setContactPhone("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> New organisation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New partner organisation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Legal name</Label>
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </div>
          <div>
            <Label>Trading name</Label>
            <Input value={tradingName} onChange={(e) => setTradingName(e.target.value)} />
          </div>
          <div>
            <Label>Primary category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Bundesland</Label>
              <Input value={bundesland} onChange={(e) => setBundesland(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Contact email</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Contact phone</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!legalName || mut.isPending} onClick={() => mut.mutate()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
