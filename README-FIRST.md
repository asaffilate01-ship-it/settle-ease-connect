# Start here: six ordered GitHub upgrade packages

Apply the six supplied ZIP files to the existing repository in numerical order. Each archive is an incremental overlay and contains only that package's changed or added source files. It intentionally excludes `.git`, local environment files, installed dependencies and build output.

## Apply to the existing repository

```bash
git switch -c production-upgrade-2026-08-02
unzip -o settle-ease-connect-upgrade-01-content.zip -d .
unzip -o settle-ease-connect-upgrade-02-identity-security.zip -d .
unzip -o settle-ease-connect-upgrade-03-vault-privacy-ai.zip -d .
unzip -o settle-ease-connect-upgrade-04-workflow-ux.zip -d .
unzip -o settle-ease-connect-upgrade-05-native-release.zip -d .
unzip -o settle-ease-connect-go-live-update-06.zip -d .
git rm --ignore-unmatch .env .env.development
npm ci
npm run verify
npm run test:e2e
git diff --check
git add .
git commit -m "Production, security, UX and native release upgrade"
git push -u origin production-upgrade-2026-08-02
```

Review the diff and open a pull request. Do not force-push or rewrite shared history. If an earlier package reports a conflict, stop and resolve it before applying the next one.

Package 06 removes the last confirmed CI blockers: tracked environment files, the default-language visibility gate, ambiguous browser selectors, overlapping migration policies and npm-native SBOM generation. If applying through GitHub's web interface, manually delete `.env` and `.env.development` after uploading the package because a ZIP overlay cannot delete existing remote files.

## Immediately after upload

1. Add branch protection and require the `Quality gates` and `Security analysis` workflows.
2. Create deployment secrets from `.env.example`; do not add a real `.env` file to GitHub.
3. Rotate any credential that ever existed in the previously tracked `.env` or `.env.development` history.
4. Apply and test every `supabase/migrations` file in staging, through `20260802202000_case_workflow_security.sql`.
5. Complete `PRODUCTION_CHECKLIST.md` before production or store submission.
