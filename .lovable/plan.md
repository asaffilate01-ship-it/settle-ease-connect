# Staff portal — end-to-end UX, flow & functionality rebuild

Scope: every page under `/portal/*` — overview, leads, cases (new), quotes (new), invoices (new), users, invites, experts, knowledge, funeral partner view. Also the shared shell that wraps them.

## What's wrong today (per page)

- **Overview** — 8 vanity count tiles + two empty inbox stubs. No queue, no priority, no owner, no trend. Half the tiles link to the wrong place (Quotes/Invoices → `/app/cases`, Directory → public site).
- **Leads** — Two-column inbox works but has no unassigned / mine filter, no SLA age, no assignee, no phone-call log, no bulk actions, and status is set with a scattered row of buttons instead of one control.
- **Cases** — There is no staff-side case list at all; staff use the client `/app/cases`. No assignment, no stage filter, no aging.
- **Quotes / Invoices** — No staff pages at all, despite the DB tables existing.
- **Users** — Flat list; role changes work but there's no search-by-role, no last-active, no bulk grant, no invitation status inline.
- **Invites** — Create form + list, but no resend, no bulk send, no CSV import, no expiring-soon signal, no copy-link.
- **Experts** — Read-only roster. No create/edit, no assign-to-case, no availability, no compensation model badge, no filter by service.
- **Knowledge** — Grouped list of services with no search, no create/edit for staff, no linked regulations count, no last-updated.
- **Funeral partner** — 100% mock data pulled from `mock-data.ts`. Not wired to real cases at all.
- **Shell** — Each page reinvents the header. Some render their own `<AppSidebar>` inside the layout that already renders it, doubling the sidebar. No consistent breadcrumb, page title, or action bar.

## What we're building

### 0. Shared staff shell
One `<PortalPage>` wrapper: breadcrumb · title · subtitle · right-side action slot · tab strip slot. Removes the duplicated `<AppSidebar>` imports inside `portal.experts.tsx`, `portal.funeral.tsx`, `portal.knowledge.tsx`. Consistent spacing, sticky header on scroll, "Live · updates every 60s" pill.

### 1. `/portal` — Operations console (replaces "overview")
Three regions:

```text
┌──────────────────────────────────────────────────────────┐
│ Operations                    ● Live · Today ▾ · Mine ▾  │
├─────────────────────────────┬────────────────────────────┤
│ NEEDS ATTENTION  (queue)    │ TODAY  vs 7-day avg        │
│  chips: All Leads Cases     │  6 KPI tiles w/ sparklines │
│         Invites Bugs Quotes │  (leads today, won/week,   │
│                             │   active/stalled cases,    │
│  rows: icon · headline ·    │   € outstanding invoices,  │
│  context · age · owner ·    │   avg time-to-contact)     │
│  [1-click action]           ├────────────────────────────┤
│                             │ MY WORK (assigned to me)   │
│                             ├────────────────────────────┤
│                             │ TEAM ACTIVITY (last 24h)   │
└─────────────────────────────┴────────────────────────────┘
```

Queue rules: unassigned leads · leads > 24h no contact · cases stalled > 48h · invites expiring < 3d · open P1 bugs · quotes waiting on client > 7d. Each row deep-links to the detail page. Scope switch (Everyone / Mine) — non-admins forced to Mine. Time window switch drives the KPIs. Auto-refetch every 60s.

### 2. `/portal/leads` — Inbox rebuild
- Left column adds: **filter bar** (status pills + Mine toggle + search), **age badge** ("2h", "3d", red if > 24h in `new`), **assignee avatar**, **source tag**.
- Detail pane adds: **single status Select** (replaces button row), **assignee picker**, **call-log** (append-only timestamped entries), **estimated commission** (from benefit × broker %), **copy contact block** for the broker email.
- Keyboard: `j/k` next/prev, `1-6` status, `a` assign to me, `n` new note.

### 3. `/portal/cases` — new staff case queue
Table with columns: ID · client · stage · case manager · last update · SLA age · action. Filters: stage, assignee (Mine / Anyone), stalled-only. Row → existing `/app/cases/$id`. Bulk assign / reassign.

### 4. `/portal/quotes` — new
Table of `case_quotes` with case, expert, amount, status, age. Filters: pending / accepted / rejected. Action: **Nudge client** (updates `last_nudged_at`).

### 5. `/portal/invoices` — new
Table of `case_invoices` with case, amount, status (draft / sent / paid / overdue), days-outstanding. Header shows **total € outstanding** and **overdue count**. Actions: Mark sent · Mark paid · Download.

