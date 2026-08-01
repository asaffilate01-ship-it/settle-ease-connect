import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, Megaphone, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listAllEvents,
  saveEvent,
  deleteEvent,
  listEventRegistrations,
  setRegistrationStatus,
} from "@/lib/events.functions";
import {
  listMemberAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements.functions";

export const Route = createFileRoute("/_authenticated/portal/events")({
  head: () => ({ meta: [{ title: "Events & notices — Staff" }] }),
  component: PortalEventsPage,
});

type FormState = {
  id?: string;
  title: string;
  description: string;
  category: "advice_clinic" | "community_gathering" | "trip" | "workshop";
  sub_category: string;
  event_date: string;
  end_date: string;
  location: string;
  address: string;
  city: string;
  max_attendees: string;
  fee_eur: string;
  is_members_only: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
};

const EMPTY: FormState = {
  title: "",
  description: "",
  category: "advice_clinic",
  sub_category: "health",
  event_date: "",
  end_date: "",
  location: "",
  address: "",
  city: "",
  max_attendees: "",
  fee_eur: "0",
  is_members_only: false,
  status: "draft",
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PortalEventsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllEvents);
  const saveFn = useServerFn(saveEvent);
  const delFn = useServerFn(deleteEvent);
  const regsFn = useServerFn(listEventRegistrations);
  const regStatusFn = useServerFn(setRegistrationStatus);
  const noticesFn = useServerFn(listMemberAnnouncements);
  const saveNoticeFn = useServerFn(saveAnnouncement);
  const delNoticeFn = useServerFn(deleteAnnouncement);

  const [form, setForm] = useState<FormState | null>(null);
  const [regsFor, setRegsFor] = useState<{ id: string; title: string } | null>(null);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["portal", "events"],
    queryFn: () => listFn(),
  });
  const { data: notices = [] } = useQuery({
    queryKey: ["portal", "notices"],
    queryFn: () => noticesFn(),
  });
  const { data: registrations = [] } = useQuery({
    queryKey: ["portal", "event-registrations", regsFor?.id],
    queryFn: () => regsFn({ data: { eventId: regsFor!.id } }),
    enabled: !!regsFor,
  });

  const save = useMutation({
    mutationFn: async (f: FormState) =>
      saveFn({
        data: {
          ...(f.id ? { id: f.id } : {}),
          values: {
            title: f.title,
            description: f.description || null,
            category: f.category,
            sub_category: f.category === "advice_clinic" ? f.sub_category || null : null,
            event_date: new Date(f.event_date).toISOString(),
            end_date: f.end_date ? new Date(f.end_date).toISOString() : null,
            location: f.location || null,
            address: f.address || null,
            city: f.city || null,
            max_attendees: f.max_attendees ? Number(f.max_attendees) : null,
            fee_eur: Number(f.fee_eur || 0),
            is_members_only: f.is_members_only,
            image_url: null,
            status: f.status,
          },
        },
      }),
    onSuccess: () => {
      setForm(null);
      qc.invalidateQueries({ queryKey: ["portal", "events"] });
      toast.success("Event saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal", "events"] });
      toast.success("Event deleted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete"),
  });

  const markAttended = useMutation({
    mutationFn: (registrationId: string) =>
      regStatusFn({ data: { registrationId, status: "attended" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal", "event-registrations"] });
      toast.success("Marked as attended");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update"),
  });

  const publishNotice = useMutation({
    mutationFn: async (n: { title: string; body: string }) =>
      saveNoticeFn({
        data: {
          values: {
            title: n.title,
            body: n.body,
            audience: "all",
            severity: "info",
            link_url: null,
            visible_from: new Date().toISOString(),
            visible_until: null,
          },
        },
      }),
    onSuccess: () => {
      setNotice(null);
      qc.invalidateQueries({ queryKey: ["portal", "notices"] });
      toast.success("Notice published");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not publish"),
  });

  const removeNotice = useMutation({
    mutationFn: (id: string) => delNoticeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal", "notices"] });
      toast.success("Notice removed");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not remove"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold">Events & notices</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNotice({ title: "", body: "" })}>
            <Megaphone className="mr-2 h-4 w-4" /> New notice
          </Button>
          <Button onClick={() => setForm({ ...EMPTY })}>
            <Plus className="mr-2 h-4 w-4" /> New event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Event</th>
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Where</th>
                <th className="px-4 py-2.5">Registered</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {events.map((e: any) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.category.replace(/_/g, " ")}
                      {e.sub_category ? ` · ${e.sub_category}` : ""}
                      {e.fee_eur > 0 ? ` · €${Number(e.fee_eur).toFixed(2)}` : " · free"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {new Date(e.event_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">{[e.location, e.city].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {e.registered_count}
                    {e.max_attendees ? ` / ${e.max_attendees}` : ""}
                    {e.waitlist_count > 0 ? ` (+${e.waitlist_count} wait)` : ""}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {e.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRegsFor({ id: e.id, title: e.title })}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            id: e.id,
                            title: e.title,
                            description: e.description ?? "",
                            category: e.category,
                            sub_category: e.sub_category ?? "health",
                            event_date: toLocalInput(e.event_date),
                            end_date: toLocalInput(e.end_date),
                            location: e.location ?? "",
                            address: e.address ?? "",
                            city: e.city ?? "",
                            max_attendees: e.max_attendees ? String(e.max_attendees) : "",
                            fee_eur: String(e.fee_eur ?? 0),
                            is_members_only: !!e.is_members_only,
                            status: e.status,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Notices</h2>
        <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card">
          {notices.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {n.audience} · {new Date(n.visible_from).toLocaleDateString()}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeNotice.mutate(n.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {notices.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No notices.</div>
          )}
        </div>
      </section>

      {/* Event editor */}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as FormState["category"] })}
                >
                  <option value="advice_clinic">Advice clinic</option>
                  <option value="community_gathering">Community gathering</option>
                  <option value="workshop">Workshop</option>
                  <option value="trip">Trip / excursion</option>
                </select>
              </Field>
              {form.category === "advice_clinic" && (
                <Field label="Advice topic">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.sub_category}
                    onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                  >
                    <option value="health">Basic health check</option>
                    <option value="tax">Tax advice</option>
                    <option value="legal">Legal advice</option>
                    <option value="benefits">Benefits advice</option>
                    <option value="general">General advice</option>
                  </select>
                </Field>
              )}
              <Field label="Starts">
                <Input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </Field>
              <Field label="Ends (optional)">
                <Input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </Field>
              <Field label="Venue">
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label="Capacity (blank = unlimited)">
                <Input
                  type="number"
                  min={1}
                  value={form.max_attendees}
                  onChange={(e) => setForm({ ...form, max_attendees: e.target.value })}
                />
              </Field>
              <Field label="Fee (€, 0 = free)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fee_eur}
                  onChange={(e) => setForm({ ...form, fee_eur: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 self-end text-sm">
                <input
                  type="checkbox"
                  checked={form.is_members_only}
                  onChange={(e) => setForm({ ...form, is_members_only: e.target.checked })}
                />
                Members only
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              disabled={!form?.title || !form?.event_date || save.isPending}
              onClick={() => form && save.mutate(form)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations */}
      <Dialog open={!!regsFor} onOpenChange={(o) => !o && setRegsFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{regsFor?.title} — registrations</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] divide-y divide-border/40 overflow-y-auto">
            {registrations.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <div className="font-medium">{r.full_name ?? r.user_id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.status}
                    {r.guests > 0 ? ` · +${r.guests} guests` : ""}
                  </div>
                </div>
                {r.status === "registered" && (
                  <Button size="sm" variant="outline" onClick={() => markAttended.mutate(r.id)}>
                    Attended
                  </Button>
                )}
              </div>
            ))}
            {registrations.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No registrations yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice composer */}
      <Dialog open={!!notice} onOpenChange={(o) => !o && setNotice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New notice</DialogTitle>
          </DialogHeader>
          {notice && (
            <div className="space-y-4">
              <Field label="Title">
                <Input
                  value={notice.title}
                  onChange={(e) => setNotice({ ...notice, title: e.target.value })}
                />
              </Field>
              <Field label="Body">
                <Textarea
                  rows={4}
                  value={notice.body}
                  onChange={(e) => setNotice({ ...notice, body: e.target.value })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotice(null)}>
              Cancel
            </Button>
            <Button
              disabled={!notice?.title || !notice?.body || publishNotice.isPending}
              onClick={() => notice && publishNotice.mutate(notice)}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
