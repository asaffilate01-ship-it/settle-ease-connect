import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  listSlaCases,
  listUpcomingAppointments,
  listOpenCases,
  createAppointment,
  updateAppointmentStatus,
  closeCase,
} from "@/lib/case-operations.functions";

const slaQ = queryOptions({ queryKey: ["ops", "sla"], queryFn: () => listSlaCases() });
const apptQ = queryOptions({
  queryKey: ["ops", "appointments"],
  queryFn: () => listUpcomingAppointments({ data: { days: 30 } }),
});
const openCasesQ = queryOptions({
  queryKey: ["ops", "open-cases"],
  queryFn: () => listOpenCases(),
});

export const Route = createFileRoute("/_authenticated/portal/operations")({
  head: () => ({ meta: [{ title: "Case Operations — BeistandPlus" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(slaQ),
      context.queryClient.ensureQueryData(apptQ),
      context.queryClient.ensureQueryData(openCasesQ),
    ]),
  component: OperationsPage,
  errorComponent: ({ error }) => (
    <div className="p-6 flex items-center gap-2 text-destructive">
      <AlertTriangle className="h-5 w-5" /> {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function slaTone(state: string) {
  if (state === "breached") return "bg-red-500/10 text-red-600 border-red-500/20";
  if (state === "at_risk") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function OperationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="display-lg font-semibold flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" /> Case operations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          SLA monitoring, appointments, and case closure.
        </p>
      </header>

      <Tabs defaultValue="sla">
        <TabsList>
          <TabsTrigger value="sla">SLA dashboard</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="closure">Close a case</TabsTrigger>
        </TabsList>
        <TabsContent value="sla" className="mt-4">
          <SlaPanel />
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          <AppointmentsPanel />
        </TabsContent>
        <TabsContent value="closure" className="mt-4">
          <ClosurePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- SLA ----------
function SlaPanel() {
  const { data } = useSuspenseQuery(slaQ);
  const breached = data.filter((c) => c.sla_state === "breached");
  const atRisk = data.filter((c) => c.sla_state === "at_risk");
  const onTrack = data.filter((c) => c.sla_state === "on_track");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SlaColumn
        title="Breached"
        icon={<XCircle className="h-4 w-4 text-red-600" />}
        rows={breached}
      />
      <SlaColumn
        title="At risk (<24h)"
        icon={<Clock className="h-4 w-4 text-amber-600" />}
        rows={atRisk}
      />
      <SlaColumn
        title="On track"
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        rows={onTrack}
      />
    </div>
  );
}

function SlaColumn({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<any>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon} {title} <span className="text-muted-foreground">({rows.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          rows.map((c) => (
            <div key={c.case_id} className="rounded-md border p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm truncate">{c.title}</div>
                <Badge variant="outline" className={slaTone(c.sla_state)}>
                  {c.sla_state}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Stage: {c.current_stage ?? "—"} · Priority: {c.priority ?? "—"}
              </div>
              <div className="text-xs">
                Due {formatDateTime(c.sla_due_at)}
                {c.hours_remaining != null && (
                  <span className="text-muted-foreground"> · {Math.round(c.hours_remaining)}h</span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Appointments ----------
function AppointmentsPanel() {
  const { data: appts } = useSuspenseQuery(apptQ);
  const { data: cases } = useSuspenseQuery(openCasesQ);
  const qc = useQueryClient();
  const updateStatus = useServerFn(updateAppointmentStatus);

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "scheduled" | "completed" | "cancelled" | "no_show" }) =>
      updateStatus({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "appointments"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Next 30 days across all accessible cases.</p>
        <NewAppointmentDialog cases={cases} />
      </div>
      <Card>
        <CardContent className="p-0">
          {appts.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No upcoming appointments.</p>
          ) : (
            <div className="divide-y">
              {appts.map((a) => (
                <div key={a.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.title}</span>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(a.starts_at)} → {formatDateTime(a.ends_at)}
                    </div>
                    {a.location && <div className="text-xs">📍 {a.location}</div>}
                    {a.meeting_url && (
                      <a
                        href={a.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Join meeting
                      </a>
                    )}
                    {a.description && (
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {a.status === "scheduled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => statusMut.mutate({ id: a.id, status: "completed" })}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMut.mutate({ id: a.id, status: "cancelled" })}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NewAppointmentDialog({ cases }: { cases: Array<{ id: string; title: string }> }) {
  const [open, setOpen] = useState(false);
  const [caseId, setCaseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");

  const qc = useQueryClient();
  const create = useServerFn(createAppointment);
  const mut = useMutation({
    mutationFn: () =>
      create({
        data: {
          caseId,
          title,
          description: description || undefined,
          location: location || undefined,
          meetingUrl: meetingUrl || "",
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        },
      }),
    onSuccess: () => {
      toast.success("Appointment scheduled");
      qc.invalidateQueries({ queryKey: ["ops", "appointments"] });
      setOpen(false);
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setLocation("");
      setMeetingUrl("");
      setDescription("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> New appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Case</Label>
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Ends</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office / address"
            />
          </div>
          <div>
            <Label>Meeting URL (optional)</Label>
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!caseId || !title || !startsAt || !endsAt || mut.isPending}
            onClick={() => mut.mutate()}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Closure ----------
function ClosurePanel() {
  const { data: cases } = useSuspenseQuery(openCasesQ);
  const [caseId, setCaseId] = useState("");
  const [outcome, setOutcome] = useState<
    "resolved" | "referred" | "declined" | "withdrawn" | "no_contact" | "other"
  >("resolved");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [requestCsat, setRequestCsat] = useState(true);

  const qc = useQueryClient();
  const close = useServerFn(closeCase);
  const mut = useMutation({
    mutationFn: () =>
      close({
        data: {
          caseId,
          outcome,
          reason,
          summary,
          followUpNeeded,
          followUpNotes: followUpNotes || undefined,
          requestCsat,
        },
      }),
    onSuccess: () => {
      toast.success("Case closed");
      qc.invalidateQueries({ queryKey: ["ops", "open-cases"] });
      qc.invalidateQueries({ queryKey: ["ops", "sla"] });
      setCaseId("");
      setReason("");
      setSummary("");
      setFollowUpNotes("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to close"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Case closure with report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Case</Label>
          <Select value={caseId} onValueChange={setCaseId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an open case" />
            </SelectTrigger>
            <SelectContent>
              {cases.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Outcome</Label>
          <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="referred">Referred to partner</SelectItem>
              <SelectItem value="declined">Declined by client</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="no_contact">No contact</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Reason (short)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div>
          <Label>Closure summary (required)</Label>
          <Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={followUpNeeded}
            onChange={(e) => setFollowUpNeeded(e.target.checked)}
          />
          Follow-up needed
        </label>
        {followUpNeeded && (
          <div>
            <Label>Follow-up notes</Label>
            <Textarea
              rows={2}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requestCsat}
            onChange={(e) => setRequestCsat(e.target.checked)}
          />
          Send CSAT request to client
        </label>
        <Button
          disabled={!caseId || reason.length < 3 || summary.length < 10 || mut.isPending}
          onClick={() => mut.mutate()}
        >
          Close case
        </Button>
      </CardContent>
    </Card>
  );
}
