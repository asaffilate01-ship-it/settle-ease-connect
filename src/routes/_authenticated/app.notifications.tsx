import { createFileRoute, Link } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — BeistandPlus" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { items, unread, markRead, loading } = useNotifications();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Bell className="h-4 w-4" /> Inbox
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={() => markRead()}>
            <Check className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        )}
      </header>

      {loading ? (
        <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No notifications yet. We'll ping you when something needs your attention.
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((n: any) => (
            <li key={n.id} className={`p-4 ${n.read_at ? "" : "bg-primary/5"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{n.kind}</div>
                  <div className="mt-0.5 font-medium">{n.title}</div>
                  {n.body && <div className="mt-1 text-sm text-muted-foreground">{n.body}</div>}
                  {n.link && (
                    <Link to={n.link} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                      Open →
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                  {!n.read_at && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} className="h-7 text-xs">
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
