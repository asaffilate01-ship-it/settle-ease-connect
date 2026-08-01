import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/lib/contact.functions";
import { Mail, Phone, MapPin, Loader2, CheckCircle2 } from "lucide-react";

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
  const { t } = useTranslation();
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
            <Row icon={Phone} label={t("pages.contact.line24")} value="+49 30 1234 5678" />
            <Row icon={Mail} label={t("pages.contact.generalEnq")} value="hallo@beistand.de" />
            <Row icon={MapPin} label={t("pages.contact.office")} value={t("pages.contact.officeValue")} />
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert(t("pages.contact.thanks"));
          }}
          className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft"
        >
          <div className="grid gap-4">
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium">{t("pages.contact.name")}</label>
              <Input id="contact-name" required placeholder={t("pages.contact.namePh")} className="mt-1" />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm font-medium">{t("pages.contact.email")}</label>
              <Input id="contact-email" required type="email" placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <label htmlFor="contact-message" className="text-sm font-medium">{t("pages.contact.message")}</label>
              <Textarea id="contact-message" required placeholder={t("pages.contact.messagePh")} className="mt-1 min-h-32" />
            </div>
            <Button type="submit" className="bg-gradient-primary">{t("pages.contact.send")}</Button>
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
