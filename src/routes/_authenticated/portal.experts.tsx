import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExperts } from "@/lib/knowledge.functions";
import { PortalHeader } from "@/components/portal/portal-header";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/experts")({
  head: () => ({ meta: [{ title: "Expert roster — Beistand" }] }),
  component: ExpertsPage,
});

function ExpertsPage() {
  const fetchExperts = useServerFn(listExperts);
  const { data, isLoading, error } = useQuery({
    queryKey: ["experts"],
    queryFn: () => fetchExperts(),
  });

  return (
    <div className="space-y-6">
      <PortalHeader
        crumbs={[{ label: "Experts" }]}
        title="Expert & consultant roster"
        subtitle="Verified lawyers, tax advisors, imams, funeral directors, translators and doctors."
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
        </div>
      )}
      {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No experts on file yet. The expert editor lands in the next portal-rebuild step.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((e: any) => (
          <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-display text-base font-semibold">{e.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {e.profession} · {e.city ?? "—"}
                  {e.bundesland ? `, ${e.bundesland}` : ""}
                </div>
              </div>
              {e.verified && <Badge className="shrink-0 text-[10px]">Verified</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(e.specialisations ?? []).map((s: string) => (
                <Badge key={s} variant="secondary" className="text-[10px]">
                  {s}
                </Badge>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="truncate">Languages: {(e.languages ?? []).join(", ") || "—"}</div>
              <div>Wholesale: {e.wholesale_rate_eur != null ? `€${e.wholesale_rate_eur}/hr` : "—"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
