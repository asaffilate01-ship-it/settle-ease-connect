# Delivery notes

`settle-ease-connect-production-release-2026-08-01.zip` is the full GitHub-ready source package. It includes web source, tests, CI, migrations, operational documents, and generated iOS/Android projects. It excludes Git history, `node_modules`, local secrets and build output.

Material cleanup in this release:

- Removed tracked `.env` and `.env.development` files.
- Removed obsolete root-level test/workflow/script copies and download artifacts.
- Removed duplicate, stale and conflicting SQL exports from the `supabase/` root; the schema history used by the application remains only in `supabase/migrations/`.
- Removed the unshipped group-insurance fiduciary agreement/intake and outdated tax-refund estimator.
- Removed an unused simulated funeral-insurance quote widget.

Deleted tracked content remains recoverable from Git history. Credentials from that history must be rotated; deleting a file does not revoke a secret.
