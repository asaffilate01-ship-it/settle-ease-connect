import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDirectoryListings } from "@/lib/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Globe, Phone, Mail, MapPin, Star } from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "lawyer", label: "Lawyers" },
  { key: "immigration", label: "Immigration" },
  { key: "tax", label: "Tax advisors" },
  { key: "welfare", label: "Welfare / benefits / pensions" },
  { key: "doctor", label: "Doctors" },
  { key: "medical", label: "Medical specialists" },
  { key: "education", label: "Education" },
  { key: "religious", label: "Religious" },
  { key: "translator", label: "Translators" },
  { key: "funeral", label: "Funeral" },
  { key: "other", label: "Other" },
];

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Community directory — Beistand" },
      { name: "description", content: "Find multilingual lawyers, doctors, immigration specialists, tax advisors, welfare experts, imams, priests and more across Germany. Free to browse." },
      { property: "og:title", content: "Community directory — Beistand" },
      { property: "og:description", content: "Verified & community-listed service providers for expats and migrants in Germany. €10/yr to list your business." },
    ],
  }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const fetchListings = useServerFn(listDirectoryListings);

  const { data, isLoading } = useQuery({
    queryKey: ["directory", category, city],
    queryFn: () => fetchListings({ data: { category: category || undefined, city: city || undefined } }),
  });

  const listings = data?.listings ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border/60 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            Community directory
          </Badge>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Find someone who speaks your language.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Multilingual lawyers, doctors, imams, tax advisors, welfare experts,
            teachers and translators across Germany — searchable by city and
            language. Free to browse.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/directory/list-your-business">List your business — €10/yr</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Filter by city (Berlin, Munich…)"
                className="w-full rounded-lg border border-border/60 bg-background py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    category === c.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No listings match your filters yet. Be one of the first —{" "}
              <Link to="/directory/list-your-business" className="text-primary underline-offset-4 hover:underline">
                list your business
              </Link>
              .
            </p>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((l: any) => (
            <div key={l.id} className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-semibold">{l.business_name}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {l.category}{l.subcategory ? ` · ${l.subcategory}` : ""}
                  </div>
                </div>
                {l.featured && (
                  <Badge className="gap-1 bg-accent text-accent-foreground">
                    <Star className="h-3 w-3" /> Featured
                  </Badge>
                )}
              </div>
              {l.description && (
                <p className="mt-3 text-sm text-muted-foreground">{l.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(l.languages ?? []).map((lang: string) => (
                  <Badge key={lang} variant="secondary" className="text-[10px] uppercase">{lang}</Badge>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {l.city && (
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {l.city}{l.bundesland ? `, ${l.bundesland}` : ""}</div>
                )}
                {l.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> <a href={`tel:${l.phone}`} className="hover:text-foreground">{l.phone}</a></div>
                )}
                {l.email && (
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> <a href={`mailto:${l.email}`} className="hover:text-foreground">{l.email}</a></div>
                )}
                {l.website && (
                  <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> <a href={l.website} target="_blank" rel="noreferrer" className="hover:text-foreground">Website</a></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
