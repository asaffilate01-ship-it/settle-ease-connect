import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/community")({
  component: CommunityPage,
});

const events = [
  { title: "Freitagsgebet & community lunch", where: "Şehitlik-Moschee, Berlin", when: "Fr · 13:15", tag: "Mosque" },
  { title: "Urdu-speaking women's circle", where: "Neukölln community centre", when: "Sa · 10:00", tag: "Community" },
  { title: "Newcomer orientation (EN)", where: "BeistandPlus HQ, Kreuzberg", when: "Sa · 15:00", tag: "BeistandPlus" },
  { title: "German conversation cafe", where: "Café Kotti", when: "So · 11:00", tag: "Language" },
  { title: "Kids Quran class", where: "Şehitlik-Moschee", when: "Sa · 09:00", tag: "Family" },
  { title: "Diwali celebration", where: "Sri Ganesha Tempel", when: "Nov 4 · 18:00", tag: "Temple" },
];

function CommunityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Community</h1>
        <p className="text-sm text-muted-foreground">Find your people. Prayer times, events, groups, and gatherings near you.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={Users} title="Nearby groups" value="14" sub="Berlin, within 5 km" />
        <Card icon={MapPin} title="Mosques & temples" value="9" sub="Verified in your area" />
        <Card icon={Calendar} title="Events this week" value="12" sub="From your saved groups" />
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">This week</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <div key={e.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between">
                <div className="font-medium">{e.title}</div>
                <Badge variant="outline" className="border-accent/40 bg-accent/10">{e.tag}</Badge>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <div>{e.where}</div>
                <div>{e.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, value, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
