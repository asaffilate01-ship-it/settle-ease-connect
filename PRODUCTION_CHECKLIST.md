# Production and store-release checklist

Do not connect real users, documents or live payments until all applicable items are evidenced.

## Source and database

- [x] `.env` and `.env.development` are absent from `git ls-files`; deployment values exist only in protected secrets.
- [ ] `npm ci`, `npm run verify`, `npm run test:e2e` and `npm audit --omit=dev --audit-level=high` pass on the release commit.
- [ ] The `Security analysis` workflow uploads a valid `sbom-cyclonedx` artifact.
- [ ] Every migration through `20260802202000_case_workflow_security.sql` is applied to staging first.
- [ ] Supabase types are regenerated from migrated staging and committed.
- [ ] Owner, family, assigned/unassigned worker, expert, agent, admin, insurance, compliance, DPO and auditor RLS tests pass.
- [ ] Direct anonymous writes to lead/contact tables fail while the public server forms succeed and rate-limit correctly.
- [ ] A rollback decision, migration owner and release evidence are recorded.
- [ ] `release/evidence.production.json` passes the guarded workflow for the exact production commit.

## Secrets and infrastructure

- [ ] Every credential formerly in Git history is revoked and replaced.
- [ ] Production variables are stored in deployment secrets and `NODE_ENV=production npm run verify:production` passes.
- [ ] The deployed custom domain has valid TLS, HSTS and correct DNS.
- [ ] Liveness `/api/health` and token-protected `/api/internal/readiness` are monitored.
- [ ] Error reporting, latency, queue age, webhook failures, dead letters and suspicious rate-limit events alert named owners.
- [ ] Database/storage backups are enabled and a restore drill meets approved RTO/RPO.
- [ ] The authenticated `/api/internal/retention` job runs daily, is monitored, and expired AI output deletion is evidenced.
- [ ] Vault malware-scanner queue/callback failures alert an owner and quarantined files remain inaccessible.
- [ ] Incident-response procedures are tested.

## Legal, privacy and providers

- [ ] Verified legal identity fields replace all empty environment values.
- [ ] German counsel reviews Impressum, terms, privacy, withdrawal/cancellation, complaints and regulated-service copy.
- [ ] DPAs, subprocessors, regions, retention, legal bases, special-category handling and international transfers are documented.
- [ ] Each enabled external provider has a signed contract, verified status, data-sharing terms and incident contacts.
- [ ] `ENABLE_PARTNER_DEMOS=false`; missing integrations fail closed.
- [ ] Health, funeral-cover and tax flows remain referrals unless separately authorised and implemented.
- [ ] Support hours and any service commitments are published only after operational staffing is approved.

## Payments and delivery

- [ ] Live and sandbox Stripe webhooks use separate secrets and replay/idempotency tests pass.
- [ ] `PAYMENTS_ENV=live`, return-origin allowlist and live publishable/secret keys pass validation.
- [ ] `ENABLE_SANDBOX_PAYOUT_LEDGER=false`; no UI or process represents the ledger as live fund movement.
- [ ] Email domain SPF, DKIM and DMARC, bounce/complaint handling and alerting are tested.
- [ ] Partner hosts are exact-allowlisted and each partner certifies signature and idempotency handling.
- [ ] Authenticated delivery worker runs at least once per minute and dead-letter ownership is assigned.

## Web acceptance

- [ ] Sign-up, reset, MFA enrol/challenge/recovery and session-expiry journeys pass.
- [ ] Checkout, portal, webhook entitlement and cancellation journeys pass in Stripe test mode.
- [ ] Vault upload/camera/download/delete and sensitive AAL2 gates pass.
- [ ] Family invite/accept/expiry/revoke and each sharing permission pass.
- [ ] Enquiry, email, case, message, privacy and partner-delivery journeys pass.
- [ ] Playwright smoke and axe checks pass; keyboard-only, screen-reader, contrast, zoom and responsive-device manual review also pass.
- [ ] Independent penetration and GDPR/security reviews are closed.

## iOS and Android

- [ ] `CAPACITOR_SERVER_URL` is the deployed reviewed HTTPS release and `npm run mobile:sync` passes.
- [ ] Apple/Google bundle identity, signing, versions, icons, screenshots, privacy/data-safety forms and support URLs are final.
- [ ] APNs/FCM credentials and native delivery gateway are tested, or `VITE_NATIVE_PUSH_ENABLED=false`.
- [ ] Custom-scheme links, camera, MFA, notifications, session expiry and reconnect work on physical iOS/Android devices.
- [ ] Universal Links/App Links are configured with production-domain association files and verified signing fingerprints if HTTPS app links are required.
- [ ] Native digital subscription checkout remains disabled until the approved StoreKit/Play Billing or entitlement model is implemented.
- [ ] TestFlight and Play closed testing pass; review notes explain native utility and test credentials.

The manual `Guarded release` workflow now enforces the code-manageable checks above. It intentionally remains blocked until reviewed evidence, protected environment values and external approvals are supplied.
