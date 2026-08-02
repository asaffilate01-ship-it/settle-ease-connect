import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Inbox, MessageSquareText, Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Aal2Gate } from "@/components/security/aal2-gate";
import {
  addEnquiryNote,
  getEnquiry,
  listEnquiries,
  updateEnquiry,
} from "@/lib/enquiries.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/enquiries")({
  head: () => ({ meta: [{ title: "Enquiry inbox — BeistandPlus" }] }),
  component: EnquiryInbox,
});

const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "spam"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
type EnquiryStatus = (typeof STATUSES)[number];
type EnquiryPriority = (typeof PRIORITIES)[number];
type EnquiryRow = {
  id: string;
  subject: string;
  full_name: string;
  email: string;
  message: string;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  assigned_to: string | null;
  sla_due_at: string | null;
  created_at: string;
  tags: string[];
};
type StaffProfile = { id: string; full_name: string | null; avatar_url: string | null };
type EnquiryNote = {
  id: string;
  author_user_id: string;
  note_type: string;
  body: string;
  delivery_status: string | null;
  created_at: string;
};
type EnquiryUpdate = {
  status?: EnquiryStatus;
  priority?: EnquiryPriority;
  assignedTo?: string | null;
  tags?: string[];
};
const REPLY_TEMPLATES = [
  {
    label: "Acknowledgement",
    body: "Thank you for contacting BeistandPlus. We have received your enquiry and a member of our team is reviewing it.",
  },
  {
    label: "More information",
    body: "Thank you for your message. To help us review your enquiry, please reply with the relevant reference number and any important deadline.",
  },
  {
    label: "Resolved",
    body: "We believe your enquiry has now been resolved. Please reply if you still need assistance.",
  },
];

