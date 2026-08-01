import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { CalendarDays, MapPin, Users, Stethoscope, Scale, Receipt, HeartHandshake, Bus, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listUpcomingEvents } from "@/lib/events.functions";
import { listPublicAnnouncements } from "@/lib/announcements.functions";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Free advice clinics & community events — Beistand+" },
      {
        name: "description",
        content:
          "Free health checks, tax, legal and benefits advice from qualified experts, plus community gatherings, workshops and day trips across Germany.",
      },
      { property: "og:title", content: "Free advice clinics & community events — Beistand+" },
      {
        property: "og:description",
        content:
          "Free expert advice clinics and community events for migrant families in Germany. Register online — most events are free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://beistandplus.de/events" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/events" }],
  }),
  component: EventsPage,
});

const FILTERS = [
  { key: "", labelKey: "events.filters.all", fallback: "All" },
  { key: "advice_clinic", labelKey: "events.filters.clinics", fallback: "Advice clinics" },
  { key: "community_gathering", labelKey: "events.filters.community", fallback: "Community" },
  { key: "workshop", labelKey: "events.filters.workshops", fallback: "Workshops" },
  { key: "trip", labelKey: "events.filters.trips", fallback: "Trips & excursions" },
] as const;

const TOPIC_ICON: Record<string, typeof Stethoscope> = {
  health: Stethoscope,
  legal: Scale,
  tax: Receipt,
  benefits: HeartHandshake,
};

function CategoryIcon({ category, sub }: { category: string; sub: string | null }) {
  const Icon = (sub && TOPIC_ICON[sub]) || (category === "trip" ? Bus : category === "advice_clinic" ? Stethoscope : Users);
  return <Icon className="h-4 w-4" />;
}

function EventsPage() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<string>("");
  const fetchEvents = useServerFn(listUpcomingEvents);
  const fetchNotices = useServerFn(listPublicAnnouncements);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events", filter],
    queryFn: () => fetchEvents({ data: filter ? { category: filter } : {} }),
  });
  const { data: notices = [] } = useQuery({
    queryKey: ["public-notices"],
    queryFn: () => fetchNotices(),
  });

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="display-lg font-semibold">
          {t("events.title", "Free clinics & community events")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t(
            "events.subtitle",
            "Regular free advice sessions with qualified experts — basic health checks, tax, legal, benefits and general guidance — plus community gatherings, workshops and day trips. Most events are free to attend.",
          )}
        </p>
      </header>

      {notices.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Megaphone className="h-4 w-4 text-primary" />
            {t("events.notices", "Notices")}
          </div>
          <ul className="mt-3 space-y-3">
            {notices.slice(0, 4).map((n) => (
              <li key={n.id} className="text-sm">
                <span className="font-medium">{n.title}</span>{" "}
                <span className="text-muted-foreground">{n.body}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {t(f.labelKey, f.fallback)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading", "Loading…")}</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("events.empty", "No events scheduled right now — check back soon.")}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <article
              key={e.id}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-soft transition hover:shadow-elevated"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_70%)]" />
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-muted/40 text-primary">
                  <CategoryIcon category={e.category} sub={e.sub_category} />
                </span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {t(`events.categories.${e.category}`, e.category.replace(/_/g, " "))}
                </Badge>
                {e.fee_eur === 0 && (
                  <Badge className="text-[10px] uppercase">{t("events.free", "Free")}</Badge>
                )}
              </div>

              <h2 className="mt-3 font-display text-lg font-semibold leading-snug">{e.title}</h2>
              {e.description && (
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
              )}

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{dateFmt.format(new Date(e.event_date))}</span>
                </div>
                {(e.location || e.city) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{[e.location, e.city].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {e.fee_eur > 0 && (
                  <div className="text-muted-foreground">€{e.fee_eur.toFixed(2)}</div>
                )}
              </dl>

              <Button asChild size="sm" className="mt-4 w-full">
                <Link to="/app/events">{t("events.register", "Register")}</Link>
              </Button>
              {e.is_members_only && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {t("events.membersOnly", "Members only")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
