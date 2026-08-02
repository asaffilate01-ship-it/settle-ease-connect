import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listUpcomingEvents,
  myRegistrations,
  registerForEvent,
  cancelRegistration,
} from "@/lib/events.functions";

export const Route = createFileRoute("/_authenticated/app/events")({
  head: () => ({ meta: [{ title: "Events & clinics — Beistand+" }] }),
  component: MemberEventsPage,
});

function MemberEventsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const fetchEvents = useServerFn(listUpcomingEvents);
  const fetchMine = useServerFn(myRegistrations);
  const register = useServerFn(registerForEvent);
  const cancel = useServerFn(cancelRegistration);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["member-events"],
    queryFn: () => fetchEvents({ data: {} }),
  });
  const { data: mine = [] } = useQuery({
    queryKey: ["my-event-registrations"],
    queryFn: () => fetchMine(),
  });

  const regByEvent = new Map(
    mine.filter((r) => r.status !== "cancelled").map((r) => [r.event_id, r]),
  );

  const join = useMutation({
    mutationFn: (eventId: string) => register({ data: { eventId, guests: 0 } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-event-registrations"] });
      toast.success(
        res.status === "waitlist"
          ? t(
              "events.waitlisted",
              "Added to the waiting list — we'll let you know if a place opens.",
            )
          : t("events.registered", "You're registered. See you there!"),
      );
    },
    onError: (e: any) => toast.error(e?.message ?? t("events.failed", "Could not register")),
  });

  const drop = useMutation({
    mutationFn: (registrationId: string) => cancel({ data: { registrationId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-event-registrations"] });
      toast.success(t("events.cancelled", "Registration cancelled"));
    },
    onError: (e: any) => toast.error(e?.message ?? t("events.failed", "Could not update")),
  });

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const upcomingMine = mine.filter((r) => r.status !== "cancelled" && r.event);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">
          {t("events.memberTitle", "Events & free clinics")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "events.memberSubtitle",
            "Book a free advice clinic with a qualified expert, or join a community gathering, workshop or trip.",
          )}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          {t("events.yourBookings", "Your bookings")}
        </h2>
        {upcomingMine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("events.noBookings", "You have no bookings yet.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {upcomingMine.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <span className="truncate font-medium">{r.event?.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {r.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.event ? dateFmt.format(new Date(r.event.event_date)) : "—"}
                    {r.event?.location ? ` · ${r.event.location}` : ""}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={drop.isPending}
                  onClick={() => drop.mutate(r.id)}
                >
                  {t("events.cancelAction", "Cancel")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          {t("events.upcoming", "Upcoming events")}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading", "Loading…")}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("events.empty", "No events scheduled right now — check back soon.")}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => {
              const reg = regByEvent.get(e.id);
              return (
                <article
                  key={e.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {t(`events.categories.${e.category}`, e.category.replace(/_/g, " "))}
                    </Badge>
                    {e.fee_eur === 0 && (
                      <Badge className="text-[10px] uppercase">{t("events.free", "Free")}</Badge>
                    )}
                    {e.is_members_only && (
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {t("events.membersOnly", "Members only")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{e.title}</h3>
                  {e.description && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {dateFmt.format(new Date(e.event_date))}
                    </div>
                    {(e.location || e.city) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {[e.location, e.city].filter(Boolean).join(", ")}
                      </div>
                    )}
                    {e.max_attendees != null && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t("events.capacity", "{{count}} places", { count: e.max_attendees })}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    disabled={!!reg || join.isPending}
                    onClick={() => join.mutate(e.id)}
                  >
                    {reg
                      ? reg.status === "waitlist"
                        ? t("events.onWaitlist", "On waiting list")
                        : t("events.booked", "Booked")
                      : t("events.register", "Register")}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
