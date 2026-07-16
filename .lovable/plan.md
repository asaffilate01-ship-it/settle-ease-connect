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

### Stage 2 — Case operations polish ✅
- Table: `case_appointments` (RLS via `can_access_case`).
- View: `case_sla_status` (breached / at_risk / on_track / closed / none) with `security_invoker`.
- RPC: `close_case(_case_id, _reason, _report, _request_csat)` — writes closure report, sets `closed_at`, optional CSAT trigger.
- New columns on `cases`: `closed_at`, `closure_reason`, `closure_csat_requested`.
- Portal: `/portal/operations` with SLA dashboard, appointment scheduler, and closure workflow.
- Server fns: `src/lib/case-operations.functions.ts`.

### Stage 2 remnants
- Nightly pg_cron sweep of `cases.sla_due_at` → notifications on breach.
- Document-request task type auto-linking to vault upload.

### Stage 3 — Health-insurance referral flow ✅ (triage)
- `/portal/insurance-triage` — 7-bucket triage (statutory/private/student/employee/self_employed/family/needs_regulated_assessment), "Not advice" banner, factual-notes only, per-route hint on where to hand off.
- Server fns: `src/lib/insurance-triage.functions.ts`.
- Referral record view + partner API/CSV export still to build.

### Stage 4b — Lawyer structure (not built)
- Retainer stays customer↔lawyer. Platform records "administrative case summary" as a `case_documents` row of type `admin_summary`, sent to lawyer with accept/decline. Never presents BeistandPlus as legal advisor. Marketing copy audit needed.

### Stage 4 — Provider (Partner) Portal Engine ✅ (foundation)
- Enums: `partner_category` (10 categories), `translator_service_type` (7 types).
- Tables: `partner_organisations`, `partner_users`, `partner_documents`, `partner_service_categories` (with sworn_courts[]), `partner_service_regions`, `partner_availability`.
- Roles: `partner_admin`, `partner_user`.
- Helpers: `is_partner_member`, `is_partner_admin`, `current_partner_org`.
- `case_assignments` extended with `partner_org_id`, `invited_at`, `accepted_at`, `declined_at`, `decline_reason`.
- `can_access_case` extended so accepted partner org members can see their cases.
- Portal admin: `/portal/partners` — list, create, activate/suspend orgs.
- Partner portal: `/partner` — org profile, assigned cases (accept/decline invitations), documents.
- Still to build: document upload UI, category/region editors, availability editor, translator sworn-court UI, partner document verification workflow.

### Stage 5 — Audit expansion ✅
- `audit_log` is now append-only: UPDATE/DELETE revoked and blocked by trigger.
- Generic `audit_row_change` trigger writes INSERT/UPDATE/DELETE events with per-column diffs (skips timestamp-only churn).
- Attached to: `profiles`, `cases`, `case_documents`, `crm_consents`, `dela_referrals`, `insurance_leads`, `user_roles`, `partner_organisations`, `partner_users`.
- `/portal/audit` (existing) already surfaces the log.

### Stage 6 — UI simplification
Homepage: five clear paths only —
1. I have had a bereavement · 2. I need insurance information · 3. I need help in Germany · 4. I am an organisation / employer · 5. I am a service provider.

Dashboards to build:
- **Customer**: urgent action, active cases, next appointments, missing documents, messages, insurance referrals, benefits applications, case manager, household, payments, vault.
- **Case manager**: urgent cases, SLA breaches, unassigned, tasks due, customer messages, partner responses, missing consent, pending docs, awaiting approval, open complaints.
- **Management**: new leads, conversion rate, active members, MRR, DELA referrals, health referrals, referral acceptance rate, revenue by partner, case volumes, resolution times, CSAT, complaints, staff workload, provider performance.

### Stage 7 — AI (advisory only, human-approval required for regulated domains)
Deferred until core records reliable.
