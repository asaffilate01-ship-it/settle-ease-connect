# Operational release runbook

## 1. Database release

1. Back up staging and apply all migrations in filename order through `20260801222000_catalog_and_verification_hardening.sql`.
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

## 5. Release and rollback

Run on the exact release commit:

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
NODE_ENV=production npm run verify:production
```

Record commit, environment, migration version, test evidence, approver, owner, monitoring dashboards and rollback threshold. Deploy to staging/canary before general availability.
