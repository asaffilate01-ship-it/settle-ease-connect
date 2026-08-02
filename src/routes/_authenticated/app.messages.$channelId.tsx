import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getChannel, listMessages, sendMessage, markChannelRead } from "@/lib/messaging.functions";

export const Route = createFileRoute("/_authenticated/app/messages/$channelId")({
  head: () => ({ meta: [{ title: "Conversation — BeistandPlus" }] }),
  component: ChannelPage,
});

function ChannelPage() {
  const { channelId } = Route.useParams();
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const getFn = useServerFn(getChannel);
  const listFn = useServerFn(listMessages);
  const sendFn = useServerFn(sendMessage);
  const readFn = useServerFn(markChannelRead);

  const channelQ = useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => getFn({ data: { id: channelId } }),
  });
  const msgsQ = useQuery({
    queryKey: ["channel", channelId, "messages"],
    queryFn: () => listFn({ data: { channel_id: channelId } }),
  });

  const [text, setText] = useState("");
  const send = useMutation({
    mutationFn: async () => sendFn({ data: { channel_id: channelId, body: text } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["channel", channelId, "messages"] });
      readFn({ data: { channel_id: channelId } }).catch(() => undefined);
    },
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgsQ.data]);

  useEffect(() => {
    readFn({ data: { channel_id: channelId } }).catch(() => undefined);
    const ch = supabase
      .channel(`msg:${channelId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["channel", channelId, "messages"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channelId, qc, readFn]);

  const messages = (msgsQ.data ?? []) as any[];
  const members = channelQ.data?.members ?? [];
  const memberMap = new Map((members as any[]).map((m) => [m.user_id, m.profile]));
  const channel = channelQ.data?.channel;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <header className="flex items-center gap-3 border-b pb-3">
        <Link to="/app/messages" className="rounded-md p-1 hover:bg-accent/40">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-semibold">
            {channel?.name ?? (channel?.kind === "case" ? "Case conversation" : "Conversation")}
          </div>
          <div className="text-xs text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No messages yet — say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_user_id === user?.id;
            const prof = memberMap.get(m.sender_user_id) as any;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-accent/50"
                  }`}
                >
                  {!mine && prof?.full_name && (
                    <div className="mb-0.5 text-[10px] font-semibold opacity-70">
                      {prof.full_name}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div
                    className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send.mutate();
        }}
        className="flex items-end gap-2 border-t p-3"
      >
        <Textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) send.mutate();
            }
          }}
          placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
          className="min-h-[44px] max-h-40 resize-y"
        />
        <Button type="submit" disabled={!text.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
