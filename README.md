# BeistandPlus

BeistandPlus is a multilingual family settlement and case-management platform for Germany. It combines member guidance, benefits and immigration workflows, a private document vault, messaging, expert/agent/partner portals, CRM and subscription billing.

## Stack

- React and TanStack Start/Router
- TypeScript and Tailwind CSS
- Supabase Auth, Postgres, RLS and Storage
- Stripe embedded checkout and subscription webhooks
- Lovable AI gateway for rate-limited guidance and UI translation
- Capacitor shell for future iOS/Android builds

## Local setup

1. Copy `.env.example` into your local environment and supply sandbox credentials.
2. Install exact dependencies with `npm ci`.
3. Apply Supabase migrations in timestamp order.
4. Start the application with `npm run dev`.

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, Stripe API keys, webhook secrets or `LOVABLE_API_KEY` to client-side `VITE_*` variables.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Pull requests and pushes to `main` run the same checks in GitHub Actions.

## Security boundaries

- Subscription entitlements are written only by trusted payment/webhook code.
- Sensitive vault and staff operations require a current Supabase AAL2 session on the server.
- Database policies scope vault and case access independently of the UI.
- Public metered/submission endpoints use a database-backed rate limiter.
- Stripe webhook event IDs are persisted before processing to prevent duplicate side effects.
- The current payout queue is a sandbox ledger and cannot move funds in live mode.

## Production deployment

Read [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) and [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) before connecting real users, documents or payments. A successful build is not approval to launch: legal identity, regulated partners, production infrastructure, operational controls and independent testing remain deployment responsibilities.
