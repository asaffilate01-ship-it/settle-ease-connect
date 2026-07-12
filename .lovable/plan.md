# Full i18n & Layout Audit

The scope is large (40+ route files, 11 languages, 4 RTL scripts, hundreds of hardcoded strings). Doing it well means splitting into three focused waves rather than one giant unreviewable dump.

## What's broken today

- **Coverage**: home page has 3 `t()` calls in 836 lines; most marketing + app pages are hardcoded English (or German).
- **RTL**: `dir="rtl"` is not applied on `<html>` when Arabic / Urdu / Pashto / Kurdish is selected — icons, flex rows, arrows all stay left-aligned.
- **Typography**: fixed classes like `text-5xl` / `text-6xl` overflow in German, Russian, Ukrainian, Punjabi. Cards use `truncate` in the wrong places, causing translated headings to be clipped.
- **Card rows**: several headers use bare `flex flex-wrap` (fails the min-w-0 / shrink-0 rule), so translated labels push widgets off-screen on mobile.
- **Number/date formatting**: raw strings like `"€10 / month"` don't localise.

## Wave 1 — foundation (this turn)

1. **RTL wiring**: apply `dir` + `lang` to `<html>` on language change; add a `[dir="rtl"]` global stylesheet block that flips icon margins, chevrons, and text-align defaults.
2. **Responsive display type**: replace ad-hoc `text-6xl` heroes with a `.display-hero` / `.display-lg` / `.display-md` utility using `clamp()` so headings shrink cleanly for long translations.
3. **Card safety pattern**: add `text-balance` on card titles, `text-pretty` on descriptions, and switch known-broken header rows to the grid + `min-w-0` + `shrink-0` pattern.
4. **Home page (`index.tsx`) full translation** across all 11 locales, since it's the highest-traffic surface.
5. **Language switcher**: also sets `document.documentElement.dir` and persists in `localStorage`.

## Wave 2 — marketing pages (next turn)

Translate + layout-fix, one page per parallel batch: pricing, services, directory, bereavement, students, blog list, for-providers, how-it-works, contact, legal index.

## Wave 3 — authenticated app (turn after)

Translate + layout-fix all `_authenticated/app.*` and `_authenticated/portal.*` routes. Portal (staff) can stay DE/EN only since staff is internal.

## Technical notes

- Locale files stay in `src/i18n/locales/<lang>/common.json`. Keys grouped by page (`home.*`, `pricing.*`, `students.*`, …).
- New CSS utilities live in `src/styles.css` under `@utility`:
  - `display-hero` → `font-size: clamp(2.25rem, 5vw + 1rem, 4.5rem); text-wrap: balance;`
  - `display-lg`, `display-md` similar clamps
  - `[dir="rtl"] .flip-rtl { transform: scaleX(-1); }` for chevrons/arrows
- Language switcher writes `document.documentElement.setAttribute("dir", isRTL(code) ? "rtl" : "ltr")` and `lang`.
- Translations for languages without a native speaker on the team are AI-generated with the existing tone — mark them with `// TODO review` in a `TRANSLATIONS.md` if you want a follow-up review pass.

## Deliverable this turn (Wave 1)

- `src/styles.css`: RTL rules + display utilities + card safety helpers
- `src/routes/__root.tsx`: `<html lang dir>` synced to i18n
- `src/components/language-switcher.tsx` (or existing): set `dir` on change
- `src/routes/index.tsx`: every string via `t()`, headings use `display-*` utilities, header rows use the responsive grid pattern
- 11 × `src/i18n/locales/<lang>/common.json`: full `home.*` block

Estimate: ~15 file edits this turn.