### 6. `/portal/admin/users` — rebuild
- Search + role filter chips + "signed in last 7/30d" filter.
- Row: avatar · name · email · role chips · last active · **compact role editor** (multi-select popover) · overflow menu (impersonate-view, revoke session, delete).
- Bulk grant/revoke via checkbox column.
- Inline "Pending invitation" badge if the email exists in `role_invitations` unaccepted.

### 7. `/portal/admin/invite` — rebuild
- Two panels: **New invite** (email, roles multi-select, expiry days, personal note) and **Pending** table.
- Pending row actions: **Copy link**, **Resend email**, **Extend 7 days**, **Revoke**.
- **CSV import** (email,roles) for bulk seeding.
- "Expiring in < 3 days" badge in red.

### 8. `/portal/experts` — rebuild
- Filters: service, city, language, compensation model (referral / wholesale).
- Row: name · services · languages · comp model badge · status (active / paused).
- Detail drawer: bio, services list with prices, cases currently assigned, "Assign to case…" action.
- Staff can create / edit / pause experts (new server fns behind `is_internal`).

### 9. `/portal/knowledge` — rebuild
- Search across service name + regulation body text.
- Sidebar with categories; main area tabs: **Services** · **Regulations**.
- Each service row shows linked regulations count and last-updated.
- Staff editor: create / edit service (title, summary, SOP markdown, category, linked regulations).

### 10. `/portal/funeral` — wire to real data
Drop `mock-data`. Show real cases where the signed-in user's expert record has `service = 'funeral'` and is `assigned_expert_user_id`. Sections: **New referrals** · **In progress** · **Completed**. Actions: **Accept / Decline referral**, **Upload quote**, **Upload invoice**.

## Sidebar & routing tidy
- Add sidebar entries: Cases (staff), Quotes, Invoices under a "Portal" section; keep Admin subsection collapsed for non-admins.
- Fix overview tile targets to the new pages.
- Remove per-page `<AppSidebar>` imports where the layout already provides one.

## Technical details

### DB (one migration)
- `insurance_leads.assigned_to uuid references auth.users(id)` + GRANT + policy: internal staff can UPDATE.
- `insurance_leads.call_log jsonb default '[]'` — append-only notes with timestamp + actor.
- `case_quotes.last_nudged_at timestamptz` (nullable).
- `case_invoices.status` extend enum to include `overdue` if not already.
- `experts.status text default 'active'` + check (`active`, `paused`).

### Server functions (`src/lib/portal.functions.ts` + new files)
- Replace `getPortalOverview` with `getOpsConsole({ window, scope })` returning `{ kpis, queue, my_work, team_activity }`.
- Add: `listStaffCases`, `assignCase`, `listStaffQuotes`, `nudgeQuote`, `listStaffInvoices`, `markInvoice`, `assignLead`, `appendLeadCallLog`, `listExpertsAdmin`, `upsertExpert`, `upsertKnowledgeService`, `resendInvitation`, `extendInvitation`, `bulkInvite`.
- All behind `requireSupabaseAuth` + `assertInternal`. Non-admins forced to `scope='mine'` server-side.

### New routes
- `src/routes/_authenticated/portal.cases.tsx`
- `src/routes/_authenticated/portal.quotes.tsx`
- `src/routes/_authenticated/portal.invoices.tsx`

### Rebuilt routes
- `portal.index.tsx`, `portal.leads.tsx`, `portal.admin.users.tsx`, `portal.admin.invite.tsx`, `portal.experts.tsx`, `portal.knowledge.tsx`, `portal.funeral.tsx`.

### Shared components
- `src/components/portal/portal-page.tsx` — shell wrapper.
- `src/components/portal/kpi-tile.tsx` — value + delta + inline SVG sparkline.
- `src/components/portal/queue-row.tsx`, `activity-item.tsx`, `assignee-picker.tsx`, `age-badge.tsx`.

### i18n
Extend `en` and `de` common.json with the new strings; keep keys under `portal.*`.

### Not in scope this pass
- Real-time WebSocket subscriptions (60s poll is enough).
- Full audit-log table (activity feed derived from existing `updated_at` columns).
- Visual redesign (palette, typography, motion). Once flow + functionality are right, I'll run the design-directions flow on the new console — say the word.

## Suggested rollout order
1. Shared shell + sidebar tidy + `/portal` console rebuild (highest-visibility).
2. Leads + Cases + Assignment migration (daily-driver flows).
3. Quotes + Invoices (missing surfaces).
4. Users + Invites overhaul.
5. Experts + Knowledge editors.
6. Funeral partner real data.

Approve and I'll start at step 1 in the next turn. If you'd rather do a smaller first slice (e.g. just the console + leads), say which and I'll trim.
