import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listEmbassies } from "@/lib/immigration.functions";

export const Route = createFileRoute("/_authenticated/app/immigration")({
  head: () => ({
    meta: [
      { title: "Immigration team & embassy directory" },
      {
        name: "description",
        content:
          "Contact your embassy or consulate in Germany. Our immigration team helps with visas, passport renewal, and repatriation.",
      },
    ],
  }),
  component: ImmigrationPage,
});

function ImmigrationPage() {
  const fetchEmbassies = useServerFn(listEmbassies);
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("all");
  const { data: embassies = [], isLoading } = useQuery({
    queryKey: ["embassies"],
    queryFn: () => fetchEmbassies({ data: {} }),
  });

  const cities = useMemo(() => {
    const s = new Set<string>();
    (embassies as any[]).forEach((e) => s.add(e.city));
    return ["all", ...Array.from(s).sort()];
  }, [embassies]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (embassies as any[]).filter((e) => {
      if (city !== "all" && e.city !== city) return false;
      if (!s) return true;
      return [e.country, e.country_code, e.city, ...(e.languages ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(s);
    });
  }, [embassies, q, city]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Immigration team
        </div>
        <h1 className="display-lg font-semibold">Embassies & consulates in Germany</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Our immigration team maintains direct contacts at all embassies in Berlin and the major
          consulates around the country — for visa renewals, emergency travel documents, and
          repatriation.
        </p>
      </header>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="font-semibold">Need help now?</div>
        <p className="mt-1 text-sm text-muted-foreground">
          For visa applications, family reunification, passport emergencies, deportation defence, or
          repatriation of a loved one, open a case and we'll assign an immigration case manager who
          liaises with the mission directly.
        </p>
        <a
          href="/app/cases/new"
          className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Open immigration case
        </a>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by country, city or language…"
            className="pl-9"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {cities.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All cities" : c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((e: any) => (
            <article
              key={e.id}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-semibold">{e.country}</span>
                <Badge variant="secondary">{e.mission_type.replace(/_/g, " ")}</Badge>
                <span className="text-xs text-muted-foreground">{e.country_code}</span>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {e.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {e.address}
                  </div>
                )}
                {e.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />{" "}
                    <a href={`tel:${e.phone}`}>{e.phone}</a>
                  </div>
                )}
                {e.emergency_phone && (
                  <div className="flex items-center gap-2 text-red-600">
                    <Phone className="h-4 w-4" /> Emergency: {e.emergency_phone}
                  </div>
                )}
                {e.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                    <a href={`mailto:${e.email}`}>{e.email}</a>
                  </div>
                )}
                {e.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />{" "}
                    <a
                      href={e.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
              {(e.visa_services?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {e.visa_services.map((s: string) => (
                    <Badge key={s} variant="secondary">
                      {s.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
              {(e.languages?.length ?? 0) > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Languages: {e.languages.join(", ")}
                </div>
              )}
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No missions match your search. Ask our immigration team — we can reach honorary
              consulates and non-listed contacts.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
