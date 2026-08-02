import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS, localizePost } from "@/data/blog-posts";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — BeistandPlus" },
      {
        name: "description",
        content:
          "General organisational guides for navigating paperwork, referrals and difficult life events in Germany.",
      },
      { property: "og:title", content: "Blog — BeistandPlus" },
      {
        property: "og:description",
        content: "Plain-language organisational guides from BeistandPlus.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://beistandplus.de/blog" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { t, i18n } = useTranslation();
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const localized = BLOG_POSTS.map((p) => localizePost(p, i18n.language));
  const [featured, ...rest] = localized;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
            {t("blog.title")}
          </div>
          <h1 className="display-hero text-balance mt-3 font-semibold">{t("blog.subtitle")}</h1>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/blog/$slug"
          params={{ slug: featured.slug }}
          className="group grid gap-8 overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated lg:grid-cols-2 lg:p-8"
        >
          <div className="overflow-hidden rounded-2xl">
            <img
              src={featured.cover}
              alt={featured.coverAlt}
              width={1600}
              height={900}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{featured.category}</Badge>
              <span className="text-muted-foreground">
                {dateFmt.format(new Date(featured.publishedAt))} ·{" "}
                {t("blog.minRead", { count: featured.minutesToRead })}
              </span>
            </div>
            <h2 className="display-lg text-balance mt-4 font-semibold">{featured.title}</h2>
            <p className="mt-3 text-base text-muted-foreground">{featured.excerpt}</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {t("blog.readMore")} <ArrowRight className="h-4 w-4 rtl-flip" />
            </span>
          </div>
        </Link>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.cover}
                  alt={post.coverAlt}
                  width={1600}
                  height={900}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-muted-foreground">
                    {dateFmt.format(new Date(post.publishedAt))} ·{" "}
                    {t("blog.minRead", { count: post.minutesToRead })}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {t("blog.readMore")} <ArrowRight className="h-4 w-4 rtl-flip" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
