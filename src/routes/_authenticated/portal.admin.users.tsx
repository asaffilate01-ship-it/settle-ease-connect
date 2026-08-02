import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listAppUsers,
  grantUserRole,
  revokeUserRole,
  listRoleApprovals,
  decideRoleApproval,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check, Clock3, Loader2, Plus, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { Aal2Gate } from "@/components/security/aal2-gate";

const ALL_ROLES = [
  "admin",
  "staff",
  "case_manager",
  "insurance_admin",
  "tax_admin",
  "benefits_admin",
  "medical_admin",
  "new_arrival_admin",
  "lawyer",
  "accountant",
  "doctor",
  "notary",
  "translator",
  "social_worker",
  "expert",
  "funeral_director",
  "mosque",
  "church",
  "temple",
  "hospital",
  "beneficiary",
  "family",
] as const;

export const Route = createFileRoute("/_authenticated/portal/admin/users")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Admin · Users — BeistandPlus" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <Aal2Gate reason="Managing user roles requires two-factor verification.">
      <AdminUsersContent />
    </Aal2Gate>
  );
}

function AdminUsersContent() {
  const qc = useQueryClient();
  const list = useServerFn(listAppUsers);
  const grant = useServerFn(grantUserRole);
  const revoke = useServerFn(revokeUserRole);
  const listApprovals = useServerFn(listRoleApprovals);
  const decideApproval = useServerFn(decideRoleApproval);
  const [q, setQ] = useState("");

  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const approvalsQ = useQuery({
    queryKey: ["role-approvals"],
    queryFn: () => listApprovals(),
  });

  function refreshAdminData() {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["role-approvals"] });
  }

  const grantMut = useMutation({
    mutationFn: (v: { user_id: string; role: string }) => grant({ data: v as any }),
    onSuccess: () => {
      toast.success("Role change requested. A different administrator must approve it.");
      refreshAdminData();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: (v: { user_id: string; role: string }) => revoke({ data: v as any }),
    onSuccess: () => {
      toast.success("Role change requested. A different administrator must approve it.");
      refreshAdminData();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const decideMut = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected" }) =>
      decideApproval({ data: v }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.decision === "approved" ? "Role change approved" : "Request rejected",
      );
      refreshAdminData();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = (usersQ.data ?? []).filter((u: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return u.email.toLowerCase().includes(s) || u.full_name.toLowerCase().includes(s);
  });
  const pendingApprovals = (approvalsQ.data ?? []).filter((a: any) => a.status === "pending");
  const userById = new Map((usersQ.data ?? []).map((u: any) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Admin
          </div>
          <h1 className="display-lg mt-1 font-semibold">Users & roles</h1>
          <p className="text-sm text-muted-foreground">
            Search accounts and request role changes. Every change requires approval from a second
            administrator.
          </p>
        </div>
        <Link to="/portal/admin/invite">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New invitation
          </Button>
        </Link>
      </div>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-medium">
              <Clock3 className="h-4 w-4 text-amber-700" /> Pending role approvals
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              The administrator who requested a change cannot approve it.
            </p>
          </div>
          <Badge variant="outline">{pendingApprovals.length} pending</Badge>
        </div>

        {approvalsQ.isLoading ? (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading requests…
          </div>
        ) : pendingApprovals.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No role changes await approval.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {pendingApprovals.map((approval: any) => {
              const target = userById.get(approval.target_user_id) as any;
              return (
                <div
                  key={approval.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      {approval.action === "role_grant" ? "Grant" : "Revoke"}{" "}
                      <span className="capitalize">{approval.role.replaceAll("_", " ")}</span>
                    </p>
                    <p className="truncate text-muted-foreground">
                      {target?.full_name || target?.email || approval.target_user_id}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {new Date(approval.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => decideMut.mutate({ id: approval.id, decision: "approved" })}
                      disabled={decideMut.isPending}
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideMut.mutate({ id: approval.id, decision: "rejected" })}
                      disabled={decideMut.isPending}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
        <div className="grid grid-cols-[1.5fr_2fr_1fr_2fr_auto] gap-3 border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
          <div>Name</div>
          <div>Email</div>
          <div>Last sign-in</div>
          <div>Roles</div>
          <div />
        </div>
        {usersQ.isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          </div>
        )}
        {usersQ.error && (
          <div className="p-6 text-sm text-destructive">{(usersQ.error as Error).message}</div>
        )}
        {users.map((u: any) => (
          <div
            key={u.id}
            className="grid grid-cols-[1.5fr_2fr_1fr_2fr_auto] gap-3 items-center border-b border-border/40 px-4 py-3 text-sm last:border-0"
          >
            <div className="truncate">
              {u.full_name || <span className="text-muted-foreground">—</span>}
            </div>
            <div className="truncate font-mono text-xs">{u.email}</div>
            <div className="text-xs text-muted-foreground">
              {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
            </div>
            <div className="flex flex-wrap gap-1">
              {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
              {u.roles.map((r: string) => (
                <Badge key={r} variant="outline" className="capitalize gap-1">
                  {r.replace("_", " ")}
                  <button
                    onClick={() => revokeMut.mutate({ user_id: u.id, role: r })}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${r}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ALL_ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => grantMut.mutate({ user_id: u.id, role: r })}
                  >
                    <span className="capitalize">{r.replace("_", " ")}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {!usersQ.isLoading && users.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No users match.</div>
        )}
      </div>
    </div>
  );
}
