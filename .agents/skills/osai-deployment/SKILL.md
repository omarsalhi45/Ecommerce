---
name: osai-deployment
description: Plan and configure OSAI deployment for the monorepo, with Netlify for the Vite frontend and Render for the Express API, including environment variables, build commands, production checks, logging, and deployment verification. Use for deployment strategy, production configuration, and release readiness.
---

# OSAI Deployment

## Workflow

1. Inspect package scripts, workspace layout, env files, and app build requirements before deployment changes.
2. Use `netlify-deploy` for frontend deployment details.
3. Use `render-deploy` for backend deployment details.
4. Keep frontend and API deployment concerns separate, with explicit environment variables for each.
5. Run local checks and tests before proposing or performing production deployment.

## OSAI Deployment Defaults

- Frontend app: `apps/frontend`, Vite build, deploy to Netlify.
- Backend app: `apps/api`, Express service, deploy to Render by default.
- Database: hosted PostgreSQL connected to the backend only.
- Frontend env: public API base URL only, using `VITE_` prefix.
- Backend env: database URL, auth secrets, Stripe secrets, CORS origins, and runtime port.
- Production verification: health endpoint, product listing, cart flow, checkout flow, and admin API guard checks.

## Verification

Run `pnpm.cmd check`, `pnpm.cmd test`, and relevant build commands before release. Verify deployed frontend talks to the deployed API.
