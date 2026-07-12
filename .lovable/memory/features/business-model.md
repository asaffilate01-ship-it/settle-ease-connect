---
name: Business model
description: Consumer tiers (individual, family, family+), hybrid expert compensation, escrow payments, family funeral insurance, launch scope
type: feature
---

# Consumer subscription tiers

Three tiers, three household sizes each (9 plans total, all in `subscription_plans`):

| Tier | Individual | Family (2A+3C) | Family+ (4A+3C) |
| --- | --- | --- | --- |
| Basic | €5/mo | €9/mo | €14/mo |
| Plus | €10/mo | €18/mo | €28/mo |
| Complete | €25/mo | €39/mo | €59/mo |

- **Family** = up to 2 adults + up to 3 children under 18
- **Family+** = up to 4 adults + up to 3 children under 18
- `plan_group` (basic/plus/complete) + `household_kind` (individual/family/family_plus) identify the variant. `max_adults`/`max_children` are enforced when members are added to a household.

Third-party fees (lawyers, notaries, doctors, tax, govt) are ALWAYS separate from subscription — paid via platform escrow or direct to the expert.

# Expert compensation (hybrid)
- **Regulated (lawyers, notaries, tax, doctors)** → referral fee 10–15% (safer under §49b BRAO)
- **Unregulated (translators, funeral, admin, imams)** → wholesale rate + platform markup

Set per expert via `experts.compensation_model` (`referral` | `wholesale`) and `experts.referral_fee_pct`.

# Payments
- All third-party payments flow through the platform (Stripe escrow-style)
- Subscription billing = Stripe with full tax compliance
- On completion: release to expert, auto-deduct referral fee or markup

# Three-sided case workspace
Client + case manager + expert see the same case with tasks, quotes, invoices, messages (staff-only notes for internal), documents, audit log. RLS via `can_access_case()`.

# Family funeral insurance
Optional add-on to any Complete plan. One premium covers the whole household — repatriation, funeral costs, estate coordination. Underwritten by regulated partners, paid directly to insurer (third-party).

# Launch scope (v1)
Bereavement & death admin · Benefits (Bürgergeld, Wohngeld) · Housing & rental · Pensions · Disability · Unemployment · Tax · Visa extensions & Blue Card renewals · Kindergeld / Elterngeld · Translation for doctors, GPs, hospitals, banks.

Student visas, study add-ons, and business/employment support come after launch.
