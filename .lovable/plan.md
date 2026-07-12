## Polish audit — what's actually inconsistent today

After walking the site, three concrete gaps drive the "unpolished cards / missing 3D icons" feeling:

1. **Flag emojis render as empty boxes** on Chrome/Windows and in the language onboarding + switcher. Only Kurdish (a peace-flag emoji) shows.
2. **ClayIcon / Icon3D barely used.** Grep shows only `src/routes/index.tsx`, `src/routes/services.tsx`, and `src/components/app-sidebar.tsx` use them. Every other card falls back to flat Lucide icons on plain circles — that's the "3D icons not all there".
3. **Card surfaces are inconsistent.** `PolishedCard` (layered gradient, hairline highlight, hover lift, optional teal glow) exists but is not used in dashboard tiles, directory cards, or portal cards — they use ad-hoc `border rounded-xl` boxes.

## Fix (one pass, scoped to the 4 areas you picked)

### 1. Real SVG country flags (kills the tofu boxes everywhere)

- Add `country-flag-icons` (SVG, ~30KB tree-shaken).
- New `src/components/lang-flag.tsx` — maps our 11 `LangCode`s to `GB, DE, TR, PK, IN, IN, AF, SA, IQ (Kurdish region), RU, UA` SVGs, rounded 3:2 corners, subtle inner ring.
- Replace `l.flag` emoji usage in:
  - `src/components/language-onboarding.tsx`
  - `src/components/language-switcher.tsx`

### 2. ClayIcon/Icon3D coverage on every card

Sweep the four surfaces and swap flat Lucide-in-circle for `ClayIcon` (tone chosen per section) or `Icon3D` (where a matching 3D asset already exists in `src/assets/icons3d/`):

- **Landing sections** (`src/routes/index.tsx`, `services.tsx`, `how-it-works.tsx`, `for-providers.tsx`, `pricing.tsx`, `bereavement.tsx`) — feature grids, "how it works" step cards, pricing tier headers.
- **Dashboard tiles** (`src/routes/_authenticated/app.index.tsx`, `portal/kpi-tile.tsx`, `portal/queue-row.tsx`, `portal/activity-item.tsx`) — KPI icons and quick-action tiles.
- **Directory** (`src/routes/directory.tsx`) — category chips + business card leading icon.
- **Portal** (`portal.index.tsx`, `portal.experts.tsx`, `portal.knowledge.tsx`, `portal.leads.tsx`, `portal.referrals.tsx`, `portal.funeral.tsx`, `portal.immigration.tsx`, `portal.insurance.tsx`) — section headers + row leading icons.

Tone map (kept consistent so the site reads as one system): overview→`ocean`, cases→`teal`, documents→`aurora`, benefits→`sun`, healthcare→`mint`, urgent/legal→`coral`, admin→`ink`.

### 3. Unified `PolishedCard` surface

Replace ad-hoc card wrappers in the four surfaces with `PolishedCard` (already exists — layered gradient, hairline top highlight, hover lift; `glow` prop for feature emphasis). No new component work — just adoption. Keep spacing/typography as-is.

### Out of scope (call out explicitly)

- Not touching copy, layout structure, colors, or the design system tokens.
- Not redesigning the hero, nav, or footer.
- Not changing any business logic, data, or routing.

## Verification

After the sweep, Playwright screenshots of `/`, `/services`, `/pricing`, `/directory`, `/app`, `/portal` at 1280×1800; visual diff against current shots for the four surfaces; confirm no flag tofu, every card icon is claymorphic, every card uses `PolishedCard`.

## Estimated blast radius

~15 files edited, 1 new component, 1 dep added. No schema, no server functions, no route changes.

---

**Confirm and I'll ship it.** If you'd rather I only do (1) flags + (2) icons and skip the `PolishedCard` adoption, say "skip 3".
