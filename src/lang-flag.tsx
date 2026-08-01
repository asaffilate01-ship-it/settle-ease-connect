import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string; // ISO date
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long", day: "numeric" });
  return (
    <article className="prose-legal max-w-none">
      <h1 className="display-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("legal.lastUpdated", { date: dateFmt.format(new Date(updated)) })}
      </p>
      <div className="mt-8 space-y-8">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/85 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-5">
        {children}
      </div>
    </section>
  );
}

export function BilingualNote() {
  const { t } = useTranslation();
  return (
    <div className="mb-8 flex items-start gap-3 rounded-xl border border-border/60 bg-parchment/40 p-4 text-sm text-foreground/80">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{t("legal.onlyDeEn")}</p>
    </div>
  );
}
