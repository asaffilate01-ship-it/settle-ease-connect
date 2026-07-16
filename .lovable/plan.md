# BeistandPlus — Native CRM + Compliance Roadmap

## Shipped

### Phase 1 — CRM Foundation
- Tables: `crm_contacts`, `crm_consents`, `crm_leads`, `crm_activities`, `crm_follow_ups`, `crm_complaints`, `crm_satisfaction`, `crm_campaigns`. `insurance_leads` extended with regulated pipeline stages.
- Portal: `/portal/crm` (inbox, contacts, leads kanban, complaints).
- Server fns: `src/lib/crm.functions.ts`.

### Phase 2 — Case Templates (Journeys)
- Tables: `case_templates`, `case_template_stages`, `case_template_tasks`. `cases` extended with `template_code`, `current_stage`, `sla_due_at`, `risk_level`, `priority`, `closure_report`.
- 8 templates seeded (Funeral-DE and Repatriation with full stages+tasks; 6 others stage-only).
- `apply_case_template(case_id, template_code)` RPC.
- Portal: `/portal/case-templates`.

### Phase 3 — Reconciliation & Analytics
- `/portal/analytics` — attribution by UTM, CSAT/NPS, commission reconciliation (CSV import + mark-paid).

### DELA Referral Flow (Regulated Introducer)
- Table: `dela_referrals` with full lifecycle (disclosure → consent → info → contact method → send → partner ack → application → policy → commission → renewal/cancellation).
- Table: `regulated_action_log` (append-only, insert-only via Data API).
- Health-insurance triage enum (`health_triage_route`) with 7 buckets; triage columns on `insurance_leads`.
- **Regulated firewall trigger** on `insurance_leads` and `dela_referrals`: DB-enforced that only `insurance_admin`/`admin` can advance past consent or write `advice_notes`/`recommendation_text`/`suitability_notes`. Attempts logged whether blocked or allowed.
- Portal: `/portal/dela` — stage-by-stage compliance UI with disclosure/consent versioning, advisor-only outcome panel.

---

## Not yet built — sequenced for follow-up turns

### Stage 1 remnants — Auth & permissions hardening
- Expand `app_role` enum: `family_deputy`, `senior_case_manager`, `team_leader`, `partner_user`, `partner_admin`, `finance`, `compliance`, `dpo`, `auditor`. (Some already exist: admin, staff, case_manager, insurance_admin, tax_admin, benefits_admin, medical_admin, new_arrival_admin, expert, agent, family.)
- MFA policy: mandatory for staff/partner/admin (Supabase Auth MFA + enforcement on sign-in guard).
- Session policy: expiry, device history table, suspicious-login alerts (`auth_events` with pg_cron sweep to `notifications`).
- Password policy: HIBP check via `configure_auth`; strong password validator on client.
- Optional passkeys (WebAuthn) — deferred.

### Stage 2 — Case operations polish
- Case-stage timers (SLA breach flag via nightly pg_cron sweep of `cases.sla_due_at`).
- Appointments table + calendar view.
- Document-request task type auto-linking to vault upload.
- Case closure flow with mandatory closure report + CSAT trigger.

### Stage 3 — Health-insurance referral flow
- Triage screen `/portal/insurance/triage` (7 buckets, "not advice" banner, notes).
- Referral record view showing partner, consent, data transferred, privacy notice version, partner-contacted flag, application status, policy status, commission, cancellation.
- Partner API stub / secure CSV export.

### Stage 4 — Provider (Partner) Portal Engine
Single engine, category-typed profiles. Categories: funeral director, lawyer, translator, religious org, hospital, airline, driving school, childcare, relocation.

- Tables: `partner_organisations`, `partner_users`, `partner_documents` (licence, insurance, bank), `partner_service_regions`, `partner_service_categories`, `partner_availability`.
- For translators: `sworn_court` array + `translator_service_type` enum (general, interpreting, certified, sworn, medical, authority-appointment, urgent-phone).
- Case invitations: extend `case_assignments` with `invited_at`, `accepted_at`, `declined_at`, `decline_reason`.
- Partner routes at `/partner/*` behind `_authenticated` + `partner_admin`/`partner_user` roles.
- Partner sees only cases assigned to their org (RLS: `EXISTS assignment WHERE partner_org_id = my_org_id`).
- Translators see only documents `released_for_translation = true`.
- Insurance partners see only their referral rows.

### Stage 4b — Lawyer structure
- Retainer stays customer↔lawyer. Platform records "administrative case summary" as a `case_documents` row of type `admin_summary`, sent to lawyer with accept/decline. Never presents BeistandPlus as legal advisor. Marketing copy audit needed.

### Stage 5 — Audit expansion
- `audit_log` already exists — add insert triggers on: `profiles`, `cases`, `case_documents`, `crm_consents`, `dela_referrals`, `insurance_leads`, `vault_documents` (view/download), `user_roles` (grant/revoke).
- Ensure append-only: revoke UPDATE/DELETE on `audit_log` from all roles except migrations.

### Stage 6 — UI simplification
Homepage: five clear paths only —
1. I have had a bereavement · 2. I need insurance information · 3. I need help in Germany · 4. I am an organisation / employer · 5. I am a service provider.

Dashboards to build:
- **Customer**: urgent action, active cases, next appointments, missing documents, messages, insurance referrals, benefits applications, case manager, household, payments, vault.
- **Case manager**: urgent cases, SLA breaches, unassigned, tasks due, customer messages, partner responses, missing consent, pending docs, awaiting approval, open complaints.
- **Management**: new leads, conversion rate, active members, MRR, DELA referrals, health referrals, referral acceptance rate, revenue by partner, case volumes, resolution times, CSAT, complaints, staff workload, provider performance.

### Stage 7 — AI (advisory only, human-approval required for regulated domains)
Deferred until core records reliable.
