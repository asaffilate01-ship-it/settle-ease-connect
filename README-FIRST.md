# Start here: GitHub upload

The release archive contains the complete repository source. It intentionally excludes `.git`, local environment files, installed dependencies and build output.

## Upload to a new repository

```bash
unzip settle-ease-connect-production-release-2026-08-01.zip
cd settle-ease-connect-production-release-2026-08-01
git init
git add .
git commit -m "Production hardening and native release foundation"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

For the existing Lovable-connected repository, copy these files into a fresh branch, review the diff, commit normally and open a pull request. Do not force-push or rewrite shared history.

## Immediately after upload

1. Add repository branch protection and require the `Quality gates` workflow.
2. Create deployment secrets from `.env.example`; do not add a real `.env` file to GitHub.
3. Rotate any credential that ever existed in the previously tracked `.env` or `.env.development` history.
4. Apply and test every `supabase/migrations` file in staging.
5. Complete `PRODUCTION_CHECKLIST.md` before production or store submission.
