import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BeistandPlus" },
      { name: "description", content: "Reach the BeistandPlus team in Berlin. 24/7 bereavement line and general enquiries." },
      { property: "og:title", content: "Contact — BeistandPlus" },
      { property: "og:description", content: "We're in Berlin. We answer in DE, EN, TR, UR, HI, PA, AR, KU, RU, UK, FA and PL." },
      { property: "og:url", content: "https://beistandplus.de/contact" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/contact" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Contact</div>
          <h1 className="display-hero mt-3 font-semibold">
            We're here, in the language you speak.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            For bereavement, call our 24/7 line. For everything else, drop us a
            note — we reply within one business day.
          </p>
          <div className="mt-10 space-y-5 text-sm">
            <Row icon={Phone} label="24/7 bereavement line" value="+49 30 1234 5678" />
            <Row icon={Mail} label="General enquiries" value="hallo@beistand.de" />
            <Row icon={MapPin} label="Office" value="Kreuzberg, Berlin · Termine nach Vereinbarung" />
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Vielen Dank — wir melden uns bald.");
          }}
          className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft"
        >
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input required placeholder="Ihr Name" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">E-Mail</label>
              <Input required type="email" placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Nachricht</label>
              <Textarea required placeholder="Wie können wir helfen?" className="mt-1 min-h-32" />
            </div>
            <Button type="submit" className="bg-gradient-primary">Nachricht senden</Button>
          </div>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
