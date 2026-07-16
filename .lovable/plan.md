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

### Stage 1 remnants — Auth & permissions hardening (partial ✅)
- `app_role` enum expanded: added `family_deputy`, `senior_case_manager`, `team_leader`, `finance`, `compliance`, `dpo`, `auditor` alongside existing roles.
- HIBP password check enabled via `configure_auth` (leaked-password protection now active on sign-up + password change).
- MFA enforcement, session/device history, and passkeys still deferred (Supabase Auth MFA UI required).

### Stage 2 — Case operations polish ✅
- Table: `case_appointments` (RLS via `can_access_case`).
- View: `case_sla_status` (breached / at_risk / on_track / closed / none) with `security_invoker`.
- RPC: `close_case(_case_id, _reason, _report, _request_csat)` — writes closure report, sets `closed_at`, optional CSAT trigger.
- New columns on `cases`: `closed_at`, `closure_reason`, `closure_csat_requested`.
- Portal: `/portal/operations` with SLA dashboard, appointment scheduler, and closure workflow.
- Server fns: `src/lib/case-operations.functions.ts`.

### Stage 2 remnants ✅
- `sla_breach_sweep()` SECURITY DEFINER function + hourly `pg_cron` job (`sla-breach-sweep` at `0 * * * *`) writes `sla_breach` notifications to the case manager when a case passes its `sla_due_at`, deduped by `entity_id` + created_at.
- Document-request task type auto-linking to vault upload — still deferred.

### Stage 3 — Health-insurance referral flow ✅ (triage)
- `/portal/insurance-triage` — 7-bucket triage (statutory/private/student/employee/self_employed/family/needs_regulated_assessment), "Not advice" banner, factual-notes only, per-route hint on where to hand off.
- Server fns: `src/lib/insurance-triage.functions.ts`.
- CSV export ✅ — `exportInsuranceLeadsCsv` server fn + "Export CSV" button on `/portal/insurance-triage` (admin/insurance_admin only, up to 5000 rows). Partner API push still deferred.

### Stage 4b — Lawyer structure ✅ (foundation)
- `case_documents.doc_type` column added (default `general`). Lawyer/admin flows can now attach an `admin_summary` doc to a case for lawyer accept/decline (retainer stays customer↔lawyer). Marketing copy audit still to do.

### Stage 4 — Provider (Partner) Portal Engine ✅
- Enums: `partner_category` (10 categories), `translator_service_type` (7 types).
- Tables: `partner_organisations`, `partner_users`, `partner_documents`, `partner_service_categories` (with sworn_courts[]), `partner_service_regions`, `partner_availability`.
- Roles: `partner_admin`, `partner_user`.
- Helpers: `is_partner_member`, `is_partner_admin`, `current_partner_org`.
- `case_assignments` extended with `partner_org_id`, `invited_at`, `accepted_at`, `declined_at`, `decline_reason`.
- `can_access_case` extended so accepted partner org members can see their cases.
- Portal admin: `/portal/partners` — list, create, activate/suspend orgs, **document verification queue** (approve/reject with notes; staff-only via `is_internal`).
- Partner portal: `/partner` — org profile, assigned cases (accept/decline), documents, **services editor** (categories + translator sworn-court chips), **coverage editor** (city/Bundesland/PLZ prefix/radius), **weekly availability editor** (weekday + start/end + accepts_urgent).
- Document upload UI ✅ — `partner-docs` bucket with folder-scoped RLS. Upload card supports 7 categories, valid-until date, 25 MB PDF/image.
- Server fns: `src/lib/partner-docs.functions.ts`, `src/lib/partner-editors.functions.ts` (categories, regions, availability, doc verification queue).

### Stage 5 — Audit expansion ✅
- `audit_log` is now append-only: UPDATE/DELETE revoked and blocked by trigger.
- Generic `audit_row_change` trigger writes INSERT/UPDATE/DELETE events with per-column diffs (skips timestamp-only churn).
- Attached to: `profiles`, `cases`, `case_documents`, `crm_consents`, `dela_referrals`, `insurance_leads`, `user_roles`, `partner_organisations`, `partner_users`.
- `/portal/audit` (existing) already surfaces the log.

### Stage 6 — UI simplification (management dashboard ✅)
- `/portal/management` — executive KPI dashboard: growth (new leads, conversion, active members, MRR), referrals (DELA / insurance / triage backlog), operations (active/breached/closed cases, avg resolution), quality (CSAT, complaints), staff workload top 10, provider performance top 10. Live refresh every 60 s. Admin-only.
- Server fn: `src/lib/management-kpi.functions.ts`.

### Stage 6b — Case-manager focused dashboard ✅
- `/portal/my-desk` — per-user view: open cases (with SLA state), tasks due within 7 days (overdue flagged), pending partner invitations on my cases, breach & overdue counters. Refetch every 60 s.
- Server fn: `src/lib/case-manager-desk.functions.ts` (`getMyDesk`).

### Stage 6c — Customer overview polish ✅
- `/app` dashboard now pulls real data via `getCustomerOverview`: open cases count with breached/at-risk state, real vault document count, "cases needing docs" callout.
- New "Needs your attention" section: SLA alerts (breached + at_risk), next appointments (30-day window), cases missing documents. Refetches every 60 s.
- Server fn: `src/lib/customer-overview.functions.ts`.

Homepage five-path IA ✅
- `FivePaths` section on `/` (bereavement / insurance / help in Germany / employer / provider) linking to `/bereavement`, `/insurance`, `/services`, `/partnerships`, `/for-providers`.


### Stage 7 — AI (advisory only, human-approval required for regulated domains)
Deferred until core records reliable.
