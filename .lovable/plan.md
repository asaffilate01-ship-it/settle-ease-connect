## Phase A — i18n cleanup & wiring

### A1. Canonical locale set (13)
Keep: `de, en, tr, ur, hi, pa, ar, ku, ru, uk, fa, pl, zh`
Remove: `bs, hr, sq, sr, ti, so, vi, pt-BR, fr, ps` (folders deleted)
Add: `pl` (Polish), `zh` (Simplified Chinese)
Update `src/i18n/config.ts` language list, `language-onboarding.tsx`, `language-switcher.tsx`, and `lang-flag.tsx` to match.

### A2. Translation completeness
For each of the 13 locales, ensure `common.json` has full parity with `en/common.json` (nav, footer, language, hero, sidebar, agent, plus new keys added below). I will fill gaps using existing translations as reference + native-quality DE-EU-migrant phrasing (not literal machine translation).

### A3. Wire `useTranslation` into pages that currently hardcode English
Public: `index.tsx`, `services.tsx`, `pricing.tsx`, `how-it-works.tsx`, `contact.tsx`, `blog.tsx`, `blog.$slug.tsx`, `legal.tsx` (+ children).
Agent portal: verify `agent.index/clients/commissions/link` all read from `t()` (they should already — I will audit).
Authenticated app shell: `app.tsx` sidebar, `app.index.tsx`, `app.cases.tsx`, `app.messages.tsx`, `app.profile.tsx`, `app.notifications.tsx` (labels/tabs/CTAs only — leave user-generated content untouched).

New translation namespaces added to each locale: `home`, `services`, `pricing`, `howItWorks`, `contact`, `blog`, `legal`, `appShell`.

### A4. Font sizes & script-specific rendering
Add per-script CSS overrides in `src/styles.css`:
- **Arabic/Farsi/Urdu/Kurdish (RTL)**: `dir="rtl"`, use `Noto Naskh Arabic` at +1px body size, tighter line-height for headings, flip iconography via `[dir=rtl]` selectors on sidebar/nav.
- **Hindi/Punjabi (Devanagari/Gurmukhi)**: `Noto Sans Devanagari` / `Noto Sans Gurmukhi`, increase body from 16→17px (matras clip at 16).
- **Chinese**: `Noto Sans SC`, tabular numerics, tighter letter-spacing, larger body 17px.
- **Cyrillic (RU/UK)**: default stack already works — verify no clipped headings.
- **Tigrinya-style scripts**: not applicable after cleanup.

Root route wires `<html lang dir>` from i18n current language, and adds `<link>` tags for the Noto webfonts in the `<head>` (per project rule: no `@import` remote in styles.css).

### A5. Verification
- Playwright: load `/` in each of the 13 languages via `?lng=xx`, screenshot hero + pricing + footer. Visually confirm no overflow, no clipped diacritics, correct RTL flip.
- Compare `en/common.json` keyset against every other locale — fail loudly if any key is missing.

---

## Phase B — Business-model audit & punch-list

Deliverable: written report (no code changes in this phase) covering:

1. **Payments / escrow** — status of `useStripeCheckout`, `subscription_plans` table, whether webhook route `/api/public/webhooks/stripe` exists, whether escrow release logic is implemented. Recommend `enable_stripe_payments` (built-in) if not yet enabled.
2. **Public directory** (`/directory`, €10/yr) — schema, listing CRUD, payment flow, moderation.
3. **Expert onboarding** — invitation flow, `experts.compensation_model` toggle UI, wholesale vs referral routing.
4. **Three-sided case workspace** — client/case-manager/expert views on `app.cases.$caseId`, staff-only notes, `can_access_case()` RLS.
5. **Knowledge base** under `/portal/knowledge` — content status, SOP coverage.
6. **Email templates** — auth + transactional, across 13 languages.
7. **Family funeral insurance** add-on.

Each item classified: ✅ shipped · 🟡 partial · ❌ missing, with next concrete step.

---

## Technical notes

- Locale removal is `rm -rf src/i18n/locales/{bs,hr,sq,sr,ti,so,vi,pt-BR,fr,ps}`. Config file drives dropdown, so unreferenced folders vanish from UI automatically.
- Font loading: add `<link rel="preconnect">` + `<link rel="stylesheet">` to Google Fonts Noto family inside `__root.tsx` `head()`, not CSS `@import`.
- HTML `dir` attribute set via `useEffect` in root component reading `i18n.language`; alternatively via `useLanguage()` hook (already exists per file listing).
- No route file changes required for language switching — `useLanguage` hook + i18next handle it.

---

## Out of scope (this plan)
- Rewriting business copy or marketing content.
- Backend schema changes (Phase B is audit-only).
- New feature work beyond what's already in the codebase.

I will pause after Phase A for you to spot-check translations before starting Phase B.