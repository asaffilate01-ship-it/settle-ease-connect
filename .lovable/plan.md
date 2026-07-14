
# Role-specific dashboards — full rollout

Right now every signed-in user lands in one of three shells (`/app`, `/agent`, `/portal`) with the **same** sidebar and home page regardless of role. This plan gives each role a purpose-built portal — its own landing page, its own navigation, and only the surfaces that role actually uses.

Scope agreed:
- Family/Beneficiary (`/app`)
- Experts — lawyer, accountant, doctor, notary, translator, social_worker, funeral_director, mosque, church, temple, hospital
- Agents (`/agent`)
- Internal staff — one focused console per admin domain

## What each role gets

**Family / Beneficiary** — `/app`
Landing: active cases, next actions, checklist progress, benefit reminders, household vault status, upgrade nudge.
Nav: Cases · Checklists · Benefits · Documents · Insurance · Providers · Community · Messages · Settings.

**Experts (all professions)** — new `/expert` shell
Landing: assigned cases queue, quotes to send, open invoices, upcoming appointments, wholesale/referral earnings YTD, verification status.
Nav: My cases · Quotes · Invoices · Payouts · Availability · Profile · Messages.
Profession-specific widgets: lawyers see regulated-referral fee log; translators/funeral/admin see wholesale-rate jobs; mosques/churches/temples/hospitals see community requests.

**Agents** — `/agent` (already exists, refocus)
Landing: this-month commissions, active referrals, pipeline by stage, top-converting share link.
Nav: Clients · Commissions · Referral link · Marketing assets · Payouts.

**Internal staff — one console per admin domain** under `/portal`
- `admin` / `staff` / `case_manager` → `/portal` (global ops console — as today, but no longer shared with the specialists)
- `insurance_admin` → `/portal/insurance` (leads, quotes, callbacks, commission reconciliation)
- `tax_admin` → `/portal/tax` (tax leads, filings, deadlines, TaxFix handoffs)
- `benefits_admin` → `/portal/benefits` (benefit applications, eligibility rules, appeals)
- `medical_admin` → `/portal/medical` (doctor/hospital roster, medical cases, translations)
- `new_arrival_admin` → `/portal/new-arrivals` (arrival playbooks, integration courses, housing)

Each admin console shows KPIs, queue, and activity scoped to **that domain only** — no leaking into unrelated domains.

## How

### 1. Role landing routing
Extend `src/lib/role-landing.ts`:
- Add `EXPERT` bucket → `/expert`
- Split internal roles: each `*_admin` → its own domain URL
- `admin` / `staff` / `case_manager` keep `/portal`
- Auth success + `/` redirect use `landingForRoles()` — already wired.

### 2. New protected shell: `/_authenticated/expert`
- `expert.tsx` — sidebar + header (mirrors `app.tsx` structure, expert-flavored nav)
- `expert.index.tsx` — dashboard (KPI tiles, cases queue, earnings)
- `expert.cases.tsx`, `expert.cases.$caseId.tsx` — reuse existing case detail
- `expert.quotes.tsx`, `expert.invoices.tsx`, `expert.payouts.tsx` — thin wrappers over existing server fns filtered by `experts.user_id = auth.uid()`
- `expert.availability.tsx`, `expert.profile.tsx`
- Profession-specific widget lives inside `expert.index.tsx`, keyed off `experts.profession`.

### 3. Domain consoles under `/_authenticated/portal/*`
For each of insurance / tax / benefits / medical / new-arrivals:
- New index route (e.g. `portal.insurance.index.tsx`) with domain-scoped KPIs + queue.
- Existing surfaces (`portal.leads.tsx`, `portal.insurance.tsx` etc.) become sub-pages of that console.
- New portal sidebar switches automatically based on the admin's role — `admin`/`staff` see all consoles, specialists see only theirs.
- Reuse `getOpsConsole` server fn but add a `domain` filter param (`insurance` | `tax` | `benefits` | `medical` | `new_arrivals`) so it scopes leads/cases/invoices/activity accordingly.

### 4. Consumer app landing polish
- `/app/index.tsx` cleaned to show only family-relevant widgets (already close, minor pass).

### 5. Agent portal polish
- `/agent/index.tsx` rebuilt as a real dashboard (commissions MTD, pipeline, share-link performance) — currently it's basic.

## Delivery order
1. Landing router + role bucket split (foundation).
2. `/expert` shell + dashboard (biggest new surface).
3. Split `/portal` into 5 domain consoles + role-based sidebar.
4. Agent dashboard rebuild.
5. Family dashboard cleanup pass.

## Technical notes
- No schema changes. All scoping done via server functions using `has_role()` and existing FK columns (`experts.user_id`, `case_assignments.expert_id`, `insurance_leads.assigned_to_user_id`, etc.).
- Reuse `PortalHeader`, `KpiTile`, `QueueRow`, `ActivityItem` primitives — no new UI kit.
- New shells copy the layout pattern from `_authenticated/app.tsx` (SidebarProvider + header + Outlet).
- i18n: new nav labels added to all 13 locale files.

This is ~5 sessions of work. I'll do it in the order above; each step ships a usable slice.

Approve and I'll start with step 1 (landing router) + step 2 (`/expert` shell).
