import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { listAudit } from "@/lib/audit.functions";

export const Route = createFileRoute("/_authenticated/portal/audit")({
  head: () => ({ meta: [{ title: "Audit log — Staff" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [q, setQ] = useState("");
  const [entityType, setEntityType] = useState("");
  const listFn = useServerFn(listAudit);
  const { data = [], isLoading } = useQuery({
    queryKey: ["audit", q, entityType],
    queryFn: () => listFn({ data: { q: q || undefined, entity_type: entityType || undefined, limit: 300 } }),
  });

  const rows = data as any[];

  function exportCsv() {
    const header = ["created_at", "actor_email", "action", "entity_type", "entity_id", "subject_user_id", "ip", "user_agent"];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        header.map((h) => JSON.stringify((r as any)[h] ?? "").replace(/^"|"$/g, "")).join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="h-4 w-4" /> Compliance
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">Every sensitive action across the platform, exportable for GDPR/audit.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search action (e.g. document.download)…"
          className="h-9 flex-1 min-w-64 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All entities</option>
          {["document", "message", "case", "user", "role", "share", "alert"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button onClick={exportCsv} className="h-9 rounded-md border px-3 text-sm hover:bg-accent/40">Export CSV</button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Actor</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No entries</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.actor_email ?? r.actor_user_id?.slice(0, 8) ?? "system"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2 text-xs">{r.entity_type ? `${r.entity_type}${r.entity_id ? ` / ${String(r.entity_id).slice(0, 8)}` : ""}` : "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.ip ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
