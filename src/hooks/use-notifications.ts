import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { listMyNotifications, unreadCount, markNotificationRead } from "@/lib/notifications.functions";

export function useNotifications() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyNotifications);
  const countFn = useServerFn(unreadCount);
  const markFn = useServerFn(markNotificationRead);

  const list = useQuery({
    queryKey: ["notifications", "list", user?.id],
    queryFn: () => listFn({ data: { limit: 50 } }),
    enabled: !!user,
  });
  const count = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: () => countFn(),
    enabled: !!user,
  });

  const [flash, setFlash] = useState<{ title: string; body?: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const topic = `notif:${user.id}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; body?: string };
          setFlash({ title: n.title, body: n.body });
          qc.invalidateQueries({ queryKey: ["notifications"] });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(n.title, { body: n.body ?? "", icon: "/favicon.png" });
            } catch {
              /* noop */
            }
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  async function markRead(id?: string) {
    await markFn({ data: id ? { id } : { all: true } });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return {
    items: list.data ?? [],
    unread: count.data ?? 0,
    loading: list.isLoading,
    markRead,
    flash,
    clearFlash: () => setFlash(null),
  };
}
