# Operational release runbook

This release adds the enquiry inbox, case milestones, family access, privacy/compliance consoles and durable partner delivery. Complete these steps in staging before production.

## 1. Database and access checks

1. Apply all migrations in timestamp order through `20260801180000_operational_workflows.sql`.
2. Regenerate the Supabase database types from the migrated staging project.
3. Test RLS with separate users for `client`, `family_deputy`, assigned and unassigned `caseworker`, `admin`, `compliance`, `dpo` and `auditor`.
4. Confirm family users see only explicitly shared cases and that `updates`, `documents` and `collaborator` grants expose only their intended actions.
5. Confirm auditors can read governance evidence but cannot mutate it.

Keep a database backup and tested rollback procedure. Do not apply the migration directly to production first.

## 2. Transactional email gateway

Set `EMAIL_DELIVERY_ENDPOINT`, `EMAIL_DELIVERY_BEARER_TOKEN`, `CONTACT_FROM_EMAIL` and `CONTACT_TEAM_EMAIL`. The endpoint must use HTTPS and accept authenticated `POST` requests with this shape:

```json
{
  "from": "team@beistandplus.de",
  "to": "recipient@example.com",
  "subject": "Message subject",
  "text": "Plain-text content",
  "replyTo": "team@beistandplus.de",
  "metadata": { "enquiryId": "uuid" }
}
```

A successful request must return a 2xx response. Configure SPF, DKIM and DMARC for the sending domain, and route delivery failures, bounces and complaints into operational monitoring. Never place provider credentials in `VITE_*` variables.

## 3. Partner endpoint registration

1. Agree the endpoint URL, payload contract, retention and incident contacts with the partner.
2. Add the exact hostname to the comma-separated `PARTNER_DELIVERY_ALLOWED_HOSTS` value. Wildcards are not supported.
3. Generate a unique strong signing secret and put it in a server-only environment variable such as `PARTNER_SIGNING_SECRET_ACME`.
4. In the admin delivery centre, register the HTTPS URL and the environment-variable name—not the secret value.
5. Verify the partner validates `X-Beistand-Timestamp`, `X-Beistand-Signature` (`sha256=<hex>`) and `Idempotency-Key` before enabling the endpoint.

The signature input is `<unix timestamp>.<raw request body>`. Redirects are rejected. The worker records only a bounded response excerpt and never logs signing-secret values.

## 4. Delivery worker

Generate a random `PARTNER_DELIVERY_WORKER_SECRET` of at least 32 characters. Schedule the following request at least once per minute:

```bash
curl --fail-with-body --request POST \
  --header "Authorization: Bearer $PARTNER_DELIVERY_WORKER_SECRET" \
  "https://your-app.example/api/internal/partner-deliveries?batch=10"
```

Only one scheduler is required; lease-safe claims prevent duplicate concurrent work. Alert on non-2xx worker responses, repeated retries, `failed` or `dead_letter` records, and a growing queue age. A staff retry creates a fresh attempt without changing the original idempotency key.

## 5. Release evidence

Run these commands against the exact release commit:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
npm run verify:production
```

Record the output, migration version, release commit, environment owner and rollback decision. `verify:production` is expected to fail until all real deployment variables are supplied.
