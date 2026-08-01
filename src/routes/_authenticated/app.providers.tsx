import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { listDirectoryListings } from "@/lib/directory.functions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/app/providers")({
  component: ProvidersPage,
});

const listingsQuery = queryOptions({
  queryKey: ["directory-listings", "all"],
  queryFn: () => listDirectoryListings({ data: {} }),
});

function ProvidersPage() {
  const { data, isLoading } = useQuery(listingsQuery);
  const listings = data?.listings ?? [];
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(listings.map((l) => l.category).filter((c): c is string => !!c)),
      ),
    ],
    [listings],
  );

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (!l.business_name || !l.category) return false;
      if (cat !== "All" && l.category !== cat) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !l.business_name.toLowerCase().includes(q) &&
          !(l.city?.toLowerCase().includes(q) ?? false) &&
          !(l.description?.toLowerCase().includes(q) ?? false)
        )
          return false;
      }
      return true;
    });
  }, [listings, query, cat]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Provider directory</h1>
        <p className="text-sm text-muted-foreground">
          Verified partners across faith and profession, city by city.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0"
            placeholder="Search providers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((k) => (
          <button
            key={k}
            onClick={() => setCat(k)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              cat === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading providers…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          No providers match your filters yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-display text-lg font-semibold truncate">
                    {p.business_name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.category}
                    {p.subcategory ? ` · ${p.subcategory}` : ""}
                  </div>
                </div>
                {p.featured && (
                  <div className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs text-success">
                    <ShieldCheck className="h-3 w-3" /> Featured
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                {p.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.city}
                  </span>
                )}
              </div>
              {p.description && (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {p.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(p.languages ?? []).map((l) => (
                  <Badge key={l} variant="outline" className="text-[10px]">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
