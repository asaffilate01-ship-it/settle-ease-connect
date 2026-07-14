# Project Memory

## Core
Brand: German settlement/welfare super-app for expats & migrants (successor of UK Welfare Society concept).
Consumer tiers: Basic (€5 / €9 fam / €14 fam+), Plus (€10 / €18 / €28), Complete (€25 / €39 / €59). Fam = 2 adults + 3 kids under 18; Fam+ = up to 4 adults + 3 kids. Third-party costs always separate.
Expert comp is HYBRID: referral fee (10–15%) for regulated (lawyers/notaries/tax/doctors), wholesale markup for unregulated (translators/funeral/admin). Set per expert via `compensation_model`.
Payments flow through platform (escrow, Stripe). Three-sided case workspace: client + case manager + expert, full transparency.
Two provider tracks — never conflate: (1) vetted experts (invitation, free, wholesale/referral) at `/portal/experts`; (2) FREE public community directory at `/directory` — listing is free forever, contact details gated to BeistandPlus members only. Never re-introduce a paid listing fee.
Internal knowledge base + expert roster under `/_authenticated/portal/*`, gated by `is_internal()` (admin/staff/case_manager). Families never see these.
Supported languages: DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · FA · PL · ZH.
Launch scope (v1): bereavement, benefits (Bürgergeld, Wohngeld), housing, pensions, disability, unemployment, tax, visa extensions & Blue Card renewals, Kindergeld/Elterngeld, translation at doctors/GPs/hospitals/banks. Student visas come later.
Secure vault: private `vault` bucket, MFA required for sensitive categories, deputies with per-category scope + immediate/on_incapacity/on_death rules, verification via case manager OR multi-deputy confirm.

## Memories
- [Business model](mem://features/business-model.md) — Tiers, hybrid expert comp, escrow, family funeral insurance, launch scope
- [Knowledge base](mem://features/knowledge-base.md) — Internal service SOPs, German regulations, expert roster
- [Provider tiers](mem://features/provider-tiers.md) — Vetted experts vs €10/yr public directory
- [Languages](mem://design/languages.md) — Canonical language list and short codes
