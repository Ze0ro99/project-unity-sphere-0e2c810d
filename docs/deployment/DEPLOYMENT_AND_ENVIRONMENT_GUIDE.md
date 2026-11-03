# Deployment and Environment Guide

Status: configuration baseline for the integration branch. Provider projects, domains, credentials and production deployments are not created by committing these files. Connect each provider account and import this GitHub repository to activate the corresponding environment.

## Repository source of truth

- GitHub is the source of truth for application code, specifications, standards, tests and documentation.
- Use `integration/sovereign-hybrid-ecosystem` as the initial integration branch for provider previews.
- Preserve the seven-layer source mapping exactly. Do not rename, recolor, reorder or merge layer identities. Gold remains a separate unmatched registry entry; it is not an alias for Indigo.

## Deployment topology

| Provider | Responsibility | Configuration |
|---|---|---|
| Vercel | Primary application deployment: Vite frontend plus FastAPI serverless API | `vercel.json`, `api/index.py`, `requirements.txt` |
| Netlify | Independent frontend preview and browser QA; not the authoritative API host | `netlify.toml`, build output `dist/` |
| Replit | Development workspace and interactive preview; do not use it as a second production authority | `.replit`, `package.json` |

Keep one production domain and one authoritative production deployment. Netlify and Replit should remain preview/development targets unless a later architecture decision explicitly assigns them production services.

## Vercel project setup

1. Import `Ze0ro99/project-unity-sphere-0e2c810d` from GitHub.
2. Select branch `integration/sovereign-hybrid-ecosystem` for the initial preview; do not change the repository default branch as part of setup.
3. Set the project root to the repository root.
4. Framework preset: Vite (or Other if the dashboard does not detect Vite).
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Node.js runtime: 22.x (the repository requires Node.js 22.12 or newer).
8. Install command: `npm install`.
9. Keep the checked-in `vercel.json`; it routes `/v1/*` to the FastAPI function at `api/index.py`.
10. Add only the required environment variables in the Vercel project dashboard. Use environment-specific values for Preview and Production. Never commit credentials.
11. Deploy a Preview first. Verify `/`, `/v1/health`, `/v1/assets`, and `/v1/networks/pi-testnet/health` before promoting a Production deployment.

The health route confirms local API availability only. The network health route is a reachability probe. A successful deployment does not prove that any asset or contract is deployed, verified, audited, backed or redeemable.

## Netlify project setup

1. Import the same GitHub repository.
2. Select `integration/sovereign-hybrid-ecosystem` for Deploy Previews.
3. Base directory: repository root.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Node.js: 22.x.
6. Use Netlify for static frontend preview and browser QA. The current repository has no implemented Netlify Functions; the old placeholder redirects to non-existent functions have therefore been removed.
8. If the frontend requires the API during a Netlify preview, configure the frontend to call the verified Vercel Preview API origin through an explicitly supported public build variable. Do not assume that a Netlify frontend preview also hosts the FastAPI backend.

## Replit workspace setup

1. Import the GitHub repository into Replit.
2. Use Node.js 22.12 or newer, matching the `engines.node` requirement in `package.json`.
3. Install dependencies with `npm install`.
4. Use the checked-in `.replit` run command: `npm run dev`; Vite binds to `0.0.0.0:8080` for the workspace preview.
5. Use Replit for development and preview validation. Do not add production secrets to a shared workspace or publish an unreviewed development deployment.
6. The FastAPI service can be run separately with `python -m pip install -r requirements.txt` followed by `uvicorn api.main:app --host 0.0.0.0 --port 8000`.

## Environment variable policy

- Frontend variables prefixed with `VITE_` are embedded into browser assets. They must contain public configuration only (for example, a Supabase publishable/anonymous key), never service-role keys or private credentials.
- Server-only credentials belong in the provider's encrypted environment-variable settings and must never use the `VITE_` prefix.
- Configure each environment separately: Preview/Development and Production.
- Do not copy secrets from GitHub screenshots, commit history, local `.env` files or chat messages into source control.
- Rotate any credential that may have been exposed. The deployment owner must verify the exact variable names required by the active code before adding values.

## Acceptance checklist

- [ ] GitHub integration branch is selected and source history remains intact.
- [ ] Frontend dependency install and production build pass.
- [ ] Vercel Preview deployment completes without build or function errors.
- [ ] `GET /v1/health` returns the expected API health response.
- [ ] `GET /v1/assets` returns the registry response.
- [ ] Network health reports endpoint reachability accurately; no reachability result is described as contract verification.
- [ ] Unknown asset IDs return the documented 404 response; this is intentional and must not be hidden by a fake success fallback.
- [ ] Netlify preview serves the built SPA from `dist/` and client-side routes load.
- [ ] Replit development command starts the frontend successfully.
- [ ] Seven-layer colors, names and order match the source registry and layer model without reinterpretation.
- [ ] No test-only asset, simulated market, provisional logo or proposal is presented as a live/verified financial service.
- [ ] Production domain, redirects, CORS, CSP, API origins, monitoring and rollback procedure are reviewed before launch.

## Safe migration from old environments

Do not delete existing Vercel, Netlify or Replit projects during initial setup. First create and validate the new Preview environments, compare domains and environment variables, verify API paths and data sources, and record a rollback path. Only after the new Production deployment is healthy should old deployments be disabled; delete old projects only after confirming that no domain, database, webhook, scheduled job or integration still depends on them.

## Known implementation boundary

The current PiDEX UI includes local/demo exchange behavior. The asset registry and Testnet network probes do not constitute a live exchange, order book, wallet, bank, USD-backed stablecoin or production contract deployment. Live financial actions must remain disabled until network-specific contract identity, code hash, issuer authority, security review, liquidity and operational controls are independently verified.
