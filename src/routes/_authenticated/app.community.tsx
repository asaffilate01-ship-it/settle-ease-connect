import { createFileRoute } from "@tanstack/react-router";
import { Users, Send } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listCommunityPosts,
  createCommunityPost,
  listPostReplies,
  replyToPost,
} from "@/lib/community.functions";

export const Route = createFileRoute("/_authenticated/app/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const list = useServerFn(listCommunityPosts);
  const create = useServerFn(createCommunityPost);
  const qc = useQueryClient();
  const { data: posts = [] } = useQuery({ queryKey: ["community-posts"], queryFn: () => list() });
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => create({ data: { title, body, category: "general" } }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Post shared with the community");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Community help board</h1>
        <p className="text-sm text-muted-foreground">
          Ask questions, share tips. Staff replies are marked.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" /> Start a new post
        </div>
        <div className="mt-3 grid gap-3">
          <Input
            placeholder="Short title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
          />
          <Textarea
            placeholder="Describe what you're stuck on. Include city if relevant."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            rows={4}
          />
          <div>
            <Button
              disabled={createMutation.isPending || title.length < 3 || body.length < 5}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet — be the first to ask.</p>
        )}
        {posts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()} · {p.reply_count} replies
                </div>
              </div>
              <Badge variant="outline">{p.category}</Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{p.body}</p>
            <div className="mt-3">
              <button
                className="text-xs text-primary underline"
                onClick={() => setSelected(selected === p.id ? null : p.id)}
              >
                {selected === p.id ? "Hide" : "View"} replies
              </button>
            </div>
            {selected === p.id && <RepliesPanel postId={p.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function RepliesPanel({ postId }: { postId: string }) {
  const list = useServerFn(listPostReplies);
  const reply = useServerFn(replyToPost);
  const qc = useQueryClient();
  const { data: replies = [] } = useQuery({
    queryKey: ["community-replies", postId],
    queryFn: () => list({ data: { postId } }),
  });
  const [text, setText] = useState("");
  const send = useMutation({
    mutationFn: async () => reply({ data: { postId, body: text } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["community-replies", postId] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
  return (
    <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
      {replies.map((r) => (
        <div key={r.id} className="rounded-lg bg-muted/30 p-3 text-sm">
          {r.is_staff && <Badge className="mr-2 bg-primary text-primary-foreground">Staff</Badge>}
          <span className="whitespace-pre-wrap">{r.body}</span>
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(r.created_at).toLocaleString()}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" />
        <Button size="icon" disabled={!text.trim() || send.isPending} onClick={() => send.mutate()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
