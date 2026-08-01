import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { submitContactEnquiry } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BeistandPlus" },
      { name: "description", content: "Send a secure enquiry to the BeistandPlus team in Berlin." },
      { property: "og:title", content: "Contact — BeistandPlus" },
      { property: "og:description", content: "We're in Berlin. We answer in DE, EN, TR, UR, HI, PA, AR, KU, RU, UK, FA and PL." },
      { property: "og:url", content: "https://beistandplus.de/contact" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { t, i18n } = useTranslation();
  const submitEnquiry = useServerFn(submitContactEnquiry);
  const [form, setForm] = useState({ fullName: "", email: "", message: "", website: "" });
  const submit = useMutation({
    mutationFn: () =>
      submitEnquiry({
        data: {
          ...form,
          preferredLanguage: i18n.resolvedLanguage ?? i18n.language,
        },
      }),
    onSuccess: () => setForm({ fullName: "", email: "", message: "", website: "" }),
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">{t("pages.contact.eyebrow")}</div>
          <h1 className="display-hero text-balance mt-3 font-semibold">
            {t("pages.contact.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("pages.contact.subtitle")}
          </p>
          <div className="mt-10 space-y-5 text-sm">
            <Row icon={Mail} label={t("pages.contact.generalEnq")} value="hallo@beistandplus.de" />
            <Row icon={MapPin} label={t("pages.contact.office")} value="Berlin · visits by appointment" />
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft"
        >
          {submit.isSuccess && (
            <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {t("pages.contact.thanks")}
            </div>
          )}
          {submit.isError && (
            <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {(submit.error as Error).message}
            </div>
          )}
          <div className="grid gap-4">
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium">{t("pages.contact.name")}</label>
              <Input
                id="contact-name"
                required
                autoComplete="name"
                placeholder={t("pages.contact.namePh")}
                className="mt-1"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm font-medium">{t("pages.contact.email")}</label>
              <Input
                id="contact-email"
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="text-sm font-medium">{t("pages.contact.message")}</label>
              <Textarea
                id="contact-message"
                required
                minLength={10}
                maxLength={4000}
                placeholder={t("pages.contact.messagePh")}
                className="mt-1 min-h-32"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              />
            </div>
            <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              />
            </div>
            <Button type="submit" className="bg-gradient-primary" disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submit.isPending ? "Sending…" : t("pages.contact.send")}
            </Button>
            <p className="text-xs text-muted-foreground">
              We use your details only to respond to this enquiry. See our privacy notice for more information.
            </p>
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
