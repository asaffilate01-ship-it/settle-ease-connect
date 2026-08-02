# BeistandPlus

BeistandPlus is a multilingual settlement and family case-management platform for Germany. The repository contains the TanStack Start web application, Supabase schema, Stripe web billing, operational portals, and generated Capacitor projects for iOS and Android.

## What is included

- Member cases, milestones, tasks, family access and messages
- Private document vault with scoped access and MFA gates
- Staff, expert, agent, partner, compliance, DPO and auditor workspaces
- Subscription checkout and idempotent Stripe webhook processing for the web
- Referral-only health, funeral-cover and tax intake; no simulated production quotes
- Rate-limited public forms and AI/translation entry points
- Signed, allowlisted partner delivery with retries and dead-letter handling
- iOS and Android Capacitor projects with branded icons/splash screens

## Local setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Supply sandbox values in `.env.local`; never commit it. Apply every SQL migration in `supabase/migrations` in filename order to a disposable or staging Supabase project before using the application.

## Verification

```bash
npm run verify
npm audit --omit=dev --audit-level=high
npm run preview
```

`npm run verify` checks repository layout, TypeScript, ESLint, unit tests and the production build. GitHub Actions runs the same gates for pushes to `main` and pull requests.

The generated server bundle targets Cloudflare Workers. `npm run preview` runs the built `.output` bundle locally with Wrangler; `npm run deploy` deploys that bundle after Cloudflare credentials and configuration are approved.

Before deployment, populate the production environment and run:

```bash
NODE_ENV=production npm run verify:production
```

## Security model

- Server functions validate Supabase authentication; high-impact operations also require AAL2.
- Row-level policies scope case and vault access independently of the interface.
- Family grants are email-bound, expiring and revocable.
- Public submissions are accepted through database-backed rate-limited server functions, not direct anonymous table inserts.
- Webhook event IDs are persisted before Stripe side effects are processed.
- Live expert payout/fund movement is disabled; the optional payout ledger is sandbox-only.
- Partner destinations are exact-host allowlisted and payloads are HMAC signed.
- Environment selection and payment return URLs are controlled on the server.

## Native apps

The `ios/` and `android/` projects use the same deployed TanStack Start application through a production HTTPS Capacitor shell. See [NATIVE.md](./NATIVE.md). Stripe subscription purchase and billing-portal UI is disabled inside native apps until an approved App Store/Play billing decision is implemented.

## Release status

This repository is a code-complete release candidate, not evidence that a deployment is legally or operationally approved. Read [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md), [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md), and [OPERATIONAL_RELEASE.md](./OPERATIONAL_RELEASE.md) before using real personal data or live payments.

Start with [README-FIRST.md](./README-FIRST.md) when uploading the supplied package to GitHub.
