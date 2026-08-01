# Production readiness report

Assessment date: 1 August 2026

## Verdict

The repository is now a **deployable release candidate**, but it is **not yet approved for a public production launch**. The code-level blockers found in the review have been corrected or made fail-closed. Launch still depends on applying and testing the database migration, verified legal/regulatory details, real partner/payment configuration, deployment operations, browser-level acceptance testing and an independent security review.

## Corrected in this hardening pass

- Removed client-write access to subscription entitlements; Stripe webhook processing is now the trusted writer.
- Added durable webhook idempotency, failed-event retry and stale-processing recovery.
- Enforced current AAL2/MFA on sensitive staff, agent, expert, vault, finance, CRM and administrative server functions—not only in the UI.
- Replaced global staff access to cases and vault files with assignment, participant, owner, deputy or supervisor rules.
- Isolated student-verification evidence from the family vault and required AAL2 for staff access.
- Made payout release an atomic sandbox ledger operation and blocked it in live mode.
- Added distributed database-backed throttling to public forms, AI/translation and external partner entry points.
- Replaced simulated contact and family-assistant interactions with server-backed workflows.
- Added a real, email-bound partner invitation and acceptance flow instead of placeholder membership rows.
- Disabled invented partner quotes/bookings in production; local demos require an explicit development flag.
- Replaced unsupported public claims, placeholder legal identity fields, fake contact channels and unconfigured social links.
- Added responsive off-canvas navigation, mobile expert/agent navigation, working command search, notification access and clearer loading/error/empty states.
- Upgraded vulnerable build dependencies, added CI, unit tests, production configuration validation and deployment documentation.

## Verification completed

| Gate | Result |
| --- | --- |
| Clean dependency install (`npm ci`) | Pass |
| TypeScript (`npm run typecheck`) | Pass |
| ESLint (`npm run lint`) | Pass with 410 legacy warnings and no errors |
| Unit tests (`npm test`) | 5 passed |
| Production build (`npm run build`) | Pass |
| Production dependency audit, high severity threshold | Pass; 3 moderate transitive findings remain in Capacitor CLI → xcode → uuid |

The remaining npm findings are in mobile build tooling, not the web runtime. The currently installed Capacitor CLI has no non-breaking upstream resolution for that chain; keep mobile builds isolated and update when Capacitor ships a fixed dependency.

## Launch blockers outside this patch

1. Apply `supabase/migrations/20260801160000_production_hardening.sql` to a disposable/staging project and run role-by-role RLS acceptance tests before production.
2. Rotate every credential that was present in the formerly tracked `.env` and `.env.development` files. Removing them from the current tree does not remove them from Git history or invalidate them.
3. Supply verified company/register/director/VAT/editorial details and obtain German legal review of the Impressum, terms, privacy, cancellation and regulated-service wording.
4. Contract and technically certify insurance, tax, legal and interpreting providers. Unconfigured adapters intentionally remain disabled.
5. Keep real escrow/fund movement disabled until a regulated custody/payout provider, connected accounts, reconciliation, refunds and disputes are implemented.
6. Add end-to-end browser tests for sign-up, MFA, checkout/webhooks, vault, partner invitations and every role. The current five tests cover only core policy helpers.
7. Complete a deployed accessibility review, responsive-device review, penetration test and GDPR/security review.
8. Configure monitoring, error reporting, alerting, on-call ownership, backup restore drills, retention jobs and incident response.

## Remaining product gaps

- Contact enquiries are persisted securely but do not yet have an in-app staff inbox or email notification workflow.
- Partner API pushes are an auditable queue only; a signed delivery worker, retries, dead-letter handling and reconciliation are still required.
- Governance roles (`compliance`, `dpo`, `auditor`) exist in the role enum but do not yet have dedicated least-privilege consoles.
- The live expert payout/custody workflow is intentionally unavailable.
- The lint baseline still contains 410 warnings, largely legacy `any` types and hook dependency warnings; reduce this baseline before making warnings fatal in CI.
