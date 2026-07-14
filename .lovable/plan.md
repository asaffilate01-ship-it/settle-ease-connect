# Close all remaining gaps

Six workstreams, ordered by user-visible impact. I'll execute them in this order and stop between blocks if you want to redirect.

## 1. Hydration mismatch (blocking runtime error)
Root cause: `useLanguage` initialises `useState((appI18n.language as LangCode) || "en")`. If the i18n singleton is ever mutated before the first client render (module init race, HMR, or view transition mid-navigation), SSR ("de") ≠ client (e.g. "ar") and every `useTranslation` consumer mismatches.

Fix:
- Always initialise client state to `DEFAULT_LANG` (matches SSR unconditionally).
- Gate the saved-language `changeLanguage` call behind a `useHydrated()` flag so it only runs after the first commit.
- Add a `<LanguageBridge>` in `__root.tsx` that owns the effect once, instead of every consumer re-triggering it.

## 2. Agent dashboard rebuild (`agent.index.tsx`)
Currently 4 KPI tiles + last-10 referrals. Plan called for:
- MTD earnings sparkline (last 30 days).
- Pipeline by stage (pending → converted → paid) as a horizontal funnel with counts + €.
- Share-link performance: clicks, sign-ups, conversion %, top source.
- Recent referrals table stays but gains product-mix chip.

New server fn `getMyAgentDashboard` in `agents.functions.ts` returning `{ kpis, sparkline, pipeline, linkStats, recent }` in one round-trip.

## 3. Expert case detail actions (`expert.cases.$caseId.tsx`)
Today it's a thin wrapper. Add:
- Send quote drawer (title, amount, model, expiry) → `sendExpertQuote` server fn.
- Issue invoice drawer (amount, description) → `issueExpertInvoice` server fn.
- Case timeline (events + quotes + invoices merged).
- Message case manager button (deep-links to `/app/messages/$channelId`).

## 4. Domain sub-console tabs
Each of `portal.tax.tsx` / `portal.insurance.tsx` / `portal.medical.tsx` / `portal.new-arrivals.tsx` / `portal.benefits.tsx` gains an in-page tab bar: **Leads · Quotes · Callbacks · Reconciliation**. Same URL, tab state via `?tab=` search param — no new route files needed.

## 5. i18n nav labels for the 11 non-EN/DE locales
Add `nav.expert.*`, `nav.portal.insurance`, `nav.portal.medical`, `nav.portal.newArrivals`, `nav.portal.benefits`, `nav.agent.*` keys to `tr / ur / hi / pa / ar / ku / fa / ru / uk / pl / zh` common.json — machine-translated first pass, native strings for the top 6 languages by user base (TR, AR, UR, RU, FA, PL).

## 6. Blog translations
6 new posts have EN bodies only. Generate DE + TR + AR full-body translations first (highest-traffic non-EN), keep other 9 locales falling back to EN with a small `translation.pending` banner on the article page so it doesn't feel broken.

## Files touched (approx.)
- edit: `src/hooks/use-language.ts`, `src/routes/__root.tsx`
- edit: `src/routes/_authenticated/agent.index.tsx`, `src/lib/agents.functions.ts`
- edit: `src/routes/_authenticated/expert.cases.$caseId.tsx`, `src/lib/expert-portal.functions.ts`
- edit: 5 `portal.<domain>.tsx` files
- edit: 11 locale `common.json` files
- edit: `src/data/blog-posts.ts` (+DE/TR/AR bodies for 6 posts)

## Not doing (unless you say so)
- Native strings for locales beyond top-6 (auto-translate fallback stays).
- Full-body blog translations for 9 remaining locales.
- Redesigning existing single-page domain consoles beyond adding the tab bar.

Confirm and I'll execute 1 → 6 in order. Or point to which of the six matters most and I'll do just those.