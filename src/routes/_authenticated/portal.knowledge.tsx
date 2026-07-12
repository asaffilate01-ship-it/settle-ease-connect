import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listKnowledgeServices } from "@/lib/knowledge.functions";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { BookOpenText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/knowledge")({
  component: KnowledgePage,
});

function KnowledgePage() {
  const fetchServices = useServerFn(listKnowledgeServices);
  const { data, isLoading, error } = useQuery({
    queryKey: ["knowledge-services"],
    queryFn: () => fetchServices(),
  });

  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, s: any) => {
    const key = s.category?.name ?? "Uncategorised";
    (acc[key] ||= [] as any).push(s);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 bg-background">
        <header className="border-b border-border/60 bg-card px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Internal knowledge base</h1>
              <p className="text-sm text-muted-foreground">
                Legal basis, SOPs, and assigned experts for every service Beistand delivers.
              </p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading knowledge base…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {(error as Error).message} — you need staff, case_manager, or admin role to view this.
            </div>
          )}
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, items]) => (
              <section key={cat}>
                <h2 className="font-display text-lg font-semibold text-muted-foreground">{cat}</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(items as any[]).map((s) => (
                    <Link
                      key={s.id}
                      to="/portal/knowledge/$slug"
                      params={{ slug: s.slug }}
                      className="group rounded-xl border border-border/60 bg-card p-5 shadow-soft transition hover:border-primary/60 hover:shadow-elevated"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-display text-base font-semibold group-hover:text-primary">
                          {s.name}
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{s.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{s.short_description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
            {!isLoading && !error && (data?.length ?? 0) === 0 && (
              <div className="text-sm text-muted-foreground">
                No services yet. Add records via Cloud → Tables → knowledge_services.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