function EnquiryInbox() {
  const listFn = useServerFn(listEnquiries);
  const detailFn = useServerFn(getEnquiry);
  const updateFn = useServerFn(updateEnquiry);
  const noteFn = useServerFn(addEnquiryNote);
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("open");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState(false);

  const listQ = useQuery({
    queryKey: ["enquiries", status, q],
    queryFn: () =>
      listFn({
        data: {
          status: status === "open" || status === "all" ? undefined : (status as EnquiryStatus),
          q: q || undefined,
        },
      }),
  });
  const detailQ = useQuery({
    queryKey: ["enquiry", selectedId],
    queryFn: () => detailFn({ data: { id: selectedId! } }),
    enabled: Boolean(selectedId),
  });
  const rows = useMemo(() => {
    const all = (listQ.data?.enquiries ?? []) as EnquiryRow[];
    return status === "open"
      ? all.filter((row) => !["resolved", "spam"].includes(row.status))
      : all;
  }, [listQ.data, status]);
  const profiles = (listQ.data?.profiles ?? []) as StaffProfile[];
  const nameOf = (id?: string | null) =>
    profiles.find((profile) => profile.id === id)?.full_name ?? "Unassigned";

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["enquiries"] }),
      qc.invalidateQueries({ queryKey: ["enquiry", selectedId] }),
    ]);
  };
  const update = useMutation({
    mutationFn: (data: EnquiryUpdate) => updateFn({ data: { id: selectedId!, ...data } }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const addNote = useMutation({
    mutationFn: () =>
      noteFn({
        data: {
          enquiryId: selectedId!,
          body: note,
          noteType: reply ? "reply" : "internal",
        },
      }),
    onSuccess: async () => {
      setNote("");
      await refresh();
      toast.success(reply ? "Reply queued" : "Internal note added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Aal2Gate reason="The enquiry inbox contains personal information. Confirm your authenticator code to continue.">
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Inbox className="h-4 w-4" /> Operations
            </div>
            <h1 className="display-lg mt-1 font-semibold">Enquiry inbox</h1>
            <p className="text-sm text-muted-foreground">
              Assign, prioritise and resolve incoming customer enquiries within SLA.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{rows.filter((row) => row.status === "new").length} new</Badge>
            <Badge variant="outline" className="border-red-500/40 text-red-700">
              {rows.filter((row) => row.sla_due_at && new Date(row.sla_due_at) < new Date()).length}{" "}
              overdue
            </Badge>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search name, email or subject"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open queue</SelectItem>
              <SelectItem value="all">All enquiries</SelectItem>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {label(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft lg:grid-cols-[390px_1fr]">
          <div className="border-b border-border/60 lg:border-b-0 lg:border-r">
            {listQ.isLoading ? (
              <Empty text="Loading enquiries…" />
            ) : rows.length === 0 ? (
              <Empty text="No enquiries match this view." />
            ) : (
              rows.map((row) => {
                const overdue =
                  row.sla_due_at &&
                  new Date(row.sla_due_at) < new Date() &&
                  !["resolved", "spam"].includes(row.status);
                return (
                  <button
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full border-b border-border/60 p-4 text-left transition hover:bg-muted/40 ${selectedId === row.id ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.subject}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {row.full_name} · {row.email}
                        </div>
                      </div>
                      <Priority value={row.priority} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{row.message}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{nameOf(row.assigned_to)}</span>
                      <span className={overdue ? "font-semibold text-red-600" : ""}>
                        {overdue ? "SLA overdue" : new Date(row.created_at).toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {!selectedId ? (
            <Empty text="Select an enquiry to review it." icon />
          ) : detailQ.isLoading ? (
            <Empty text="Loading enquiry…" />
          ) : detailQ.data ? (
            (() => {
              const item = detailQ.data.enquiry as EnquiryRow;
              const notes = detailQ.data.notes as EnquiryNote[];
              return (
                <div className="flex min-w-0 flex-col">
                  <div className="border-b border-border/60 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl font-semibold">{item.subject}</h2>
                        <p className="text-sm text-muted-foreground">
                          {item.full_name} ·{" "}
                          <a className="text-primary hover:underline" href={`mailto:${item.email}`}>
                            {item.email}
                          </a>
                        </p>
                      </div>
                      <Priority value={item.priority} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Select
                        value={item.status}
                        onValueChange={(value) => update.mutate({ status: value as EnquiryStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((entry) => (
                            <SelectItem key={entry} value={entry}>
                              {label(entry)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={item.priority}
                        onValueChange={(value) =>
                          update.mutate({ priority: value as EnquiryPriority })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((entry) => (
                            <SelectItem key={entry} value={entry}>
                              {label(entry)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={item.assigned_to ?? "unassigned"}
                        onValueChange={(value) =>
                          update.mutate({ assignedTo: value === "unassigned" ? null : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name ?? profile.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="rounded-xl border bg-background/60 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <MessageSquareText className="h-4 w-4" /> Customer message
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{item.message}</p>
                    </div>
                    {notes.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl border p-3 text-sm ${entry.note_type === "reply" ? "border-primary/30 bg-primary/5" : "bg-muted/20"}`}
                      >
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {entry.note_type === "reply"
                              ? "Customer reply"
                              : label(entry.note_type)}{" "}
                            · {nameOf(entry.author_user_id)}
                          </span>
                          <span>{new Date(entry.created_at).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{entry.body}</p>
                        {entry.delivery_status && (
                          <Badge variant="outline" className="mt-2">
                            Delivery: {entry.delivery_status}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 border-t border-border/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={reply}
                          onChange={(event) => setReply(event.target.checked)}
                        />{" "}
                        Customer reply
                      </label>
                      {reply &&
                        REPLY_TEMPLATES.map((template) => (
                          <Button
                            key={template.label}
                            size="sm"
                            variant="outline"
                            onClick={() => setNote(template.body)}
                          >
                            {template.label}
                          </Button>
                        ))}
                    </div>
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={
                        reply ? "Compose a customer reply…" : "Add a private staff note…"
                      }
                      rows={4}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Customer replies enter the delivery queue; configure the email adapter
                        before launch.
                      </p>
                      <Button
                        disabled={!note.trim() || addNote.isPending}
                        onClick={() => addNote.mutate()}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {reply ? "Queue reply" : "Add note"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <Empty text="Enquiry unavailable." />
          )}
        </div>
      </div>
    </Aal2Gate>
  );
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}
function Priority({ value }: { value: string }) {
  const tone =
    value === "urgent"
      ? "border-red-500/40 text-red-700"
      : value === "high"
        ? "border-amber-500/40 text-amber-700"
        : "";
  return (
    <Badge variant="outline" className={tone}>
      {label(value)}
    </Badge>
  );
}
function Empty({ text, icon = false }: { text: string; icon?: boolean }) {
  return (
    <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-muted-foreground">
      <div>
        {icon && <Inbox className="mx-auto mb-3 h-8 w-8 opacity-40" />}
        {text}
      </div>
    </div>
  );
}
