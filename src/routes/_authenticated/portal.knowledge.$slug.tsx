import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getKnowledgeService } from "@/lib/knowledge.functions";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/knowledge/$slug")({
  component: KnowledgeDetail,
});

function KnowledgeDetail() {
  const { slug } = Route.useParams();
  const fetchService = useServerFn(getKnowledgeService);
  const { data: svc, isLoading, error } = useQuery({
    queryKey: ["knowledge-service", slug],
    queryFn: () => fetchService({ data: { slug } }),
  });

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 bg-background">
        <div className="border-b border-border/60 bg-card px-8 py-6">
          <Link to="/portal/knowledge" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to knowledge base
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 p-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {error && <div className="p-8 text-sm text-destructive">{(error as Error).message}</div>}

        {svc && (
          <div className="mx-auto max-w-5xl space-y-8 p-8">
            <header>
              <Badge variant="secondary">{(svc as any).category?.name}</Badge>
              <h1 className="mt-3 font-display text-3xl font-semibold">{svc.name}</h1>
              <p className="mt-2 text-muted-foreground">{svc.short_description}</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              <Fact label="Typical timeline" value={svc.typical_timeline} />
              <Fact label="Official fees" value={svc.official_fees} />
              <Fact label="Expert required" value={svc.requires_expert_role ?? "—"} />
            </div>

            <Section title="Eligibility">{svc.eligibility}</Section>
            <Section title="Legal basis">{svc.legal_basis}</Section>
            <Section title="Jurisdiction notes">{svc.jurisdiction_notes}</Section>
            <Section title="Internal wholesale / margin notes">{svc.our_wholesale_notes}</Section>

            <List title="Delivery playbook" items={svc.delivery_playbook as string[]} ordered />
            <List title="Required documents" items={svc.required_documents as string[]} />
            <List title="Common pitfalls" items={svc.common_pitfalls as string[]} />

            <div>
              <h3 className="font-display text-lg font-semibold">Governing regulations</h3>
              <div className="mt-3 space-y-2">
                {((svc as any).regulations ?? []).map((r: any) => (
                  <a
                    key={r.regulation.code}
                    href={r.regulation.official_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-card p-4 hover:border-primary/60"
                  >
                    <div>
                      <div className="font-mono text-xs text-primary">{r.regulation.code} · {r.regulation.jurisdiction}</div>
                      <div className="font-medium">{r.regulation.title}</div>
                      <div className="text-xs text-muted-foreground">{r.regulation.summary}</div>
                    </div>
                    {r.regulation.official_url && <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold">Assigned experts</h3>
              {((svc as any).experts ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No experts assigned yet. Add via the Experts roster.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {((svc as any).experts ?? []).map((e: any) => (
                    <div key={e.expert.id} className="rounded-lg border border-border/60 bg-card p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{e.expert.full_name}</span>
                        {e.expert.verified && <Badge className="text-[10px]">Verified</Badge>}
                        {e.is_lead && <Badge variant="secondary" className="text-[10px]">Lead</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.expert.profession} · {e.expert.city ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Languages: {(e.expert.languages ?? []).join(", ") || "—"}
                      </div>
                      {e.expert.wholesale_rate_eur != null && (
                        <div className="mt-1 text-xs">Wholesale: €{e.expert.wholesale_rate_eur}/hr</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function List({ title, items, ordered }: { title: string; items?: string[]; ordered?: boolean }) {
  if (!items || items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <Tag className={`mt-3 space-y-2 text-sm ${ordered ? "list-decimal pl-5" : "list-disc pl-5"}`}>
        {items.map((i, idx) => <li key={idx}>{i}</li>)}
      </Tag>
    </div>
  );
}
