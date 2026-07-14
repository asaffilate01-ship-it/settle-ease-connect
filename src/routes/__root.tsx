import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "@/i18n";
import { LanguageOnboarding } from "@/components/language-onboarding";
import { CookieConsent } from "@/components/cookie-consent";
import { Toaster } from "@/components/ui/sonner";
import { useLanguage } from "@/hooks/use-language";
import { initNative } from "@/lib/native";
import { OfflineIndicator } from "@/components/offline-indicator";
import { installOfflineQueue } from "@/lib/offline-queue";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display-hero text-balance font-semibold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Diese Seite gibt es nicht</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for isn't here. Let's get you back on your way.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Something didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again — we'll re-fetch fresh data. If it persists, our team is
          notified.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#faf8f5" },
      { title: "BeistandPlus · Ankommen, Sozialleistungen & Vorsorge in Deutschland — in 13 Sprachen" },
      {
        name: "description",
        content:
          "BeistandPlus begleitet Familien in Deutschland beim Ankommen, bei Sozialleistungen, Dokumenten und Vorsorge am Lebensende. Eine ruhige Plattform in 13 Sprachen — mit menschlichen Case Managern und geprüften Fachleuten.",
      },
      { name: "author", content: "BeistandPlus GmbH" },
      { property: "og:site_name", content: "BeistandPlus" },
      { property: "og:title", content: "BeistandPlus · Ankommen, Sozialleistungen & Vorsorge in Deutschland — in 13 Sprachen" },
      {
        property: "og:description",
        content:
          "BeistandPlus begleitet Familien in Deutschland beim Ankommen, bei Sozialleistungen, Dokumenten und Vorsorge am Lebensende. Eine ruhige Plattform in 13 Sprachen — mit menschlichen Case Managern und geprüften Fachleuten.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://beistandplus.de/" },
      { property: "og:locale", content: "de_DE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@beistandplus" },
      { name: "twitter:title", content: "BeistandPlus · Ankommen, Sozialleistungen & Vorsorge in Deutschland — in 13 Sprachen" },
      { name: "twitter:description", content: "BeistandPlus begleitet Familien in Deutschland beim Ankommen, bei Sozialleistungen, Dokumenten und Vorsorge am Lebensende. Eine ruhige Plattform in 13 Sprachen — mit menschlichen Case Managern und geprüften Fachleuten." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/15cef64f-21c8-4c27-b3c3-fe949b953ad7" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/15cef64f-21c8-4c27-b3c3-fe949b953ad7" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Fira+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Fira+Mono:wght@400;500;700&display=swap",
      },
      // Multi-script font stack for the 13 supported languages:
      // Arabic (ar), Urdu Nastaliq (ur), Persian (fa), Arabic script for Kurdish (ku),
      // Devanagari (hi), Gurmukhi (pa), Simplified Chinese (zh).
      // Cyrillic (ru/uk) and Latin (de/en/tr/pl) are covered by Fira Sans.
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const PRE_HYDRATION_LANG_SCRIPT = `(function(){try{var l=localStorage.getItem('beistand.lang');if(l&&l!=='de'){var d=document.documentElement;d.setAttribute('data-lang-pending',l);d.setAttribute('lang',l);if(l==='ar'||l==='ur'||l==='fa'||l==='ku')d.setAttribute('dir','rtl');var s=document.createElement('style');s.setAttribute('data-lang-gate','');s.textContent='html[data-lang-pending] body{visibility:hidden!important}';document.head.appendChild(s);setTimeout(function(){var g=document.querySelector('style[data-lang-gate]');if(g)g.remove();d.removeAttribute('data-lang-pending');},1500);}}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_HYDRATION_LANG_SCRIPT }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!mounted) return;
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    // Native shell bootstrap (no-op on the web build).
    initNative(() => {
      // Let TanStack Router handle history; return false so the plugin falls back.
      return false;
    });
    installOfflineQueue();

    // Capture ?ref=<agent_code> for attribution (60-day window).
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && /^[a-zA-Z0-9_-]{3,32}$/.test(ref)) {
        document.cookie = `bp_ref=${encodeURIComponent(ref)}; Max-Age=${60 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
        try { localStorage.setItem("bp_ref", ref); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [queryClient, router]);
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageBridge />
      <Outlet />
      <LanguageOnboarding />
      <CookieConsent />
      <OfflineIndicator />
      <Toaster />
    </QueryClientProvider>
  );
}

/** Keeps <html lang> and <html dir> in sync with the active i18next language. */
function LanguageBridge() {
  useLanguage();
  return null;
}
