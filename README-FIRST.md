# Start here: release-candidate handoff

This repository is now delivered as one complete source tree. It includes the hardened web application, Supabase migrations, generated iOS/Android projects, quality and security workflows, and the guarded release phase. Do not reapply the older incremental upgrade archives to this tree.

## Upload through Git

```bash
git switch -c production-release-candidate
npm ci
npm run check:lockfile
npm run verify
npm run test:e2e
npm audit --omit=dev --audit-level=high
git diff --check
git add .
git commit -m "Add native compile and staging acceptance gates"
git push -u origin production-release-candidate
```

Review the complete diff and open a pull request. Keep `.env`, `.env.development`, `.env.local`, signing keys, keystores and provider credentials out of Git. The repository safety check rejects tracked development environment files.

The committed lockfile must resolve only from `https://registry.npmjs.org/`. Do not accept a hosting-editor rewrite containing `pkg.dev`, `sandbox-npm-cache` or private registry URLs; `Repository policy` now rejects it before installation.

## After the pull request merges

1. Apply `.github/REPOSITORY_SETTINGS.md`, enable Dependency Graph, protect `main`, and require the policy, quality, security and native checks.
2. Create protected `staging` and `production` GitHub Environments with required reviewers.
3. Add Environment variables/secrets matching `.github/workflows/release.yml` and configure the equivalent runtime bindings at the deployment provider, including distinct staging/production Worker names, the observability endpoint/token and incident owner.
4. Rotate every credential that ever existed in the removed environment files.
5. Apply and verify every Supabase migration through `20260802202000_case_workflow_security.sql` in staging.
6. Copy `release/evidence.staging.example.json` to `release/evidence.staging.json`, complete it without secrets and run the `Guarded release` workflow with `deploy=false`.
7. Create four least-privilege staging identities and add the `E2E_*` secrets listed in `OPERATIONAL_RELEASE.md`; run `Authenticated staging acceptance`.
8. Complete `PRODUCTION_CHECKLIST.md`; only then approve a staging deploy, acceptance testing and production promotion.
9. Record each deployed Worker version and set `ROLLBACK_APP_VERSION`; exercise the protected rollback workflow in staging before production.

For native release, obtain the final Apple Team ID and Android signing SHA-256 fingerprint, generate the association files with `npm run native:links:generate`, complete physical-device testing, and attach the evidence before selecting a native target in the release workflow.
