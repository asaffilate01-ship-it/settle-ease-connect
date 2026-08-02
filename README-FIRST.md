# Start here: release-candidate handoff

This repository is now delivered as one complete source tree. It includes the hardened web application, Supabase migrations, generated iOS/Android projects, quality and security workflows, and the guarded release phase. Do not reapply the older incremental upgrade archives to this tree.

## Upload through Git

```bash
git switch -c production-release-candidate
npm ci
npm run verify
npm run test:e2e
npm audit --omit=dev --audit-level=high
git diff --check
git add .
git commit -m "Add guarded production and native release gates"
git push -u origin production-release-candidate
```

Review the complete diff and open a pull request. Keep `.env`, `.env.development`, `.env.local`, signing keys, keystores and provider credentials out of Git. The repository safety check rejects tracked development environment files.

## After the pull request merges

1. Protect `main` and require the `Quality gates` and `Security analysis` checks.
2. Create protected `staging` and `production` GitHub Environments with required reviewers.
3. Add Environment variables/secrets matching `.github/workflows/release.yml` and configure the equivalent runtime bindings at the deployment provider.
4. Rotate every credential that ever existed in the removed environment files.
5. Apply and verify every Supabase migration through `20260802202000_case_workflow_security.sql` in staging.
6. Copy `release/evidence.example.json` to `release/evidence.staging.json`, complete it without secrets and run the `Guarded release` workflow with `deploy=false`.
7. Complete `PRODUCTION_CHECKLIST.md`; only then approve a staging deploy, acceptance testing and production promotion.

For native release, obtain the final Apple Team ID and Android signing SHA-256 fingerprint, generate the association files with `npm run native:links:generate`, complete physical-device testing, and attach the evidence before selecting a native target in the release workflow.
