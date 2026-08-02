# Security policy

## Reporting a vulnerability

Use the configured security or privacy contact shown on the deployed legal pages. Do not include real customer data, credentials or sensitive documents in an initial report.

Please include the affected route/component, reproduction steps, expected impact and a safe contact method. BeistandPlus should acknowledge reports according to its published support process; no response-time promise is made by this source repository.

## Supported releases

Only the currently deployed release and explicitly supported maintenance branches should receive security fixes. Deployment owners must publish their supported-version policy.

## Repository hygiene

- Never commit `.env` files, service-role keys, payment secrets, signing secrets, APNs/FCM credentials or release keystores.
- Rotate any secret exposed in Git history; deleting a file is not revocation.
- Require protected branches, reviewed pull requests and passing quality gates.
- Use private security advisories for coordinated fixes.
