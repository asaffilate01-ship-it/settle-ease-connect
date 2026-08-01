# Delivery notes

`settle-ease-connect-operational-release.zip` is the complete corrected source tree for GitHub upload. It excludes Git history, installed dependencies, build output and local environment files. Keep secrets outside Git and start from `.env.example`.

Because those environment files previously existed in Git history, rotate every credential they contained before deploying. Removing files from the current branch does not revoke credentials or erase earlier commits.

After applying the files:

1. Run `npm ci`.
2. Apply every migration through `supabase/migrations/20260801180000_operational_workflows.sql` in staging.
3. Follow `OPERATIONAL_RELEASE.md`, `PRODUCTION_READINESS_REPORT.md` and `PRODUCTION_CHECKLIST.md`.
4. Run all release commands listed in the checklist.
