# Multilingual rollout (12 languages, no mixing)

**Languages:** EN · DE · TR · UR · HI · PA · AR · KU · RU · UK · FA · PL · ZH
**RTL languages:** AR, UR, FA, KU (auto `dir="rtl"` + font stack)

## Approach

Use `react-i18next` with JSON resource files per language. Every visible string moves behind a `t("key")` call. No hardcoded copy in components. First visit shows a full-screen language picker; header globe dropdown lets users change any time. Choice persists in `localStorage` and, when signed in, in `profiles.preferred_language`.

## Ship in stages (one turn each)

**Turn 1 — Infrastructure + chrome + Home (this turn)**
- Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`
- `src/i18n/index.ts` + `src/i18n/locales/{code}/common.json` for all 12 langs
- `<LanguageProvider>` in `__root.tsx`, sets `<html lang dir>`
- `LanguageSwitcher` (globe dropdown) in `SiteHeader` and `AppSidebar`
- First-visit `LanguageOnboarding` modal
- Translate: `SiteHeader`, `SiteFooter`, `AppSidebar`, `/` (home)

**Turn 2 — Marketing pages**
- `/services`, `/pricing`, `/how-it-works`, `/for-providers`, `/bereavement`, `/contact`, `/directory`, `/directory/list-your-business`, `/auth`

**Turn 3 — Family app (`/app/*`)**
- Dashboard, cases, documents, vault, messages, checklists, plan, settings

**Turn 4 — Internal portal (`/portal/*`)**
- Overview, cases, experts, knowledge base, invoices, subscriptions

**Turn 5 — Dynamic content**
- Add `title_i18n jsonb` columns to `knowledge_services`, `directory_listings`, `subscription_plans` etc. so DB-driven copy is localised too
- Backfill EN/DE, fallback chain

## Translation source

AI-generated (Lovable AI, `google/gemini-2.5-flash`) at build-key-add time in a small script under `scripts/translate.ts`. I run it, commit JSON, you can hand-edit any key later. Each language file marks AI-generated keys with `_ai: true` so a native speaker can review.

## Technical details

- Namespace per surface (`common`, `home`, `services`, `app`, `portal`) to keep JSON files small
- Pluralisation via i18next's built-in `count` support
- Interpolation for prices/dates via `Intl.NumberFormat` and `Intl.DateTimeFormat` with the active locale
- SEO: `<html lang>` set per request; each route's `head()` reads `t()` for title/description; add `hreflang` alternates in `__root.tsx`
- RTL: root layout toggles `dir="rtl"` for AR/UR/FA/KU; Tailwind logical properties (`ps-*`, `pe-*`, `ms-*`, `me-*`) replace `pl-*`/`pr-*` in flipped components
- Font stack: add Noto Sans Arabic / Urdu / Devanagari / Gurmukhi / SC via `<link>` in `__root.tsx`, apply via `:lang(ar)` etc. in `styles.css`
- Persisted preference: `localStorage.lang` + `profiles.preferred_language` when authenticated

## Out of scope for this rollout

- Translating user-generated content (case notes, messages) — that stays in the language the author typed it
- Legal documents (Terms, Privacy) — need a solicitor's review, not AI translation; I'll leave EN + DE only for now

Confirm this plan and I'll execute Turn 1.
