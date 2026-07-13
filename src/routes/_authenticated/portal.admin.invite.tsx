import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listInvitations, createInvitation, revokeInvitation } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Trash2, Check, Shield } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES = [
  "admin","staff","case_manager",
  "insurance_admin","tax_admin","benefits_admin","medical_admin","new_arrival_admin",
  "lawyer","accountant","doctor","notary","translator","social_worker",
  "expert","funeral_director","mosque","church","temple","hospital",
  "beneficiary","family",
] as const;

export const Route = createFileRoute("/_authenticated/portal/admin/invite")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id, _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Admin · Invitations — BeistandPlus" }] }),
  component: AdminInvitePage,
});

function AdminInvitePage() {
  const qc = useQueryClient();
  const list = useServerFn(listInvitations);
  const create = useServerFn(createInvitation);
  const revoke = useServerFn(revokeInvitation);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("case_manager");
  const [note, setNote] = useState("");
  const [days, setDays] = useState(30);

  const invitesQ = useQuery({ queryKey: ["admin-invitations"], queryFn: () => list() });

  const createMut = useMutation({
    mutationFn: () => create({ data: { email, role: role as any, note, days_valid: days } }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${email}. They'll get ${role} role on sign-up.`);
      setEmail(""); setNote("");
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => { toast.success("Invitation revoked"); qc.invalidateQueries({ queryKey: ["admin-invitations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Admin
          </div>
          <h1 className="display-lg mt-1 font-semibold">Invitations</h1>
          <p className="text-sm text-muted-foreground">
            Pre-assign a role to an email. The role is granted automatically on first sign-up.
          </p>
        </div>
        <Link to="/portal/admin/users"><Button variant="outline">Manage users</Button></Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> New invitation
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role" value={role} onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_"," ")}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="days">Valid for (days)</Label>
            <Input id="days" type="number" min={1} max={365} value={days} onChange={(e) => setDays(parseInt(e.target.value || "30"))} />
          </div>
          <div>
            <Label htmlFor="note">Note (internal)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional context" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => createMut.mutate()} disabled={!email || createMut.isPending}>
            {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create invitation
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
        <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3">
          <div>Email</div><div>Role</div><div>Status</div><div>Expires</div><div />
        </div>
        {invitesQ.isLoading && (
          <div className="p-8 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></div>
        )}
        {(invitesQ.data ?? []).map((inv: any) => {
          const expired = new Date(inv.expires_at) < new Date();
          const accepted = !!inv.accepted_at;
          return (
            <div key={inv.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center border-b border-border/40 px-4 py-3 text-sm last:border-0">
              <div className="truncate font-mono text-xs">{inv.email}</div>
              <div><Badge variant="outline" className="capitalize">{inv.role.replace("_"," ")}</Badge></div>
              <div>
                {accepted ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3 w-3" /> Accepted</span>
                ) : expired ? (
                  <span className="text-xs text-muted-foreground">Expired</span>
                ) : (
                  <span className="text-xs text-primary">Pending</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString()}</div>
              <Button size="sm" variant="ghost" onClick={() => revokeMut.mutate(inv.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {!invitesQ.isLoading && (invitesQ.data ?? []).length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No invitations yet.</div>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-parchment/60 p-4 text-xs text-muted-foreground">
          <strong>Dev-only test logins</strong> — pre-seeded accounts, sign in on <code className="rounded bg-muted px-1.5 py-0.5">/auth</code>:
          <div className="mt-2 grid gap-1 font-mono">
            <div>admin@beistand.de · admin</div>
            <div>staff@beistand.de · staff</div>
            <div>manager@beistand.de · case_manager</div>
            <div>expert@beistand.de · expert</div>
            <div>agent@beistand.de · agent</div>
          </div>
          <div className="mt-2">Password for all: <code className="rounded bg-muted px-1.5 py-0.5">beistand2026!</code></div>
        </div>
      )}
    </div>
  );
}
