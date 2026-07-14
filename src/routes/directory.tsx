import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
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

const CATEGORY_KEYS = [
  "", "lawyer", "immigration", "tax", "welfare", "doctor", "medical",
  "education", "religious", "translator", "funeral", "other",
] as const;


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
  const { t } = useTranslation();
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
            {t("directory.badge", { defaultValue: "Members directory" })}
          </Badge>
          <h1 className="display-hero text-balance mt-4 font-semibold">
            {t("directory.heroTitle", { defaultValue: "Find someone who speaks your language." })}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("directory.heroBody", { defaultValue: "Multilingual lawyers, doctors, imams, tax advisors, welfare experts, teachers and translators across Germany — searchable by city and language. Free for providers to list, member access for families and clients." })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/directory/list-your-business">{t("directory.listCta", { defaultValue: "List your business — free" })}</Link>
            </Button>
            {!hasAccess && (
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">{t("directory.seePlans", { defaultValue: "See member plans" })}</Link>
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
                placeholder={t("directory.cityPlaceholder", { defaultValue: "Filter by city (Berlin, Munich…)" })}
                className="w-full rounded-lg border border-border/60 bg-background py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map((k) => (
                <button
                  key={k || "all"}
                  onClick={() => setCategory(k)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    category === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`directory.categories.${k || "all"}`, {
                    defaultValue: k === "" ? "All" : k.charAt(0).toUpperCase() + k.slice(1),
                  })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {(isLoading || authLoading) && (
          <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Loading…" })}</p>
        )}
        {!isLoading && !authLoading && listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("directory.emptyPrefix", { defaultValue: "No listings match your filters yet. Be one of the first —" })}{" "}
              <Link to="/directory/list-your-business" className="text-primary underline-offset-4 hover:underline">
                {t("directory.emptyCta", { defaultValue: "list your business for free" })}
              </Link>
              .
            </p>
          </div>
        )}

        {!isLoading && !authLoading && listings.length > 0 && (
          <>
            {!hasAccess && (
              <MemberPaywall signedIn={signedIn === true} />
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


function MemberPaywall({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-hero p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-clay">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("directory.paywall.eyebrow", { defaultValue: "Members only" })}
            </div>
            <h2 className="display-lg text-balance mt-1 font-semibold">
              {t("directory.paywall.title", { defaultValue: "Unlock all verified providers." })}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {t("directory.paywall.body", { defaultValue: "BeistandPlus members get full contact details, phone, email and website for every listing — plus a human case manager who can introduce you. Directory listings are free for providers; access is included with every BeistandPlus plan." })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:shrink-0">
          <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
            <Link to="/pricing">{t("directory.paywall.cta", { defaultValue: "See plans from €5" })}</Link>
          </Button>
          {!signedIn && (
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">{t("directory.paywall.signIn", { defaultValue: "Sign in" })}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


function ListingCard({ listing: l, locked }: { listing: any; locked: boolean }) {
  const { t } = useTranslation();
  const key = String(l.category ?? "other").toLowerCase();
  const Icon = CATEGORY_ICONS[key] ?? LayoutGrid;
  const tone = CATEGORY_TONES[key] ?? "ocean";
  const catLabel = t(`directory.categories.${key}`, {
    defaultValue: key.charAt(0).toUpperCase() + key.slice(1),
  });
  return (
    <PolishedCard glow className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ClayIcon icon={Icon} tone={tone} size="md" />
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold">{l.business_name}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {catLabel}{l.subcategory ? ` · ${l.subcategory}` : ""}
            </div>
          </div>
        </div>
        {l.featured && (
          <Badge className="shrink-0 gap-1 bg-accent text-accent-foreground">
            <Star className="h-3 w-3" /> {t("directory.featured", { defaultValue: "Featured" })}
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
            <div className="flex items-center gap-2 select-none">
              <MapPin className="h-3.5 w-3.5" />
              <span className="rounded bg-muted px-12 py-0.5 text-transparent blur-[3px]">
                {t("directory.addressHidden", { defaultValue: "Full address hidden" })}
              </span>
            </div>
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
              <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> <a href={l.website} target="_blank" rel="noreferrer" className="hover:text-foreground">{t("directory.website", { defaultValue: "Website" })}</a></div>
            )}
            {l.address && (
              <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5" /> <span>{l.address}</span></div>
            )}
          </>
        )}
      </div>

      {!locked && l.address && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
          <iframe
            title={t("directory.mapTitle", { defaultValue: "Map of {{name}}", name: l.business_name })}
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${l.business_name}, ${l.address}, ${l.city ?? ""}`)}&output=embed`}
            className="h-40 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.business_name}, ${l.address}, ${l.city ?? ""}`)}`}
            target="_blank"
            rel="noreferrer"
            className="block bg-muted/40 px-3 py-1.5 text-center text-xs text-primary hover:underline"
          >
            {t("directory.openInMaps", { defaultValue: "Open in Google Maps →" })}
          </a>
        </div>
      )}

      {locked && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> {t("directory.lockedNote", { defaultValue: "Contact, address & map for members" })}
          </span>
          <Link to="/pricing" className="font-medium text-primary hover:underline">
            {t("directory.unlock", { defaultValue: "Unlock →" })}
          </Link>
        </div>
      )}
    </PolishedCard>

  );
}

