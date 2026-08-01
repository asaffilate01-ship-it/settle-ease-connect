# Plan: Member Financials, Events & Clinics + Full Audit

Three build tracks + one audit pass. All additive — the existing app (cases, CRM, portals, vault, DELA/insurance flows) is not touched except where a new sidebar link plugs in.

---

## Track A — Member Financial Dashboard

A single "My Finances" page at `/app/billing` for every signed-in user, showing:

- Current subscription (plan, price, status, renewal date, cancel-at-period-end flag)
- Funeral cover policy (if any) — plan, monthly contribution, next debit, cover amount, waiting-period status
- **Payments made** — chronological list from Stripe (invoices), with PDF receipt links
- **Payments due** — upcoming invoices (subscription renewals + funeral cover contributions)
- **Failed / past-due** — dunning state with "Update payment method" button (opens Stripe billing portal)
- Lifetime totals (paid to date, active add-ons)
- Download annual statement (CSV)

Data sources — everything already exists:
- `subscriptions` table (populated by Stripe webhook)
- `funeral_policies` table (existing)
- Stripe API for invoice history via a new `getBillingHistory` server fn (uses `createStripeClient` + `stripe.invoices.list`, `stripe.upcomingInvoices`)
- Existing `createPortalSession` for payment-method updates

Add sidebar entry "Billing" for all authenticated users; funeral cover section renders only when a `funeral_policies` row exists.

## Track B — Community Events & Free Advice Clinics

One system, two event types differentiated by a `category` column.

### New tables (single migration)

- `community_events` — id, title, description, category (`advice_clinic` | `community_gathering` | `trip` | `workshop`), sub_category (`health` | `tax` | `legal` | `benefits` | `general` | null), event_date, end_date, location, address, max_attendees, fee_eur (default 0), is_members_only, expert_user_id (nullable — links to advising expert), organiser_user_id, image_url, status (`draft` | `published` | `cancelled` | `completed`), created_at, updated_at
- `event_registrations` — id, event_id, user_id, status (`registered` | `attended` | `cancelled` | `waitlist`), notes, created_at
- RLS: public read of `published` events; users read/manage their own registrations; staff (`is_internal`) full write

### Server functions (`src/lib/events.functions.ts`)

- `listUpcomingEvents({ category? })` — public read via server publishable client
- `getEvent({ id })` — public
- `registerForEvent({ eventId })` — authenticated, capacity check, waitlist fallback
- `cancelRegistration({ registrationId })` — authenticated
- `myRegistrations()` — authenticated
- Staff CRUD: `createEvent`, `updateEvent`, `deleteEvent`, `listRegistrations`, `markAttendance`

### Public pages

- `/events` — landing page with tabs "Free advice clinics" / "Community gatherings" / "Trips & excursions", grid of published upcoming events, filter by city/category
- `/events/$eventId` — detail page with register CTA, expert bio (if `expert_user_id`), map, share buttons; head() metadata per event

### Authenticated pages

- `/app/events` — my registrations + upcoming events I can register for
- `/portal/events` — staff console: create/edit events, view registrations, mark attendance, export CSV, message all registrants (uses existing notifications)

### Homepage & marketing

- New "Free advice clinics" section on `/` and a mention on `/how-it-works`
- Link "Events" in main site header and mobile tab bar

## Track C — Take from SOCIETY APP (careful, additive only)

Ideas worth porting into our German-market model:

- **Payments page pattern** (SOCIETY APP `dashboard/PaymentsPage`) → shape/UX for Track A payments-made list
- **Events page pattern** (SOCIETY APP `PublicEventsPage`) → visual reference for `/events` cards (date band, capacity, fee/free chip, members-only badge)
- **Notices** (community-wide announcements from staff) — add small "Notices" surface on `/app` dashboard, backed by a new `announcements` table, staff-authored via `/portal/announcements`. Localised via existing translation cache.
- **Membership card / QR** — a digital member card at `/app/card` showing name, tier, member number, QR (encodes user_id + plan) for check-in at physical events

Ignored on purpose (out of scope for our product): donations/Zakat, Ghusl team dispatch, member application/approval workflow, tenant-landing multitenancy, admin-approves-members flow.

## Track D — Full audit (translations, wiring, gaps)

### Translation audit
- Sweep all TSX under `src/routes/**` and `src/components/**` for hardcoded English strings introduced during recent iterations (upgrade gate, funeral cover, group cover, checklists, ai-tools, referrals, sessions, assistant, partner-push, copy-audit, portal.checklist-templates)
- Add missing keys to `src/i18n/locales/*/common.json` for all 13 languages: DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · FA · PL · ZH
- Replace hardcoded strings with `t()` calls
- Verify RTL layout on AR / UR / FA / KU pages

### Wiring / persistence audit
- `payments.functions.ts` — confirm webhook writes `funeral_policies` events end-to-end
- `partner_api_pushes` — currently log-only; keep as-is unless partners provide endpoints (documented gap)
- WebAuthn passkey enrol/verify — decision needed: alongside TOTP or replace
- Live chat / WhatsApp widget backend — currently outbound link only; documented gap
- pg_cron sweeps live: SLA breach, monthly commissions, partner-doc expiry, dunning — confirm
- Stripe live-mode + custom email domain — user-action items, documented not blockers

### Gaps flagged for later (not built this pass)
- Group cover self-serve invoice portal for employers
- Expert calendar sync (Google/Outlook OAuth)
- Case timeline PDF export for members
- In-app language auto-detect based on browser locale on first visit

---

## Technical notes

- **Payments listing**: Stripe API paginates; server fn returns latest 50 invoices, "load more" fetches next page via `starting_after`.
- **Event registration**: single transaction with row-level lock on the `community_events` row to prevent overselling; waitlist rows get `status = 'waitlist'` and are auto-promoted on cancellation via a small trigger.
- **`community_events` RLS**: public SELECT allowed on `status='published'` rows only, so `TO anon` grant is safe; owner/staff writes go via `is_internal(auth.uid())`.
- **Announcements table**: `visible_from` / `visible_until` timestamps + `audience` enum (`all` | `basic` | `plus` | `complete` | `staff`) so we don't need extra join tables.
- **Membership card QR** is signed with a short-lived JWT (server fn) so it can be verified at check-in without exposing the user id in plain text.
- **i18n**: keys grouped per feature (`events.*`, `billing.*`, `announcements.*`, `card.*`) with the same shape across all 13 locales.
- **No schema-owned data drift**: everything routes through migrations; seed data (event categories) goes in the same migration.

## Order of work

1. Track A (Billing dashboard) — smallest surface, all data exists
2. Track B (Events & clinics) — one big migration + pages + portal
3. Track C (Notices + membership card) — quick wins from SOCIETY APP
4. Track D (translation sweep + audit report) — final polish

Approve and I'll start on Track A.
