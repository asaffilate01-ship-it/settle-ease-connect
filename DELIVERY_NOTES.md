# Delivery notes

Two archives accompany this hardening pass:

- `settle-ease-connect-hardened-source.zip` is the complete corrected source tree without Git history, dependencies, build output or environment files.
- `settle-ease-connect-production-hardening-overlay.zip` contains only added/changed files in their repository-relative paths.

When applying the overlay to an existing checkout, also delete the tracked `.env` and `.env.development` files. They are intentionally absent from the overlay. Keep local secrets outside Git and start from `.env.example`.

Because those environment files previously existed in Git history, rotate every credential they contained before deploying. Removing files from the current branch does not revoke credentials or erase earlier commits.

After applying the files:

1. Run `npm ci`.
2. Apply `supabase/migrations/20260801160000_production_hardening.sql` in staging.
3. Follow `PRODUCTION_READINESS_REPORT.md` and `PRODUCTION_CHECKLIST.md`.
4. Run all release commands listed in the checklist.
