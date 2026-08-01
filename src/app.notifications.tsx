import { createFileRoute, Link } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { pushSupported, subscribeToPush } from "@/lib/push-client";
import { savePushSubscription, sendPushToUser } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — BeistandPlus" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { items, unread, markRead, loading } = useNotifications();
  const savePush = useServerFn(savePushSubscription);
  const sendPush = useServerFn(sendPushToUser);
  const [pushState, setPushState] = useState<"idle" | "enabling" | "on" | "unavailable">("idle");

  useEffect(() => {
    if (!pushSupported()) return setPushState("unavailable");
    if (Notification.permission === "granted") setPushState("on");
  }, []);

  async function enablePush() {
    setPushState("enabling");
    try {
      const sub = await subscribeToPush();
      if (!sub) {
        setPushState("idle");
        toast.error("Push permission denied");
        return;
      }
      await savePush({
        data: {
          platform: "web",
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
          user_agent: navigator.userAgent,
        },
      });
      setPushState("on");
      toast.success("Push notifications enabled");
    } catch (err: any) {
      setPushState("idle");
      toast.error(err?.message ?? "Could not enable push");
    }
  }

  async function testPush() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    try {
      const res = await sendPush({
        data: {
          user_id: user.user.id,
          title: "BeistandPlus test",
          body: "If you see this, web push is wired end-to-end.",
          link: "/app/notifications",
          kind: "test",
        },
      });
      toast.success(`Sent to ${res.sent} device${res.sent === 1 ? "" : "s"}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Send failed");
    }
  }


  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Bell className="h-4 w-4" /> Inbox
          </div>
          <h1 className="display-lg mt-1 font-semibold">Notifications</h1>
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <BellRing className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium">Browser push notifications</div>
            <div className="text-xs text-muted-foreground">
              {pushState === "unavailable"
                ? "Not supported in this browser"
                : pushState === "on"
                  ? "Enabled on this device"
                  : "Get pinged even when the tab is closed"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {pushState !== "on" && pushState !== "unavailable" && (
            <Button size="sm" onClick={enablePush} disabled={pushState === "enabling"}>
              {pushState === "enabling" ? "Enabling…" : "Enable"}
            </Button>
          )}
          {pushState === "on" && (
            <Button size="sm" variant="outline" onClick={testPush}>
              Send test
            </Button>
          )}
        </div>
      </div>

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
