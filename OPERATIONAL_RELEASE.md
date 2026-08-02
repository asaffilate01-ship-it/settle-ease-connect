# Operational release runbook

## 1. Database release

1. Back up staging and apply all migrations in filename order through `20260802202000_case_workflow_security.sql`.
2. Regenerate Supabase types from staging.
3. Run the RLS matrix in `PRODUCTION_CHECKLIST.md` with separate test identities.
4. Confirm direct anonymous inserts into `contact_messages`, `insurance_leads` and `tax_leads` are rejected.
5. Record migration output and restore/rollback decision before production.

## 2. Transactional email

Set `EMAIL_DELIVERY_ENDPOINT`, `EMAIL_DELIVERY_BEARER_TOKEN`, `CONTACT_FROM_EMAIL` and `CONTACT_TEAM_EMAIL`. The HTTPS endpoint accepts authenticated JSON:

```json
{
  "from": "team@example.com",
  "to": "recipient@example.com",
  "subject": "Message subject",
  "text": "Plain-text content",
  "replyTo": "team@example.com",
  "metadata": { "enquiryId": "uuid" }
}
```

Return 2xx only after accepting delivery. Configure SPF, DKIM, DMARC, bounce/complaint processing and monitoring.

## 3. Partner delivery

1. Agree payload, retention, status reconciliation and incident contacts.
2. Add the exact hostname to `PARTNER_DELIVERY_ALLOWED_HOSTS`; wildcards are unsupported.
3. Store a unique signing secret in a server-only variable such as `PARTNER_SIGNING_SECRET_ACME`.
4. Register the HTTPS URL and secret-variable name in the AAL2-protected delivery centre.
5. Certify `X-Beistand-Timestamp`, `X-Beistand-Signature` and `Idempotency-Key` handling with the partner.

Schedule at least once per minute:

```bash
curl --fail-with-body --request POST \
  --header "Authorization: Bearer $PARTNER_DELIVERY_WORKER_SECRET" \
  "https://your-production-domain.example/api/internal/partner-deliveries?batch=10"
```

Alert on non-2xx responses, repeated retries, failed/dead-letter rows and queue age.

## 4. Push delivery

Web push requires matching `VAPID_PUBLIC_KEY` and `VITE_VAPID_PUBLIC_KEY`. Native push is optional. When enabled, set `VITE_NATIVE_PUSH_ENABLED=true`, configure APNs/FCM in the platform projects and provide a deployment-owned HTTPS `NATIVE_PUSH_DELIVERY_ENDPOINT` with a strong bearer token.

## 5. Vault scanning and retention

Configure `VAULT_SCANNER_URL`, `VAULT_SCANNER_BEARER_TOKEN` and `VAULT_SCANNER_WEBHOOK_SECRET`. The scanner must fetch the short-lived upload URL, verify type/content, and POST a signed `clean`, `rejected` or `error` result to `/api/internal/vault-scan-result`. Alert on callbacks that fail or remain pending; files are inaccessible until marked clean.

Schedule the retention worker daily with a unique `RETENTION_WORKER_SECRET` of at least 32 characters:

```bash
curl --fail-with-body --request POST \
  --header "Authorization: Bearer $RETENTION_WORKER_SECRET" \
  "https://your-production-domain.example/api/internal/retention"
```

Record the returned removal count, alert on non-2xx responses and test the 30-day AI-output purge in staging. Never expose either worker secret to client-side variables.

## 6. Observability and incident response

Configure `OBSERVABILITY_ENDPOINT`, `OBSERVABILITY_BEARER_TOKEN`,
`OBSERVABILITY_ENVIRONMENT=production` and `INCIDENT_CONTACT_EMAIL` as Cloudflare runtime bindings.
Mirror them in the protected production GitHub Environment so the production validator can prove the
control is configured. The endpoint must accept authenticated JSON over HTTPS and return 2xx after it
has durably accepted the event.

Every server response carries `X-Request-ID` and `Server-Timing`. A failed server request emits a
bounded `server.error` event containing the request ID, method, pathname, release version, environment
and sanitized error. Query strings, request bodies, IP addresses and user-agent values are deliberately
excluded; common email addresses and credential patterns are redacted. Test delivery with a controlled
staging exception, then alert a named owner on error rate, delivery failure and absence of expected
telemetry. The endpoint is a supplement to Cloudflare logs, not a store for user or document content.

