import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listExperts } from "@/lib/knowledge.functions";
import {
  listExpertInvitations,
  createExpertInvitation,
  revokeExpertInvitation,
  listExpertPayouts,
  createExpertPayout,
  updateExpertPayoutStatus,
} from "@/lib/experts.functions";
import { PortalHeader } from "@/components/portal/portal-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Copy, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/experts")({
  head: () => ({ meta: [{ title: "Expert roster — BeistandPlus" }] }),
  component: ExpertsPage,
});

function ExpertsPage() {
  return (
    <div className="space-y-6">
      <PortalHeader
        crumbs={[{ label: "Experts" }]}
        title="Expert & consultant roster"
        subtitle="Invite experts, track roster, and manage compensation payouts."
      />
      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="roster" className="mt-4">
          <RosterTab />
        </TabsContent>
        <TabsContent value="invitations" className="mt-4">
          <InvitationsTab />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -------- Roster --------

function RosterTab() {
  const fetchExperts = useServerFn(listExperts);
  const { data, isLoading, error } = useQuery({
    queryKey: ["experts"],
    queryFn: () => fetchExperts(),
  });

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
      </div>
    );
  if (error) return <div className="text-sm text-destructive">{(error as Error).message}</div>;
  if ((data?.length ?? 0) === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        No experts on the roster yet. Send an invitation from the Invitations tab.
      </div>
    );

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {(data ?? []).map((e: any) => (
        <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-display text-base font-semibold">{e.full_name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {e.profession} · {e.city ?? "—"}
                {e.bundesland ? `, ${e.bundesland}` : ""}
              </div>
            </div>
            {e.verified && <Badge className="shrink-0 text-[10px]">Verified</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(e.specialisations ?? []).map((s: string) => (
              <Badge key={s} variant="secondary" className="text-[10px]">
                {s}
              </Badge>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="truncate">Languages: {(e.languages ?? []).join(", ") || "—"}</div>
            <div className="truncate">
              Comp: {e.compensation_model ?? "—"}
              {e.referral_fee_pct != null ? ` · ${e.referral_fee_pct}%` : ""}
              {e.wholesale_rate_eur != null ? ` · €${e.wholesale_rate_eur}/hr` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -------- Invitations --------

function InvitationsTab() {
  const qc = useQueryClient();
  const fetchInv = useServerFn(listExpertInvitations);
  const revokeFn = useServerFn(revokeExpertInvitation);
  const { data, isLoading } = useQuery({
    queryKey: ["expert-invitations"],
    queryFn: () => fetchInv(),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-invitations"] });
      toast.success("Invitation revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Send a signed invitation link. The invitee's compensation terms are locked in on
          acceptance.
        </div>
        <InviteDialog />
      </div>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Invitee</th>
              <th className="p-3">Profession</th>
              <th className="p-3">Comp</th>
              <th className="p-3">Status</th>
              <th className="p-3">Link</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((i: any) => {
              const link =
                typeof window !== "undefined"
                  ? `${window.location.origin}/expert-invite/${i.token}`
                  : `/expert-invite/${i.token}`;
              const expired = new Date(i.expires_at) < new Date();
              return (
                <tr key={i.id} className="border-t border-border/60">
                  <td className="p-3">
                    <div className="font-medium">{i.full_name}</div>
                    <div className="text-xs text-muted-foreground">{i.email}</div>
                  </td>
                  <td className="p-3">{i.profession}</td>
                  <td className="p-3">
                    <div>{i.compensation_model}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.referral_fee_pct != null ? `${i.referral_fee_pct}%` : ""}
                      {i.wholesale_rate_eur != null ? ` · €${i.wholesale_rate_eur}/hr` : ""}
                    </div>
                  </td>
                  <td className="p-3">
                    {i.accepted_at ? (
                      <Badge className="text-[10px]">Accepted</Badge>
                    ) : expired ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {i.accepted_at ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <CopyLink link={link} />
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!i.accepted_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revoke.mutate(i.id)}
                        disabled={revoke.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {(data ?? []).length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                  No invitations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="h-7 gap-1.5 text-xs"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const createFn = useServerFn(createExpertInvitation);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    profession: "",
    compensation_model: "referral_fee" as "referral_fee" | "wholesale" | "direct_bill",
    referral_fee_pct: "",
    wholesale_rate_eur: "",
    hourly_rate_eur: "",
    languages: "de,en",
    city: "",
    bundesland: "",
    personal_message: "",
    days_valid: 30,
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          email: form.email,
          full_name: form.full_name,
          profession: form.profession,
          compensation_model: form.compensation_model,
          referral_fee_pct: form.referral_fee_pct ? Number(form.referral_fee_pct) : null,
          wholesale_rate_eur: form.wholesale_rate_eur ? Number(form.wholesale_rate_eur) : null,
          hourly_rate_eur: form.hourly_rate_eur ? Number(form.hourly_rate_eur) : null,
          languages: form.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          city: form.city || null,
          bundesland: form.bundesland || null,
          personal_message: form.personal_message || null,
          days_valid: form.days_valid,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-invitations"] });
      toast.success("Invitation created — copy the link from the list");
      setOpen(false);
      setForm({
        ...form,
        email: "",
        full_name: "",
        profession: "",
        referral_fee_pct: "",
        wholesale_rate_eur: "",
        hourly_rate_eur: "",
        personal_message: "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> New invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite expert</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Full name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Profession</Label>
            <Input
              placeholder="lawyer, tax advisor, translator…"
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
            />
          </div>
          <div>
            <Label>Compensation model</Label>
            <Select
              value={form.compensation_model}
              onValueChange={(v) => setForm({ ...form, compensation_model: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="referral_fee">Referral fee %</SelectItem>
                <SelectItem value="wholesale">Wholesale markup</SelectItem>
                <SelectItem value="direct_bill">Direct bill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Referral fee %</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="10"
              value={form.referral_fee_pct}
              onChange={(e) => setForm({ ...form, referral_fee_pct: e.target.value })}
            />
          </div>
          <div>
            <Label>Wholesale rate €/hr</Label>
            <Input
              type="number"
              placeholder="60"
              value={form.wholesale_rate_eur}
              onChange={(e) => setForm({ ...form, wholesale_rate_eur: e.target.value })}
            />
          </div>
          <div>
            <Label>Hourly rate €/hr</Label>
            <Input
              type="number"
              value={form.hourly_rate_eur}
              onChange={(e) => setForm({ ...form, hourly_rate_eur: e.target.value })}
            />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>Bundesland</Label>
            <Input
              value={form.bundesland}
              onChange={(e) => setForm({ ...form, bundesland: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Languages (comma-separated)</Label>
            <Input
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Personal message</Label>
            <Textarea
              rows={3}
              value={form.personal_message}
              onChange={(e) => setForm({ ...form, personal_message: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.email || !form.full_name || !form.profession}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------- Payouts --------

function PayoutsTab() {
  const qc = useQueryClient();
  const fetchPayouts = useServerFn(listExpertPayouts);
  const fetchExperts = useServerFn(listExperts);
  const updateStatusFn = useServerFn(updateExpertPayoutStatus);
  const { data: payouts, isLoading } = useQuery({
    queryKey: ["expert-payouts"],
    queryFn: () => fetchPayouts({ data: {} }),
  });
  const { data: experts } = useQuery({
    queryKey: ["experts"],
    queryFn: () => fetchExperts(),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "approved" | "paid" | "void" }) =>
      updateStatusFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-payouts"] });
      toast.success("Payout updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Totals per status (current view)
  const totals = (payouts ?? []).reduce(
    (acc: Record<string, number>, r: any) => {
      acc[r.status] = (acc[r.status] ?? 0) + Number(r.amount_eur ?? 0);
      return acc;
    },
    { pending: 0, approved: 0, paid: 0, void: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["pending", "approved", "paid", "void"] as const).map((s) => (
            <div
              key={s}
              className="rounded-xl border border-border/60 bg-card px-3 py-2 text-xs shadow-soft"
            >
              <div className="uppercase tracking-wider text-muted-foreground">{s}</div>
              <div className="font-display text-base font-semibold">€{totals[s].toFixed(2)}</div>
            </div>
          ))}
        </div>
        <NewPayoutDialog experts={experts ?? []} />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading payouts…
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Expert</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Gross</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(payouts ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3 text-xs">{p.period_month?.slice(0, 7)}</td>
                <td className="p-3">
                  <div className="font-medium">{p.expert?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{p.expert?.profession}</div>
                </td>
                <td className="p-3 text-xs">{p.kind}</td>
                <td className="p-3 text-xs text-muted-foreground">{p.description ?? "—"}</td>
                <td className="p-3 text-right tabular-nums">€{Number(p.gross_eur).toFixed(2)}</td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  €{Number(p.amount_eur).toFixed(2)}
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      p.status === "paid"
                        ? "default"
                        : p.status === "void"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <Select
                    value={p.status}
                    onValueChange={(v) => setStatus.mutate({ id: p.id, status: v as any })}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {(payouts ?? []).length === 0 && !isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">
                  No payouts recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewPayoutDialog({ experts }: { experts: any[] }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const createFn = useServerFn(createExpertPayout);
  const [form, setForm] = useState({
    expert_id: "",
    kind: "referral_fee" as "referral_fee" | "wholesale_markup" | "hourly" | "bonus" | "adjustment",
    description: "",
    gross_eur: "",
    rate: "",
    amount_eur: "",
    notes: "",
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          expert_id: form.expert_id,
          kind: form.kind,
          description: form.description || null,
          gross_eur: form.gross_eur ? Number(form.gross_eur) : 0,
          rate: form.rate ? Number(form.rate) : null,
          amount_eur: Number(form.amount_eur || "0"),
          notes: form.notes || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-payouts"] });
      toast.success("Payout recorded");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-compute amount when gross + rate provided
  const computed =
    form.gross_eur && form.rate ? (Number(form.gross_eur) * Number(form.rate)).toFixed(2) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" /> Record payout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record expert payout</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Expert</Label>
            <Select
              value={form.expert_id}
              onValueChange={(v) => setForm({ ...form, expert_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expert…" />
              </SelectTrigger>
              <SelectContent>
                {experts.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name} — {e.profession}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kind</Label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="referral_fee">Referral fee</SelectItem>
                <SelectItem value="wholesale_markup">Wholesale markup</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              placeholder="Case ref, invoice…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Gross € (invoice amount)</Label>
            <Input
              type="number"
              value={form.gross_eur}
              onChange={(e) => setForm({ ...form, gross_eur: e.target.value })}
            />
          </div>
          <div>
            <Label>Rate (0–1, e.g. 0.10 = 10%)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>
              Amount €{" "}
              {computed && <span className="text-muted-foreground">(auto: €{computed})</span>}
            </Label>
            <Input
              type="number"
              value={form.amount_eur || computed}
              onChange={(e) => setForm({ ...form, amount_eur: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.expert_id || !(form.amount_eur || computed)}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
