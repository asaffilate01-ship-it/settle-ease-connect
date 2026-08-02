# Required GitHub repository settings

Source code cannot create or approve its own protection rules. Apply these settings before treating `main` as a release branch.

## Repository security

In **Settings → Code security and analysis**:

1. Enable Dependency Graph and Dependabot alerts/security updates.
2. Enable secret scanning and push protection where the repository plan permits it.
3. Review and close the current bulk/major Dependabot pull requests; the repository deliberately stops opening new unattended major upgrades.

Dependency Review fails closed when Dependency Graph is disabled. Do not remove or soften that check to make a pull request green.

## Main ruleset

Create a ruleset targeting `main`:

- require a pull request and at least one approval;
- require CODEOWNERS review for owned paths;
- dismiss stale approvals and require conversation resolution;
- block force pushes and branch deletion;
- require branches to be up to date;
- require these status checks after each has run once on the branch:
  - `verify`
  - `browser`
  - `Repository policy`
  - `CodeQL`
  - `Dependency review`
  - `Software bill of materials`
  - `Android debug build`
  - `iOS simulator build`

Do not add the manual staging/release workflows as pull-request checks.

## Protected Environments

Create `staging` and `production` Environments and restrict deployment branches to `main`.

- Staging: require release and security review; add four dedicated `E2E_*` test accounts.
- Production: require release, security and legal review; prevent self-review where available.
- Use distinct `CLOUDFLARE_WORKER_NAME`, tokens and runtime bindings for each Environment.
- Add only the variables/secrets named by the workflows. Never add `.env`, signing keys or service-role credentials to the repository.

Run `Guarded release` with `deploy=false` first. Exercise `Protected rollback` in staging before approving production.
