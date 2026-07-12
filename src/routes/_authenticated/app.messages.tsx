import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Plus } from "lucide-react";
import { listMyChannels } from "@/lib/messaging.functions";

export const Route = createFileRoute("/_authenticated/app/messages")({
  head: () => ({ meta: [{ title: "Messages — BeistandPlus" }] }),
  component: MessagesIndex,
});

function MessagesIndex() {
  const listFn = useServerFn(listMyChannels);
  const { data = [], isLoading } = useQuery({ queryKey: ["channels", "mine"], queryFn: () => listFn() });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <MessageSquare className="h-4 w-4" /> Messages
          </div>
          <h1 className="display-lg mt-1 font-semibold">Your conversations</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No conversations yet. When a case is opened, your case manager and assigned experts will appear here.
          <div className="mt-3">
            <Link to="/app/cases" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              <Plus className="h-3 w-3" /> Open a case
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {(data as any[]).map((c) => (
            <li key={c.id}>
              <Link
                to="/app/messages/$channelId"
                params={{ channelId: c.id }}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {c.name ?? (c.kind === "case" ? "Case conversation" : c.kind === "direct" ? "Direct message" : "Group")}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.kind}</div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : "—"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
