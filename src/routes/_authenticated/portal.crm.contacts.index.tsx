import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCrmContacts, createCrmContact } from "@/lib/crm.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/portal/crm/contacts/")({
  component: ContactsIndex,
});

function ContactsIndex() {
  const listFn = useServerFn(listCrmContacts);
  const createFn = useServerFn(createCrmContact);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    preferred_language: "de",
    city: "",
    source: "manual",
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts", q],
    queryFn: () => listFn({ data: { q, limit: 200 } }),
  });

  const create = useMutation({
    mutationFn: (v: typeof form) => createFn({ data: v }),
    onSuccess: () => {
      toast.success("Contact created");
      qc.invalidateQueries({ queryKey: ["crm-contacts"] });
      setOpen(false);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        preferred_language: "de",
        city: "",
        source: "manual",
        notes: "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <UserPlus className="mr-2 h-4 w-4" /> New contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New contact</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate(form);
              }}
            >
              <Field label="Full name">
                <Input
                  required
                  minLength={2}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Language">
                  <Input
                    value={form.preferred_language}
                    onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Source">
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="website, referral, walk-in…"
                />
              </Field>
              <DialogFooter>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Saving…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prospects ({data?.contacts.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {data?.contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">No prospects yet.</p>
            )}
            {data?.contacts.map((c) => (
              <Link
                key={c.id}
                to="/portal/crm/contacts/$contactId"
                params={{ contactId: c.id }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm hover:bg-accent/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[c.email, c.phone, c.city].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">
                    {c.preferred_language}
                  </Badge>
                  {c.source && <Badge variant="secondary">{c.source}</Badge>}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members ({data?.profiles.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.profiles.length === 0 && (
              <p className="text-sm text-muted-foreground">No matching members.</p>
            )}
            {data?.profiles.map((p) => (
              <Link
                key={p.id}
                to="/portal/crm/contacts/$contactId"
                params={{ contactId: `u:${p.id}` }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm hover:bg-accent/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.full_name ?? "(no name)"}</div>
                  <div className="text-xs text-muted-foreground">{p.city ?? "—"}</div>
                </div>
                <Badge variant="outline" className="uppercase">
                  {p.preferred_language}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
