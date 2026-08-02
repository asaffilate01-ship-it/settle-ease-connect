# Production readiness report

Assessment date: 2 August 2026
Repository baseline: `d3ac7f2` plus the release-engineering phase in this handoff

## Verdict

The repository is a hardened release candidate. Its local code gates pass, and generated iOS/Android projects are included. It is not yet evidence of an approved public deployment or store release because credentials, legal identity, regulated-provider contracts, live infrastructure, signing and independent testing are external inputs.

Current estimate: repository/code controls about 96%, public-web go-live about 80%, and native store release about 65%. These are readiness indicators, not guarantees; the open evidence in `PRODUCTION_CHECKLIST.md` determines whether a real release may proceed.

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
- Added two-administrator approval for privileged role changes, accurate MFA/session controls and AAL2-protected staff workflows.
- Added signed vault uploads, malware quarantine/callback enforcement, explicit AI consent and a scheduled 30-day AI-output purge.
- Added permission-aware command search, responsive case views and clearer member/staff/provider ownership states.
- Added allowlisted native deep links, secure external-browser handling, notification routing and iOS/Android custom-scheme registration.
- Added Playwright desktop/mobile smoke checks, automated accessibility checks, CodeQL, dependency review and CycloneDX SBOM generation.
- Consolidated all SQL into `supabase/migrations` and removed obsolete duplicate/dead files.
- Made the overlapping vault, AI-consent and case-workflow policies safe to replay in migration order.
- Fixed the pre-hydration language gate so German/default-language pages remain visible immediately.
- Replaced npm-native SBOM output with a pinned CycloneDX generator and resolved the npm 10 dependency-tree conflict.
- Added an exact-commit release-evidence validator with freshness, rollback, legal, provider, security and native-target requirements.
- Added a protected manual staging/production workflow with explicit deployment confirmation and 365-day evidence/SBOM retention.
- Added retrying post-deployment verification for security headers, liveness version and token-protected database readiness.
- Added deterministic Apple Universal Link and Android App Link generation/validation tied to final team, bundle, package and signing identities.

## Verification gates

Verified locally on the upgrade tree on 2 August 2026; repeat on the final GitHub commit and retain the CI evidence:

- Clean `npm ci`: passed
- Repository check, TypeScript, ESLint, 49 unit/invariant tests and production build: passed
- CycloneDX SBOM generation: passed (590 components)
- Desktop/mobile browser smoke and automated accessibility tests: the latest cleaned `main` GitHub workflow passed; this workspace could not download the updated Chromium binary because its restricted CDN response was empty, so the new handoff commit must repeat the workflow after upload
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

Release authorization is also separate and deliberately fail-closed:

```bash
npm run release:evidence -- \
  --file release/evidence.production.json \
  --environment production \
  --commit "$(git rev-parse HEAD)" \
  --native none
```

The `Guarded release` workflow must pass in validation-only mode before deployment is approved.

## External blockers before public launch

1. Rotate all credentials ever present in removed tracked environment files.
2. Apply every migration through `20260802202000_case_workflow_security.sql` in staging, regenerate Supabase types and complete role-by-role RLS tests.
3. Supply and legally review company/register/VAT/management, privacy, terms, cancellation and complaints details.
4. Contract and certify every enabled insurer, broker, tax professional, interpreter, email service and delivery endpoint. Keep unavailable adapters disabled.
5. Configure separate live Stripe credentials/webhook, run real sandbox-to-live acceptance tests and keep expert payouts disabled.
6. Schedule and monitor partner delivery and AI retention, operate the malware scanner/callback, configure error reporting/alerting/on-call, and complete incident-response and backup-restore drills.
7. Pass the included browser/accessibility CI suite in staging, then complete manual assistive-technology/device review, GDPR/security review and an independent penetration test.
8. Complete Apple/Google signing, privacy/store disclosures, real-device testing and store review. Native push additionally needs APNs/FCM and a delivery gateway.
9. Decide and implement the approved mobile subscription-billing/entitlement model before enabling native purchases.

## Known non-blocking technical debt

- Supabase types must be regenerated after staging migrations.
- Automated public browser/accessibility coverage does not replace authenticated role-by-role staging journeys or manual assistive-technology review.
- A signed Android bundle still needs an environment that can download the Gradle toolchain; this restricted build environment could not reach the Gradle distribution host.
- Store acceptance cannot be guaranteed for a server-backed WebView. Native utility and review notes must demonstrate that the app is more than a repackaged website.
