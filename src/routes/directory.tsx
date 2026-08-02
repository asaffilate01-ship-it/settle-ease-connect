import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { listDirectoryListings } from "@/lib/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Globe,
  MapPin,
  Star,
  ShieldCheck,
  Scale,
  Stamp,
  Calculator,
  HeartHandshake,
  Stethoscope,
  GraduationCap,
  HandHelping,
  Languages,
  Flower2,
  Building2,
  LayoutGrid,
  Plane,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
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
  travel: Plane,
  funeral: Flower2,
  other: LayoutGrid,
};

const CATEGORY_TONES: Record<
  string,
  "ocean" | "teal" | "aurora" | "coral" | "sun" | "mint" | "ink"
> = {
  lawyer: "ocean",
  immigration: "aurora",
  tax: "mint",
  welfare: "sun",
  doctor: "teal",
  medical: "coral",
  education: "aurora",
  religious: "ink",
  translator: "teal",
  travel: "aurora",
  funeral: "coral",
  other: "ocean",
};

const CATEGORY_KEYS = [
  "",
  "lawyer",
  "immigration",
  "tax",
  "welfare",
  "doctor",
  "medical",
  "education",
  "religious",
  "translator",
  "travel",
  "funeral",
  "other",
] as const;

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Members directory — BeistandPlus" },
      {
        name: "description",
        content:
          "Browse provider-submitted multilingual service listings. Confirm credentials, availability and terms directly with the provider.",
      },
      { property: "og:title", content: "Members directory — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Published multilingual service listings with clear independent-provider boundaries.",
      },
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
  const fetchListings = useServerFn(listDirectoryListings);

  const { data, isLoading } = useQuery({
    queryKey: ["directory", category, city],
    queryFn: () =>
      fetchListings({ data: { category: category || undefined, city: city || undefined } }),
  });

  const listings = data?.listings ?? [];
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
            {t("directory.heroBody", {
              defaultValue:
                "Browse published multilingual service listings by city and category. Listings are provider-submitted; confirm professional credentials, availability and engagement terms directly.",
            })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/directory/list-your-business">
                {t("directory.listCta", { defaultValue: "List your business — free" })}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/trust">How provider boundaries work</Link>
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
                placeholder={t("directory.cityPlaceholder", {
                  defaultValue: "Filter by city (Berlin, Munich…)",
                })}
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
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            {t("common.loading", { defaultValue: "Loading…" })}
          </p>
        )}
        {!isLoading && listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("directory.emptyPrefix", {
                defaultValue: "No listings match your filters yet. Be one of the first —",
              })}{" "}
              <Link
                to="/directory/list-your-business"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("directory.emptyCta", { defaultValue: "list your business for free" })}
              </Link>
              .
            </p>
          </div>
        )}

        {!isLoading && listings.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((l: any) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function ListingCard({ listing: l }: { listing: any }) {
  const { t } = useTranslation();
  const key = String(l.category ?? "other").toLowerCase();
  const Icon = CATEGORY_ICONS[key] ?? LayoutGrid;
  const tone = CATEGORY_TONES[key] ?? "ocean";
  const catLabel = t(`directory.categories.${key}`, {
    defaultValue: key.charAt(0).toUpperCase() + key.slice(1),
  });
  const website = safeExternalUrl(l.website);
  return (
    <PolishedCard glow className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ClayIcon icon={Icon} tone={tone} size="md" />
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold">{l.business_name}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {catLabel}
              {l.subcategory ? ` · ${l.subcategory}` : ""}
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
          <Badge key={lang} variant="secondary" className="text-[10px] uppercase">
            {lang}
          </Badge>
        ))}
      </div>

      <div className="relative mt-4 space-y-1.5 text-sm text-muted-foreground">
        {l.city && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> {l.city}
            {l.bundesland ? `, ${l.bundesland}` : ""}
          </div>
        )}
        {website && (
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            <a
              href={website}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground"
            >
              {t("directory.website", { defaultValue: "Provider website" })}
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Confirm identity, professional status, availability, price and engagement terms directly
          before sharing sensitive information.
        </span>
      </div>
    </PolishedCard>
  );
}