Document incident severity, triage ownership, customer/regulator notification decisions and the exact
dashboard/runbook URLs in release evidence. Exercise the incident and restore paths before production.

## 7. Protected release environments

Create `staging` and `production` GitHub Environments. Restrict deployment branches to `main`, add required reviewers (at least release/security for staging and release/security/legal for production), prevent self-review where the plan permits it, and configure the variables and secrets referenced by `.github/workflows/release.yml`. Give each Environment a distinct `CLOUDFLARE_WORKER_NAME` (and preferably a separate account/token boundary) so staging can never replace the production Worker. Keep Cloudflare runtime bindings aligned with those protected values; the workflow does not copy application secrets into Cloudflare.

Release evidence contains no credentials and must be reviewed like source code:

```bash
cp release/evidence.example.json release/evidence.staging.json
npm run release:evidence -- \
  --file release/evidence.staging.json \
  --environment staging \
  --commit "$(git rev-parse HEAD)" \
  --native none
```

Replace every placeholder except `commitSha: "FROM_WORKFLOW"`, set a check to `true` only when its linked evidence exists, and use an expiry date appropriate for the change window. The workflow resolves that sentinel to `GITHUB_SHA` and stores the resolved record as an artifact, avoiding an impossible self-referential commit hash in the committed JSON. Production requires security, legal, provider, live-payment, email, partner and penetration-test evidence. A native target additionally requires signing, real-device, store-compliance and app-link evidence.

Run `Guarded release` manually with `deploy=false` first. It accepts only `main`, binds to the selected protected Environment, repeats code/browser/audit/SBOM gates, verifies evidence against the exact commit and validates production configuration. After the dry run passes and required reviewers approve, rerun with `deploy=true` and the exact phrase `DEPLOY staging` or `DEPLOY production`. The workflow then deploys and checks:

- application security headers;
- `/api/health`, including the expected release version;
- token-protected `/api/internal/readiness`, including the database connection;
- deployed Universal/App Link identity files when a native target is selected.

The workflow retains the evidence JSON and CycloneDX SBOM for 365 days. Preserve provider, legal, migration, restore, monitoring and penetration-test records at the HTTPS locations referenced by the evidence file.

## 8. Release and rollback

Before production promotion, add four dedicated, least-privilege test identities to the protected `staging` Environment:

- `E2E_MEMBER_EMAIL` / `E2E_MEMBER_PASSWORD`
- `E2E_STAFF_EMAIL` / `E2E_STAFF_PASSWORD`
- `E2E_AGENT_EMAIL` / `E2E_AGENT_PASSWORD`
- `E2E_EXPERT_EMAIL` / `E2E_EXPERT_PASSWORD`

Use distinct accounts, do not grant them production access, and rotate them on the same schedule as other test credentials. The manual `Authenticated staging acceptance` workflow refuses localhost, Lovable previews and the production hostname, disables Playwright traces/videos/screenshots, tests each landing and member/workforce isolation on desktop and mobile, and retains a credential-free evidence artifact for 365 days. Run it after staging deployment and attach its run URL to release evidence.

Run on the exact release commit:

```bash
npm ci
npm run verify
npm run test:e2e
npm audit --omit=dev --audit-level=high
NODE_ENV=production npm run verify:production
```

Record commit, environment, migration version, test evidence, approver, owner, monitoring dashboards and rollback threshold. Deploy to staging/canary before general availability.

Before approving production, verify the documented rollback owner is available, the backup timestamp in the evidence is current and the rollback threshold is observable. Record the Cloudflare Worker version ID for every successful deployment and configure `ROLLBACK_APP_VERSION` in each protected Environment to the version exposed by that rollback target.

For an application rollback, run the manual `Protected rollback` workflow from `main`, select the
protected Environment, enter the reviewed Worker version ID and incident/change reason, then type the
exact confirmation `ROLLBACK staging` or `ROLLBACK production`. The workflow shares the release
concurrency lock, requires Environment approval, restores the specified version non-interactively and
re-runs security-header, liveness and database-readiness checks. If verification fails, keep the incident
open and follow the provider console/runbook under two-person review.

Roll back a database migration only when its reviewed down/forward-fix procedure is safe for data
written since deployment; otherwise deploy the forward fix.
