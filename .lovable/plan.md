# CRM + Case Management — Native BeistandPlus Module

This is a large build. Proposing scope, phasing, and schema so we can ship in reviewable chunks rather than one mega-change. Please approve or edit before I start.

## Principles

- Not a bolted-on CRM. Extends the existing `profiles` / `cases` / `subscriptions` / `insurance_leads` / `funeral_leads` tables already in the DB.
- One master **customer record** = `profiles.id` (auth user). Non-auth prospects get a lightweight `crm_contacts` row that later merges into a profile on signup.
- Strict regulated/unregulated separation: introductory support (Beistand) and regulated insurance advice live in different tables, different roles, different UI, with a hard consent gate between them.
- Internal only. Lives under `/portal/*`, gated by `is_internal()`. Families never see the CRM surface.

## Phase 1 — Foundation (this plan)

**Schema (new tables, all with RLS + GRANTs):**

- `crm_contacts` — prospect record for people not yet signed up (name, lang, phone, email, city, source, campaign, utm_*, consent flags, merged_into_profile_id).
- `crm_consents` — append-only consent log (contact_id or user_id, purpose enum: `marketing`, `contact`, `insurance_referral`, `data_share_partner`, `regulated_advice`, method, evidence, granted_at, revoked_at, language).
- `crm_leads` — enquiry pipeline row (contact_id/user_id, lead_type enum, source, campaign, stage enum, owner_staff_id, priority, next_action_at, sla_due_at, service_interest[], notes).
  - Stages: `new` → `contact_attempted` → `assessed` → `consented` → `service_identified` → `membership_proposed` → `insurance_referral_offered` → `referred_to_partner` → `partner_outcome` → `onboarded` → `ongoing` / `lost`.
- `crm_activities` — every touchpoint (call, email, WhatsApp, SMS, meeting, note, system_event). Powers the "complete activity history".
- `crm_follow_ups` — scheduled follow-ups + reminders (due_at, channel, assignee, done, snoozed_until). pg_cron nightly sweep creates `notifications` rows.
- `crm_complaints` — complaint intake + status + resolution + satisfaction score.
- `crm_satisfaction` — CSAT/NPS after case closure.
- `crm_campaigns` — campaign registry (name, channel, utm, budget, active).
- Extend `insurance_leads`: add `stage` enum matching the regulated pipeline (`enquiry` → `marketing_lead` → `consent_to_contact` → `referral` → `regulated_advice` → `application` → `policy_accepted` → `commission_due` → `commission_paid`), `partner_id`, `commission_amount`, `commission_status`.
- Extend `agent_commissions` link → `crm_leads.id` for reconciliation.

**Views on the customer record** (no new tables — read joins on `profiles.id`):
Personal · Language · Household (existing `family_members`) · Immigration (existing `cases` where type immigration) · Comms prefs (existing `notification_preferences`) · Consents (`crm_consents`) · Plan (`subscriptions`) · Insurance referrals (`insurance_leads`) · Welfare cases (`cases`) · Legal referrals (subset of `cases`) · Funerals (`funeral_leads` + `funeral_policies`) · Documents (`vault_documents` staff-shared subset + `case_documents`) · Payments (`case_invoices` + Stripe records) · Complaints (`crm_complaints`) · Activity (`crm_activities` + `case_events`).

**Portal UI (Phase 1):**

- `/portal/crm` — global inbox: leads, follow-ups due today, unassigned enquiries, SLA breaches.
- `/portal/crm/contacts` — searchable list of contacts + profiles unified.
- `/portal/crm/contacts/$id` — the master customer record with all the sections above as tabs.
- `/portal/crm/leads` — kanban across the 11 pipeline stages, filter by type/owner/language.
- `/portal/crm/leads/$id` — lead detail: activity timeline, next action, convert-to-case button, consent panel.
- `/portal/crm/complaints` — list + detail.
- Widgets on existing `/portal` index: today's follow-ups, new enquiries, SLA at risk.

**Regulated / unregulated firewall:**

- New role `insurance_advisor` (regulated). Only they can move an `insurance_leads` row past `consent_to_contact`.
- Case managers and general staff see a locked banner + no edit controls after `referral` stage.
- Every stage advance writes a `crm_consents` requirement check; the UI blocks progression without the matching consent row.

## Phase 2 — Case journeys (separate plan/turn)

Build the eight structured journeys as **case templates** — a template = ordered list of stages + required tasks + required documents + required consents, applied to a `cases` row on creation. Highest-value first:

1. Funeral in Germany (full workflow you listed — death reported → aftercare).
2. International repatriation.
3. Funeral-expense insurance referral.
4. Statutory health-insurance referral.
5. Private health-insurance referral.
6. Welfare / benefits assistance.
7. Immigration-law referral.
8. Translation / document support.

New tables: `case_templates`, `case_template_stages`, `case_template_tasks`, and columns on `cases` for `template_code`, `stage`, `sla_due_at`, `risk_level`, `priority`, `closure_report`. `case_tasks` already exists and gets auto-populated from the template.

Aftercare = a scheduled `crm_follow_ups` row 14/30/90 days post-closure.

## Phase 3 — Reconciliation & analytics

- Partner commission reconciliation screen (`/portal/financials` extension): match `insurance_leads.commission_*` against partner CSV imports.
- Campaign attribution report (leads → members → LTV) by `utm_*`.
- CSAT dashboard.

## What I'll ship in the first turn if you approve

1. One migration for all Phase 1 tables + RLS + GRANTs + the `insurance_leads` extension.
2. Server functions in `src/lib/crm.functions.ts` (list/get/create/update for contacts, leads, activities, follow-ups, complaints; stage transitions with consent gating).
3. Portal routes: `/portal/crm` (inbox), `/portal/crm/contacts`, `/portal/crm/contacts/$id` (master record with tabbed sections wired to existing tables), `/portal/crm/leads` (kanban), `/portal/crm/leads/$id`, `/portal/crm/complaints`.
4. Sidebar entry under the internal portal, gated by `is_internal()`.

## Questions before I build

1. **Non-auth prospects**: OK to introduce `crm_contacts` for people who haven't signed up, and auto-merge into `profiles` when they later create an account (by email/phone match)? Or should every lead require a profile up-front?
2. **Regulated role**: create a new `insurance_advisor` app_role, or reuse existing `insurance_admin`?
3. **Phase 1 scope**: ship CRM foundation only this turn, and do the 8 case-journey templates in a follow-up? Or do you want funeral-in-Germany + repatriation templates included in Phase 1?
4. **Data import**: any existing lead/contact list to import, or start empty?
