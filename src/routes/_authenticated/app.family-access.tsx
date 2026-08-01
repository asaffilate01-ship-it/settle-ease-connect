import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, KeyRound, ShieldCheck, UserPlus, UsersRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  inviteFamilyAccess,
  listFamilyAccess,
  revokeFamilyAccess,
} from "@/lib/family-access.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/family-access")({
  head: () => ({ meta: [{ title: "Family access — BeistandPlus" }] }),
  component: FamilyAccessPage,
});

type AccessLevel = "updates" | "documents" | "collaborator";
type CaseSummary = { id: string; reference: string; title: string; status: string; updated_at: string };
type AccessGrant = {
  id: string;
  case_id: string;
  invited_name: string;
  invited_email: string;
  relationship: string | null;
  access_level: AccessLevel;
  can_message: boolean;
  status: string;
  expires_at: string;
};

function FamilyAccessPage() {
  const listFn = useServerFn(listFamilyAccess);
  const inviteFn = useServerFn(inviteFamilyAccess);
  const revokeFn = useServerFn(revokeFamilyAccess);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["family-access"], queryFn: () => listFn() });
  const cases = (data?.cases ?? []) as CaseSummary[];
  const grants = (data?.grants ?? []) as AccessGrant[];
  const [form, setForm] = useState({
    caseId: "",
    name: "",
    email: "",
    relationship: "",
    accessLevel: "updates",
    canMessage: false,
    expiresInDays: 14,
  });
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () =>
      inviteFn({ data: { ...form, accessLevel: form.accessLevel as AccessLevel } }),
    onSuccess: async (result) => {
      const url = `${window.location.origin}${result.invitationPath}`;
      setInvitationUrl(url);
      setForm((current) => ({ ...current, name: "", email: "", relationship: "" }));
      await qc.invalidateQueries({ queryKey: ["family-access"] });
      toast.success("Secure invitation created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-access"] }),
    onError: (error: Error) => toast.error(error.message),
  });
  const caseTitle = (id: string) => cases.find((item) => item.id === id)?.title ?? "Case";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <UsersRound className="h-4 w-4" /> Household workspace
        </div>
        <h1 className="display-lg mt-1 font-semibold">Family and trusted-person access</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Invite one trusted person to follow a case, view selected case documents, or collaborate.
          Every invitation expires and can be revoked immediately.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            invite.mutate();
          }}
          className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
        >
          <div>
            <h2 className="font-display text-xl font-semibold">Create an invitation</h2>
            <p className="text-xs text-muted-foreground">
              The recipient must sign in using the invited email address.
            </p>
          </div>
          {cases.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Create a case before inviting someone.{" "}
              <Link to="/app/cases/new" className="text-primary hover:underline">
                Create case
              </Link>
            </div>
          ) : (
            <>
              <Field label="Case">
                <Select
                  value={form.caseId}
                  onValueChange={(value) => setForm({ ...form, caseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.reference} · {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Name">
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </Field>
              <Field label="Relationship">
                <Input
                  value={form.relationship}
                  onChange={(event) => setForm({ ...form, relationship: event.target.value })}
                  placeholder="Spouse, sibling, lawyer…"
                />
              </Field>
              <Field label="Access">
                <Select
                  value={form.accessLevel}
                  onValueChange={(value) => setForm({ ...form, accessLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updates">Updates only</SelectItem>
                    <SelectItem value="documents">Updates and case documents</SelectItem>
                    <SelectItem value="collaborator">Collaborator</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.canMessage}
                  onChange={(event) => setForm({ ...form, canMessage: event.target.checked })}
                  className="mt-1"
                />
                <span>
                  <strong>Allow messages</strong>
                  <span className="block text-xs text-muted-foreground">
                    The person may post messages visible to the case team.
                  </span>
                </span>
              </label>
              <Button type="submit" className="w-full" disabled={!form.caseId || invite.isPending}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create secure invitation
              </Button>
            </>
          )}
        </form>

        <div className="space-y-4">
          {invitationUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Invitation ready</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Copy this link now. For security, the full token is not stored and cannot be
                    shown again.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Input readOnly value={invitationUrl} />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(invitationUrl);
                        toast.success("Invitation link copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            <div className="border-b p-5">
              <h2 className="font-display text-xl font-semibold">Access register</h2>
              <p className="text-xs text-muted-foreground">
                Pending, accepted, expired and revoked case access.
              </p>
            </div>
            {isLoading ? (
              <Empty text="Loading access register…" />
            ) : grants.length === 0 ? (
              <Empty text="No family access has been granted." />
            ) : (
              <div className="divide-y">
                {grants.map((grant) => (
                  <div key={grant.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{grant.invited_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {grant.invited_email} · {grant.relationship || "Trusted person"}
                        </div>
                        <div className="mt-1 text-xs">{caseTitle(grant.case_id)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{grant.access_level}</Badge>
                        <Status value={grant.status} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {grant.can_message ? "Messaging allowed" : "Read-only messaging"} · expires{" "}
                        {new Date(grant.expires_at).toLocaleDateString()}
                      </span>
                      {!["revoked", "expired"].includes(grant.status) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => revoke.mutate(grant.id)}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <strong>Privacy controls</strong>
            <p className="mt-1 text-muted-foreground">
              Updates-only access cannot read case documents. Document access does not allow
              uploads. Collaborators can update tasks and upload case documents. Internal staff
              notes remain hidden from every family guest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
function Status({ value }: { value: string }) {
  const tone =
    value === "accepted"
      ? "border-emerald-500/40 text-emerald-700"
      : value === "pending"
        ? "border-amber-500/40 text-amber-700"
        : "";
  return (
    <Badge variant="outline" className={tone}>
      {value}
    </Badge>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
