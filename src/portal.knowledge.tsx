import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listKnowledgeServices } from "@/lib/knowledge.functions";
import { PortalHeader } from "@/components/portal/portal-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge base — BeistandPlus" }] }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const fetchServices = useServerFn(listKnowledgeServices);
  const { data, isLoading, error } = useQuery({
    queryKey: ["knowledge-services"],
    queryFn: () => fetchServices(),
  });
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter((s: any) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      s.name.toLowerCase().includes(needle) ||
      (s.short_description ?? "").toLowerCase().includes(needle) ||
      (s.category?.name ?? "").toLowerCase().includes(needle)
    );
  });

  const grouped = filtered.reduce<Record<string, any[]>>((acc, s: any) => {
    const key = s.category?.name ?? "Uncategorised";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PortalHeader
        crumbs={[{ label: "Knowledge base" }]}
        title="Internal knowledge base"
        subtitle="Legal basis, SOPs, and assigned experts for every service BeistandPlus delivers."
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services…"
              className="h-9 pl-8"
            />
          </div>
        }
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading knowledge base…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      <div className="space-y-10">
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {cat}
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((s: any) => (
                <Link
                  key={s.id}
                  to="/portal/knowledge/$slug"
                  params={{ slug: s.slug }}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition hover:border-primary/60 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 font-display text-base font-semibold group-hover:text-primary">
                      {s.name}
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {s.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {s.short_description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                    {s.typical_timeline && (
                      <span className="rounded-full border border-border/60 px-2 py-0.5">⏱ {s.typical_timeline}</span>
                    )}
                    {s.official_fees && (
                      <span className="rounded-full border border-border/60 px-2 py-0.5">€ {s.official_fees}</span>
                    )}
                    {s.requires_expert_role && (
                      <span className="rounded-full border border-primary/40 px-2 py-0.5 text-primary">{s.requires_expert_role}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            {q ? `No services match "${q}".` : "No services yet."}
          </div>
        )}
      </div>
    </div>
  );
}
