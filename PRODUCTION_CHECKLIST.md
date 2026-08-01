# BeistandPlus production checklist

The repository now fails safe around entitlements, sensitive documents and the unfinished payout workflow. A production launch still requires the external evidence and operational decisions below.

## Required before public launch

- Apply every Supabase migration through `20260801160000_production_hardening.sql` in staging, then production.
- Rotate every credential formerly committed in `.env` and `.env.development`; deletion from the current tree is not credential revocation.
- Populate all variables in `.env.example`; run `npm run verify:production` in the release environment.
- Replace the pre-launch Impressum banner with verified company, director, register, VAT and editorial-responsibility details.
- Have German counsel review the Impressum, AGB, privacy notice, withdrawal flow, subscription cancellation and proposed service guarantees.
- Execute DPAs and document subprocessors, hosting/backup regions, retention periods, international transfers and special-category data legal bases.
- Contract and verify regulated insurance/tax/legal partners before enabling those handoffs or displaying verified/licensed badges.
- Keep `ENABLE_PARTNER_DEMOS=false` in production; missing or failed partner integrations must remain unavailable rather than returning illustrative data.
- Keep live “escrow” or expert fund release disabled. Design the real flow with a regulated payment provider, connected accounts, reconciliation, refunds, disputes and legal review.
- Configure Stripe webhook endpoints separately for sandbox and live and verify replay/idempotency behaviour.
- Configure monitoring, alerting, on-call ownership, backup restore testing, incident response, RTO/RPO and a migration rollback procedure.
- Add browser-level tests for sign-up, MFA, checkout, webhook entitlement updates, vault upload/download, contact, assistant and every staff role.
- Run an independent penetration test and GDPR/security review against the deployed environment.

## Release commands

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
npm run verify:production
```

## Deliberate safeguards

- Authenticated users cannot insert or update subscription entitlements.
- Sensitive server functions and portal surfaces require a current AAL2 session.
- Vault and case access is owner, deputy, participant or assignment based; generic staff access is not global.
- Public translation, contact, insurance, tax and group-cover submissions use database-backed rate limits.
- Partner quotes, handoffs and bookings fail closed in production and local mock responses require an explicit development-only flag.
- Stripe webhooks use a durable event ledger and return `500` on processing failure so Stripe retries.
- The payout release screen is a sandbox ledger only and is blocked in live mode.
- Unknown legal identity and social/contact details are hidden or clearly marked as pre-launch configuration.
