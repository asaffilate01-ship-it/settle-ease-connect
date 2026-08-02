# Production readiness report

Assessment date: 1 August 2026
Audited base commit: `188b330ec6c44da2f26e05ad22119fde41f0ea6e`

## Verdict

The repository is a hardened release candidate. Its local code gates pass, and generated iOS/Android projects are included. It is not yet evidence of an approved public deployment or store release because credentials, legal identity, regulated-provider contracts, live infrastructure, signing and independent testing are external inputs.

## Corrected in this release

- Removed seeded development login accounts, shared passwords and committed environment files.
- Added server-enforced AAL2 to sensitive finance, vault, administration, compliance, insurance and DELA operations.
- Fixed family-case grants so access is explicit, email-bound, expiring, revocable and permission-scoped.
- Added granular document, message, task, quote and invoice policies.
- Moved public intake behind server validation and database-backed rate limits; direct anonymous lead/contact inserts are revoked.
- Made Stripe environment selection server-owned, validated return URLs, persisted webhook idempotency and added atomic sandbox payout queuing.
- Disabled live expert payout/fund movement and native Stripe subscription purchase surfaces.
- Made missing partner integrations fail closed; simulated data cannot run in production.
- Added HTTPS allowlisting, HMAC signing, leases, retry backoff and dead-letter handling for partner delivery.
- Removed unverified provider, licence, pricing, SLA, escrow, funeral-cover and tax-refund marketing claims.
- Converted health, funeral-cover and tax flows to explicit referral boundaries.
- Added legal identity configuration, security headers, liveness/readiness endpoints, CI, dependency updates and release validators.
- Added branded Capacitor iOS/Android projects, secure network/backup defaults, camera capture and optional push registration/gateway delivery.
- Consolidated all SQL into `supabase/migrations` and removed obsolete duplicate/dead files.

## Verification gates

Verified on the exact release tree on 1 August 2026:

- Clean `npm ci`: passed
- Repository check, TypeScript, ESLint, 16 unit/invariant tests and production build: passed
- Production dependency audit at high severity: passed with 0 vulnerabilities
- Capacitor production-domain sync for iOS and Android: passed
- Capacitor Doctor: Android passed; iOS compilation was not attempted because Xcode is unavailable on Linux

Repeat these commands on the release commit:

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Production environment validation is separate:

```bash
NODE_ENV=production npm run verify:production
```

The environment validator is designed to fail until genuine production values are supplied.

## External blockers before public launch

1. Rotate all credentials ever present in removed tracked environment files.
2. Apply every migration through `20260801222000_catalog_and_verification_hardening.sql` in staging, regenerate Supabase types and complete role-by-role RLS tests.
3. Supply and legally review company/register/VAT/management, privacy, terms, cancellation and complaints details.
4. Contract and certify every enabled insurer, broker, tax professional, interpreter, email service and delivery endpoint. Keep unavailable adapters disabled.
5. Configure separate live Stripe credentials/webhook, run real sandbox-to-live acceptance tests and keep expert payouts disabled.
6. Configure monitoring, error reporting, alerting, retention jobs, on-call ownership, incident response and a successful backup restore drill.
7. Complete browser/device E2E tests, accessibility review, GDPR/security review and an independent penetration test.
8. Complete Apple/Google signing, privacy/store disclosures, real-device testing and store review. Native push additionally needs APNs/FCM and a delivery gateway.
9. Decide and implement the approved mobile subscription-billing/entitlement model before enabling native purchases.

## Known non-blocking technical debt

- Supabase types must be regenerated after staging migrations.
- The unit suite tests security/policy helpers and migration invariants; deployed browser and role journeys remain mandatory.
- A signed Android bundle still needs an environment that can download the Gradle toolchain; this restricted build environment could not reach the Gradle distribution host.
- Store acceptance cannot be guaranteed for a server-backed WebView. Native utility and review notes must demonstrate that the app is more than a repackaged website.
