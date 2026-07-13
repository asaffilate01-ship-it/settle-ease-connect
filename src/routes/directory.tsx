import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDirectoryListings } from "@/lib/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Globe, Phone, Mail, MapPin, Star, Lock, Sparkles, Scale, Stamp, Calculator, HeartHandshake, Stethoscope, GraduationCap, HandHelping, Languages, Flower2, Building2, LayoutGrid, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, tierMeets } from "@/lib/subscription";
import { ClayIcon } from "@/components/clay-icon";
import { PolishedCard } from "@/components/polished-card";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  lawyer: Scale,
  immigration: Stamp,
  tax: Calculator,
  welfare: HandHelping,
  doctor: Stethoscope,
  medical: HeartHandshake,
  education: GraduationCap,
  religious: Building2,
  translator: Languages,
  funeral: Flower2,
  other: LayoutGrid,
};

const CATEGORY_TONES: Record<string, "ocean" | "teal" | "aurora" | "coral" | "sun" | "mint" | "ink"> = {
  lawyer: "ocean", immigration: "aurora", tax: "mint", welfare: "sun",
  doctor: "teal", medical: "coral", education: "aurora", religious: "ink",
  translator: "teal", funeral: "coral", other: "ocean",
};

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
      { title: "Members directory — BeistandPlus" },
      { name: "description", content: "Multilingual lawyers, doctors, immigration specialists, tax advisors, welfare experts, imams and more across Germany. Free to list, member access to view." },
      { property: "og:title", content: "Members directory — BeistandPlus" },
      { property: "og:description", content: "Verified & community-listed service providers for expats and migrants in Germany. Free listings for providers, member access for families." },
      { property: "og:url", content: "https://beistandplus.de/directory" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/directory" }],
  }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const sub = useSubscription();
  const fetchListings = useServerFn(listDirectoryListings);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(!!data.user);
    });
    return () => { mounted = false; };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["directory", category, city],
    queryFn: () => fetchListings({ data: { category: category || undefined, city: city || undefined } }),
  });

  const listings = data?.listings ?? [];
  const authLoading = signedIn === null || sub.loading;
  const hasAccess = signedIn === true && tierMeets(sub.planGroup, "basic");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border/60 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            Members directory
          </Badge>
          <h1 className="display-hero text-balance mt-4 font-semibold">
            Find someone who speaks your language.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Multilingual lawyers, doctors, imams, tax advisors, welfare experts,
            teachers and translators across Germany — searchable by city and
            language. <strong className="text-foreground">Free for providers to list</strong>,
            member access for families and clients.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/directory/list-your-business">List your business — free</Link>
            </Button>
            {!hasAccess && (
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">See member plans</Link>
              </Button>
            )}
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
        {(isLoading || authLoading) && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {!isLoading && !authLoading && listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No listings match your filters yet. Be one of the first —{" "}
              <Link to="/directory/list-your-business" className="text-primary underline-offset-4 hover:underline">
                list your business for free
              </Link>
              .
            </p>
          </div>
        )}

        {!isLoading && !authLoading && listings.length > 0 && (
          <>
            {!hasAccess && (
              <MemberPaywall count={listings.length} signedIn={signedIn === true} />
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((l: any) => (
                <ListingCard key={l.id} listing={l} locked={!hasAccess} />
              ))}
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function MemberPaywall({ count, signedIn }: { count: number; signedIn: boolean }) {
  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-hero p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-clay">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Members only
            </div>
            <h2 className="display-lg text-balance mt-1 font-semibold">
              Unlock all {count} verified providers.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              BeistandPlus members get full contact details, phone, email and
              website for every listing — plus a human case manager who can
              introduce you. Directory listings are free for providers; access
              is included with every BeistandPlus plan.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:shrink-0">
          <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
            <Link to="/pricing">See plans from €5</Link>
          </Button>
          {!signedIn && (
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing: l, locked }: { listing: any; locked: boolean }) {
  const key = String(l.category ?? "other").toLowerCase();
  const Icon = CATEGORY_ICONS[key] ?? LayoutGrid;
  const tone = CATEGORY_TONES[key] ?? "ocean";
  return (
    <PolishedCard glow className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ClayIcon icon={Icon} tone={tone} size="md" />
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold">{l.business_name}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {l.category}{l.subcategory ? ` · ${l.subcategory}` : ""}
            </div>
          </div>
        </div>
        {l.featured && (
          <Badge className="shrink-0 gap-1 bg-accent text-accent-foreground">
            <Star className="h-3 w-3" /> Featured
          </Badge>
        )}
      </div>
      {l.description && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{l.description}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(l.languages ?? []).map((lang: string) => (
          <Badge key={lang} variant="secondary" className="text-[10px] uppercase">{lang}</Badge>
        ))}
      </div>

      <div className="relative mt-4 space-y-1.5 text-sm text-muted-foreground">
        {l.city && (
          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {l.city}{l.bundesland ? `, ${l.bundesland}` : ""}</div>
        )}
        {locked ? (
          <>
            <div className="flex items-center gap-2 select-none">
              <Phone className="h-3.5 w-3.5" />
              <span className="rounded bg-muted px-8 py-0.5 text-transparent blur-[3px]">+49 30 000 000</span>
            </div>
            <div className="flex items-center gap-2 select-none">
              <Mail className="h-3.5 w-3.5" />
              <span className="rounded bg-muted px-10 py-0.5 text-transparent blur-[3px]">email@hidden.de</span>
            </div>
            {l.website && (
              <div className="flex items-center gap-2 select-none">
                <Globe className="h-3.5 w-3.5" />
                <span className="rounded bg-muted px-6 py-0.5 text-transparent blur-[3px]">website</span>
              </div>
            )}
          </>
        ) : (
          <>
            {l.phone && (
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> <a href={`tel:${l.phone}`} className="hover:text-foreground">{l.phone}</a></div>
            )}
            {l.email && (
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> <a href={`mailto:${l.email}`} className="hover:text-foreground">{l.email}</a></div>
            )}
            {l.website && (
              <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> <a href={l.website} target="_blank" rel="noreferrer" className="hover:text-foreground">Website</a></div>
            )}
          </>
        )}
      </div>

      {locked && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Contact details for members
          </span>
          <Link to="/pricing" className="font-medium text-primary hover:underline">
            Unlock →
          </Link>
        </div>
      )}
    </PolishedCard>
  );
}
