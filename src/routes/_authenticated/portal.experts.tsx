import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExperts } from "@/lib/knowledge.functions";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/experts")({
  component: ExpertsPage,
});

function ExpertsPage() {
  const fetchExperts = useServerFn(listExperts);
  const { data, isLoading, error } = useQuery({
    queryKey: ["experts"],
    queryFn: () => fetchExperts(),
  });

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 bg-background">
        <header className="border-b border-border/60 bg-card px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Expert & consultant roster</h1>
              <p className="text-sm text-muted-foreground">
                Verified lawyers, tax advisors, imams, funeral directors, translators and doctors.
              </p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
            </div>
          )}
          {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No experts on file yet. Add records via Cloud → Tables → experts (name, profession,
              Kammer / registration number, wholesale rate, languages).
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(data ?? []).map((e: any) => (
              <div key={e.id} className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-base font-semibold">{e.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.profession} · {e.city ?? "—"}{e.bundesland ? `, ${e.bundesland}` : ""}
                    </div>
                  </div>
                  {e.verified && <Badge className="text-[10px]">Verified</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(e.specialisations ?? []).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Languages: {(e.languages ?? []).join(", ") || "—"}</div>
                  <div>Wholesale: {e.wholesale_rate_eur != null ? `€${e.wholesale_rate_eur}/hr` : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
