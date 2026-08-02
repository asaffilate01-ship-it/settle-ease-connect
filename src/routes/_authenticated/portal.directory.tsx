import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Pause, ShieldCheck, ExternalLink, Store } from "lucide-react";
import { toast } from "sonner";
import { listDirectoryModerationQueue, setDirectoryListingStatus } from "@/lib/directory.functions";

export const Route = createFileRoute("/_authenticated/portal/directory")({
  head: () => ({ meta: [{ title: "Directory moderation — Staff" }] }),
  component: DirectoryModerationPage,
});

type TabKey = "pending" | "active" | "rejected" | "suspended";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
];

function DirectoryModerationPage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const listFn = useServerFn(listDirectoryModerationQueue);
  const setStatusFn = useServerFn(setDirectoryListingStatus);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["portal", "directory", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: TabKey }) => setStatusFn({ data: v }),
    onSuccess: (_, v) => {
      toast.success(`Listing ${v.status === "active" ? "approved" : v.status}`);
      qc.invalidateQueries({ queryKey: ["portal", "directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="h-4 w-4" /> Directory moderation
        </div>
        <h1 className="display-lg mt-1 font-semibold">Business listing review queue</h1>
        <p className="text-sm text-muted-foreground">
          Every new directory submission lands here for staff review before appearing publicly.
          Approve trustworthy providers, reject spam, and suspend anything that later goes
          off-brief.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-primary text-ink"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (data as any[]).length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nothing in the {tab} queue.
        </div>
      ) : (
        <ul className="space-y-3">
          {(data as any[]).map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <span className="font-display text-lg font-semibold">{row.business_name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                      {row.category}
                    </Badge>
                    {row.subcategory && (
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {row.subcategory}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[row.city, row.bundesland].filter(Boolean).join(", ") || "No location set"}
                    {row.website && (
                      <>
                        {" · "}
                        <a
                          href={row.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {row.website.replace(/^https?:\/\//, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </div>
                  {row.description && (
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">
                      {row.description}
                    </p>
                  )}
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                    {row.email && <span>✉ {row.email}</span>}
                    {row.phone && <span>☎ {row.phone}</span>}
                    {row.address && <span>📍 {row.address}</span>}
                  </div>
                  {row.languages?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {row.languages.map((l: string) => (
                        <span
                          key={l}
                          className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {tab !== "active" && (
                    <Button
                      size="sm"
                      onClick={() => mut.mutate({ id: row.id, status: "active" })}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  )}
                  {tab !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mut.mutate({ id: row.id, status: "rejected" })}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  )}
                  {tab === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mut.mutate({ id: row.id, status: "suspended" })}
                    >
                      <Pause className="mr-1 h-4 w-4" /> Suspend
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
