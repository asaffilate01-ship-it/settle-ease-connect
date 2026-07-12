import { createFileRoute } from "@tanstack/react-router";
import { mockProviders } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Star, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/providers")({
  component: ProvidersPage,
});

function ProvidersPage() {
  const kinds = Array.from(new Set(mockProviders.map((p) => p.kind)));
  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Provider directory</h1>
        <p className="text-sm text-muted-foreground">Verified partners across faith and profession, city by city.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input className="border-0 shadow-none focus-visible:ring-0" placeholder="Search providers…" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip label="All" active />
        {kinds.map((k) => <Chip key={k} label={k} />)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockProviders.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg font-semibold">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.kind}</div>
              </div>
              {p.verified && (
                <div className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs text-success">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {p.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" /> {p.rating}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.langs.map((l) => (
                <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );
}
