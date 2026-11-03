# Security Remediation — Public Environment Files

## Finding
The Unity Sphere default-branch Git tree contains at least 18 tracked `.env`-style files. This report intentionally does not reproduce their contents or values. Any real credential committed to a public repository must be treated as compromised, even if the file is later removed.

## Immediate response
1. Identify every credential type and owning service without copying values into issues, chat, logs or reports.
2. Rotate/revoke API keys, tokens, passwords, signing credentials and database credentials with their providers.
3. Review provider audit logs for use since the first public commit.
4. Remove secret-bearing files from the working tree and rewrite Git history only under an approved repository-maintainer procedure; coordinate force-pushes and invalidate all old credentials first.
5. Move secrets to GitHub Actions secrets, deployment secret stores or a dedicated vault.
6. Keep only `.env.example` files with clearly fake placeholders.
7. Run full-history secret scanning and dependency scanning before merging the integration PR.

## Repository controls added on this integration branch
- Ignore `.env` and `.env.*` by default while allowing `.env.example`.
- Add a Gitleaks scan workflow for pushes and pull requests.
- Do not print secret values in CI logs.

## Important limitation
Ignore rules affect future untracked files only. They do not untrack existing files or erase secrets from previous commits. Do not declare the incident resolved until keys are rotated, history is addressed, and a full-history scan is clean.
