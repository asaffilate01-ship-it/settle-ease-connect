import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function NotificationBell() {
  const { items, unread, markRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent/50"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markRead()} className="h-7 text-xs">
                <Check className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            )}
            <Link to="/app/notifications" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              You're all caught up
            </div>
          ) : (
            items.slice(0, 12).map((n: any) => (
              <Link
                key={n.id}
                to={n.link ?? "/app/notifications"}
                onClick={() => !n.read_at && markRead(n.id)}
                className={`block border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent/40 ${
                  n.read_at ? "opacity-70" : "bg-primary/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{n.title}</div>
                    {n.body && (
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
