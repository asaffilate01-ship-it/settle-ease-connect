import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/share-buttons";
import { getPost, BLOG_POSTS, type BlogBlock } from "@/data/blog-posts";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Article not found — BeistandPlus" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post } = loaderData;
    const path = `/blog/${params.slug}`;
    return {
      meta: [
        { title: `${post.title} — BeistandPlus blog` },
        { name: "description", content: post.excerpt },
        { name: "author", content: post.author },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: path },
        { property: "og:image", content: post.cover },
        { property: "article:published_time", content: post.publishedAt },
        { property: "article:section", content: post.category },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: post.cover },
      ],
      links: [{ rel: "canonical", href: path }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            image: [post.cover],
            datePublished: post.publishedAt,
            author: [{ "@type": "Person", name: post.author }],
            publisher: { "@type": "Organization", name: "BeistandPlus" },
          }),
        },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: BlogPost,
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long", day: "numeric" });
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const path = `/blog/${slug}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("blog.back")}
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-muted-foreground">
            {t("blog.publishedOn", { date: dateFmt.format(new Date(post.publishedAt)) })}
            {" · "}
            {t("blog.minRead", { count: post.minutesToRead })}
          </span>
        </div>

        <h1 className="display-hero text-balance mt-4 font-semibold">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

        <div className="mt-6 text-sm text-muted-foreground">
          {t("blog.author", { name: post.author })}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60">
          <img
            src={post.cover}
            alt={post.coverAlt}
            width={1600}
            height={900}
            className="w-full object-cover"
          />
        </div>

        <div className="mt-10 space-y-6">
          {post.body.map((block: BlogBlock, i: number) => {
            if (block.type === "p") {
              return (
                <p key={i} className="text-base leading-relaxed text-foreground/90">
                  {block.text}
                </p>
              );
            }
            if (block.type === "h2") {
              return (
                <h2 key={i} className="mt-8 font-display text-2xl font-semibold">
                  {block.text}
                </h2>
              );
            }
            return (
              <ul key={i} className="list-inside list-disc space-y-1 text-base text-foreground/90">
                {block.items.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-parchment/40 p-5">
          <ShareButtons url={path} title={post.title} />
        </div>
      </article>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">More from the blog</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {related.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img src={p.cover} alt={p.coverAlt} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
              </div>
              <div className="p-5">
                <div className="text-xs text-muted-foreground">{p.category}</div>
                <div className="mt-1 font-display text-lg font-semibold leading-snug">{p.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function PostNotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:py-24 text-center">
        <h1 className="display-lg text-balance font-semibold">Article not found</h1>
        <p className="mt-3 text-muted-foreground">
          The article you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-1 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
