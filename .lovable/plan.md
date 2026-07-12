## What you get

Two parallel additions — one for the **client's own record** (life-admin data they enter), one for the **business** (referral revenue engine). Both mirror the existing client-view / staff-view split you already have for insurance and benefits.

---

## 1. Client life-admin sections

New sub-area under `/app/profile/*` (client-facing) with a mirrored `/portal/clients/$id/life-admin/*` view for case managers.

Sections, each its own tab + table:

- **Employment** — current + past employers, role, start/end, gross salary, contract type (unbefristet / befristet / minijob / freelance / civil servant), tax class, Sozialversicherungsnummer reference, works council contact, HR email. Used to pre-fill unemployment, sickness, parental-leave claims.
- **Pensions** — separate rows for: Deutsche Rentenversicherung (statutory), Betriebsrente (employer/occupational), Riester, Rürup, private pension policies. Fields: provider, policy no., contribution, start date, projected payout, beneficiary. Links to the existing insurance module for private policies.
- **Health insurance** — GKV vs PKV flag, Krankenkasse name, membership no., tariff, monthly premium, dependants covered, Zusatzversicherung (dental/hospital/travel) as child rows.
- **Emergency & trusted contacts** — next of kin, medical proxy, executor, employer HR, GP, lawyer, accountant, embassy. Role + name + phone + email + preferred language + notes.
- **"Whom to inform" playbooks** — pre-built checklists for events: **death, serious illness / hospitalisation, work injury, redundancy / end of service, long-term disability, birth of child, marriage, divorce, relocation abroad**. Each event lists: authorities to notify (Standesamt, Finanzamt, Rentenversicherung, Krankenkasse, Ausländerbehörde…), insurers/pensions to claim against (auto-populated from the client's own pensions + insurance rows), documents required, statutory deadlines, and a "generate case" button that spawns a case with pre-filled tasks assigned to the right admin role (medical_admin, benefits_admin, tax_admin, lawyer, notary…).
- **Other benefits & claims quick-check** — a wizard that reads the client's employment + pensions + health rows and lists everything they may be eligible to claim right now (Krankengeld, Übergangsgeld, Berufsunfähigkeit, Hinterbliebenenrente, Unfallrente, Elterngeld, ALG I/II, Wohngeld…) — reuses the existing benefits-eligibility engine.

Staff view adds a read/write panel with an audit trail and the ability to attach vault documents (payslips, contracts, pension statements, insurance certificates) to any row.

---

## 2. Referral revenue engine

New module `/portal/referrals` (internal only) + a lightweight client-facing "Recommended partners" panel on the relevant pages.

**Partner catalog** — a `referral_partners` table covering:
- Insurers (health, life, disability, liability, household, car, travel)
- Lawyers & notaries
- Tax advisors & accountants
- Movers & relocation companies
- Airlines & travel booking
- Currency transfer (Wise, Revolut Business)
- Language schools, driving schools
- Real-estate agents & Anmeldung services
- Utilities & telecoms

Each partner: name, category, countries, languages, contact, tracking link (with our `?ref=welfare-de&sub={case_id}` params), commission model (flat / % of first premium / % recurring / CPL / CPA), currency, kickback %, payout terms.

**Lead lifecycle** — `referral_leads` table tracks: partner, client (optional — some leads are anonymous), case (optional), source page, created_at, status (`sent → clicked → registered → converted → paid → clawback`), commission expected, commission received, invoice reference.

**Where leads originate**
- Insurance module: existing "Register with provider" button now creates a lead + rewrites the outbound URL with tracking params.
- Life-admin "whom to inform" playbooks: relevant partner cards inline (e.g. probate lawyer for a death event, movers for relocation).
- Knowledge base articles: contextual "Need help with this? Book a partner" CTA.
- Directory listings: paid directory entries already exist — referral track is separate and internal-only.

**Revenue reporting** — dashboard for admin + tax_admin with monthly commission expected vs received, per-partner P&L, per-case attribution (so the case manager sees which of their cases generated referral revenue), and CSV export for accounting.

**Invoicing** — extends the existing `case_invoices` table with a `referral_income` line type so the client-facing invoice can transparently show "€0 charged to you, €X earned from partner" when we want to disclose it, or hide it when we don't (per-partner disclosure flag).

---

## Database (new tables, all RLS-gated)

```text
employment_records         (client_user_id, employer, role, start/end, salary, tax_class, hr_contact, …)
pensions                    (client_user_id, kind, provider, policy_no, contribution, beneficiary, …)
health_insurance            (client_user_id, kind gkv/pkv, kasse, tariff, premium, dependants, …)
trusted_contacts            (client_user_id, role, name, phone, email, language, notes)
life_event_playbooks        (seed data: death, illness, injury, redundancy, disability, birth, marriage, divorce, relocation)
life_event_playbook_steps   (playbook_id, order, actor_role, title, description, deadline_days, doc_refs)
referral_partners           (name, category, url_template, commission_model, commission_rate, disclose_to_client)
referral_leads              (partner_id, client_user_id?, case_id?, status, commission_expected, commission_received, …)
```

Client rows: only owner + assigned case_manager + `is_internal()` can read/write.
Referral tables: `is_internal()` read, admin write; partners table read-open to clients for the "recommended" cards (only `disclose_to_client = true` rows).

---

## Files to add / edit

- migrations: 1 for life-admin tables, 1 for referral tables + seed partners + seed playbooks
- `src/data/life-event-playbooks.ts` — seed data mirror for the UI
- `src/data/referral-partners.ts` — seed catalog (~40 partners across categories)
- `src/routes/_authenticated/app.profile.employment.tsx`
- `src/routes/_authenticated/app.profile.pensions.tsx`
- `src/routes/_authenticated/app.profile.health.tsx`
- `src/routes/_authenticated/app.profile.contacts.tsx`
- `src/routes/_authenticated/app.profile.events.tsx` — playbooks + "generate case" action
- `src/routes/_authenticated/portal.clients.$id.life-admin.tsx` — staff mirror
- `src/routes/_authenticated/portal.referrals.tsx` — pipeline + revenue dashboard
- `src/routes/_authenticated/portal.referrals.partners.tsx` — partner CRUD
- `src/lib/referrals.functions.ts` — `createReferralLead`, `markConverted`, `recordCommission`
- `src/lib/life-admin.functions.ts` — CRUD + `generateCaseFromEvent`
- `src/components/app-sidebar.tsx` — add Profile group for clients, Referrals for admin/tax_admin
- extend `src/routes/_authenticated/app.insurance.tsx` to route the "Register" button through `createReferralLead`

---

## Order of build

1. Migrations (life-admin + referrals + seeds)
2. Server functions
3. Client life-admin routes
4. Referral portal + partner catalog
5. Wire insurance / knowledge / event playbooks to emit leads
6. Sidebar + role-landing updates

Approve and I'll ship it in that order. Say if you want any partner categories added or removed, or if referral commissions should always be disclosed on client invoices (default: per-partner flag, hidden unless flagged).