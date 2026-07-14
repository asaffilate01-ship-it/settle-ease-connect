import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft, Send, Plus, AlertTriangle, CheckCircle2, Lock,
  MessageSquare, ListTodo, FileText, Receipt, Activity, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getCase, updateCaseStatus, sendCaseMessage, createCaseTask, toggleCaseTask,
} from "@/lib/cases.functions";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

const caseQuery = (id: string) => queryOptions({
  queryKey: ["case", id],
  queryFn: () => getCase({ data: { id } }),
});

export const Route = createFileRoute("/_authenticated/app/cases/$caseId")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(caseQuery(params.caseId)),
  component: CaseDetail,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <div className="font-display text-2xl">Case unavailable</div>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/app/cases" className="mt-4 inline-block text-primary">Back to cases</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <div className="font-display text-2xl">Case not found</div>
      <Link to="/app/cases" className="mt-4 inline-block text-primary">Back to cases</Link>
    </div>
  ),
});

const STATUSES = ["new","triage","in_progress","awaiting_client","awaiting_expert","on_hold","completed","closed","cancelled"] as const;

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { data } = useSuspenseQuery(caseQuery(caseId));
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel(`case-${caseId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "case_messages", filter: `case_id=eq.${caseId}` }, () => {
        qc.invalidateQueries({ queryKey: ["case", caseId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "case_tasks", filter: `case_id=eq.${caseId}` }, () => {
        qc.invalidateQueries({ queryKey: ["case", caseId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "case_events", filter: `case_id=eq.${caseId}` }, () => {
        qc.invalidateQueries({ queryKey: ["case", caseId] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cases", filter: `id=eq.${caseId}` }, () => {
        qc.invalidateQueries({ queryKey: ["case", caseId] });
        qc.invalidateQueries({ queryKey: ["cases", "list"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [caseId, qc]);

  const c = data.case;
  const nameOf = (id: string | null | undefined) =>
    id ? data.profiles.find((p) => p.id === id)?.full_name ?? "User" : "System";

  return (
    <div className="space-y-6">
      <Link to="/app/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-lg font-semibold">{c.title}</h1>
            {c.urgent && <Badge className="bg-warning/20 text-warning-foreground border border-warning/40"><AlertTriangle className="mr-1 h-3 w-3" /> Urgent</Badge>}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {c.reference} · <span className="capitalize">{c.case_type.replace(/_/g," ")}</span> · {c.city ?? "—"}, {c.bundesland ?? "—"} · opened {format(new Date(c.opened_at), "PP")}
          </div>
        </div>
        <StatusPicker caseId={c.id} status={c.status} />
      </div>

      {c.summary && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Summary</div>
          <p className="mt-2 text-sm">{c.summary}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MessagesPanel caseId={c.id} messages={data.messages} nameOf={nameOf} />
        </div>
        <div className="space-y-6">
          <TasksPanel caseId={c.id} tasks={data.tasks} nameOf={nameOf} />
          <EventsPanel events={data.events} nameOf={nameOf} />
        </div>
      </div>
    </div>
  );
}

function StatusPicker({ caseId, status }: { caseId: string; status: string }) {
  const fn = useServerFn(updateCaseStatus);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (s: string) => fn({ data: { id: caseId, status: s as typeof STATUSES[number] } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case", caseId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Select value={status} onValueChange={(v) => mut.mutate(v)}>
      <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g," ")}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

type Msg = { id: string; body: string; internal_note: boolean; sender_user_id: string; created_at: string };

function MessagesPanel({ caseId, messages, nameOf }: { caseId: string; messages: Msg[]; nameOf: (id: string | null) => string }) {
  const fn = useServerFn(sendCaseMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const mut = useMutation({
    mutationFn: () => fn({ data: { case_id: caseId, body, internal_note: internal } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["case", caseId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden flex flex-col h-[540px]">
      <div className="border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Conversation · live
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && <div className="text-sm text-muted-foreground">No messages yet.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`rounded-xl p-3 text-sm ${m.internal_note ? "border border-amber-500/40 bg-amber-500/5" : "border border-border/60 bg-parchment/40"}`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{nameOf(m.sender_user_id)}</span>
              {m.internal_note && <Badge variant="outline" className="border-amber-500/40 text-amber-700"><Lock className="mr-1 h-3 w-3" /> internal</Badge>}
              <span>· {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap">{m.body}</div>
          </div>
        ))}
      </div>
      <form
        className="border-t border-border/60 p-3 space-y-2"
        onSubmit={(e) => { e.preventDefault(); if (body.trim()) mut.mutate(); }}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" className="min-h-20" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={internal} onCheckedChange={(v) => setInternal(!!v)} />
            Internal note (staff only)
          </label>
          <Button type="submit" size="sm" className="bg-gradient-primary" disabled={mut.isPending || !body.trim()}>
            <Send className="mr-1 h-3.5 w-3.5" /> Send
          </Button>
        </div>
      </form>
    </div>
  );
}

type Task = { id: string; title: string; description: string | null; done: boolean; due_at: string | null; assignee_user_id: string | null };

function TasksPanel({ caseId, tasks, nameOf }: { caseId: string; tasks: Task[]; nameOf: (id: string | null) => string }) {
  const createFn = useServerFn(createCaseTask);
  const toggleFn = useServerFn(toggleCaseTask);
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  const toggle = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case", caseId] }),
  });
  const create = useMutation({
    mutationFn: () => createFn({ data: { case_id: caseId, title: newTitle } }),
    onSuccess: () => { setNewTitle(""); qc.invalidateQueries({ queryKey: ["case", caseId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
      <div className="border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tasks</div>
      <ul className="divide-y divide-border/60">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-3 px-5 py-3">
            <Checkbox checked={t.done} onCheckedChange={(v) => toggle.mutate({ id: t.id, done: !!v })} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
              <div className="text-xs text-muted-foreground">
                {t.assignee_user_id ? nameOf(t.assignee_user_id) : "Unassigned"}
                {t.due_at && ` · due ${format(new Date(t.due_at), "MMM d")}`}
              </div>
            </div>
            {t.done && <CheckCircle2 className="h-4 w-4 text-success" />}
          </li>
        ))}
        {tasks.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">No tasks yet.</li>}
      </ul>
      <form
        className="flex gap-2 border-t border-border/60 p-3"
        onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) create.mutate(); }}
      >
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add a task…" />
        <Button type="submit" size="sm" variant="outline" disabled={create.isPending || !newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

type Ev = { id: string; event_type: string; actor_user_id: string | null; created_at: string };

function EventsPanel({ events, nameOf }: { events: Ev[]; nameOf: (id: string | null) => string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
      <div className="border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Activity</div>
      <ol className="divide-y divide-border/60">
        {events.slice(0, 15).map((e) => (
          <li key={e.id} className="px-5 py-2.5 text-xs">
            <div className="font-medium">{e.event_type}</div>
            <div className="text-muted-foreground">
              {nameOf(e.actor_user_id)} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
            </div>
          </li>
        ))}
        {events.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">No activity yet.</li>}
      </ol>
    </div>
  );
}
