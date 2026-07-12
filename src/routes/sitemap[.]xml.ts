import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://beistandplus.de";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

// Public, indexable routes only. Auth/portal routes are excluded via robots.txt.
const ENTRIES: SitemapEntry[] = [
  { path: "/",                         changefreq: "weekly",  priority: "1.0" },
  { path: "/how-it-works",             changefreq: "monthly", priority: "0.9" },
  { path: "/services",                 changefreq: "monthly", priority: "0.9" },
  { path: "/bereavement",              changefreq: "monthly", priority: "0.9" },
  { path: "/directory",                changefreq: "weekly",  priority: "0.8" },
  { path: "/directory/list-your-business", changefreq: "monthly", priority: "0.6" },
  { path: "/for-providers",            changefreq: "monthly", priority: "0.8" },
  { path: "/pricing",                  changefreq: "monthly", priority: "0.9" },
  { path: "/blog",                     changefreq: "weekly",  priority: "0.7" },
  { path: "/contact",                  changefreq: "yearly",  priority: "0.5" },
  { path: "/impressum",                changefreq: "yearly",  priority: "0.3" },
  { path: "/privacy",                  changefreq: "yearly",  priority: "0.3" },
  { path: "/terms",                    changefreq: "yearly",  priority: "0.3" },
  { path: "/cookies",                  changefreq: "yearly",  priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = ENTRIES.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
