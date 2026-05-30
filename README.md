# OSAI

A React + TypeScript + Vite ecommerce starter project using `pnpm`.

## Project Overview

This repository is intended to become the OSAI ecommerce application with:

- Separate customer storefront and admin apps using React + TypeScript + Vite.
- Redux Toolkit and RTK Query for app state and API data.
- Separate Node/Express backend service for REST APIs.
- PostgreSQL for product, order, and user data.
- Stripe payment integration after order persistence exists.
- Chakra UI styling with a custom OSAI design system.
- Biome for formatting and linting.
- Vitest for unit tests.
- Support for future custom AI agents and skills.

## Current Status

### Completed: Phase 1

- Monorepo scaffold with `apps/frontend` and `apps/api`.
- Frontend with React + TypeScript + Vite + Chakra UI + Redux Toolkit + RTK Query.
- Basic product listing page with sample data.
- Backend API with Express + TypeScript.
- Sample products API endpoint.
- Placeholder orders API endpoint.
- Initial OSAI Chakra theme.
- First unit tests for existing frontend and API logic.

### Completed: Phase 1.5 Frontend Rework & Architecture Hardening

- Fix root workspace scripts to use scoped package filters.
- Add app routing for `/`, `/cart`, `/checkout`, and order confirmation.
- Add a shared layout/header for navigation and cart count.
- Complete an early targeted storefront redesign before deeper checkout work.
- Improve the storefront UI with a stronger hero, category discovery, better product cards, cart feedback, and more distinct OSAI branding.
- Move frontend API URL and backend CORS/port values into typed config helpers.
- Add API health/readiness endpoints for deployment checks.
- Add API 404 and centralized error middleware.
- Add service boundaries before auth and Stripe work.
- Document validation and shared-type decisions before checkout/auth expansion.

### Completed: Phase 2 Mock Cart & Checkout

- Cart totals for subtotal, shipping, tax, and total.
- Local cart persistence across refreshes.
- Checkout form with customer information and shipping address.
- Backend order creation endpoint with mocked payment status.
- Backend-side total recalculation from trusted product prices.
- Order confirmation route and checkout failure handling.
- Shared checkout/order DTOs live in `packages/shared`.
- Backend Stripe PaymentIntent creation, frontend Stripe Elements confirmation, and webhook payment status handling are available.
- Local Stripe webhook forwarding has been verified with test-mode successful payments.

### Completed: Phase 3 User Authentication

- Login and signup pages.
- JWT-based backend auth with password hashing.
- Password policy and auth request validation.
- Protected auth middleware and role helper.
- User profile page and logout.
- Redux-backed session storage with local persistence.

### Completed: Phase 4 Database Integration

- PostgreSQL schema under `apps/api/db/migrations`.
- Seed product and inventory data under `apps/api/db/seeds`.
- Database-backed repositories for products, users, and orders when `DATABASE_URL` is configured.
- In-memory fallback for local tests and development without a running PostgreSQL server.
- Order item snapshots for historical order integrity.

### Completed: Phase 5 Admin Dashboard

- Separate admin app in `apps/admin`, running locally on port `5174`.
- Admin API routes protected by JWT and admin role checks.
- Order management with status updates.
- Payment status visibility for admin order review.
- Product management with create/delete support and backend update support.
- Inventory stock editing.
- Sales analytics and user list views.
- Customer storefront no longer bundles admin routes or admin RTK Query code.

### Completed: Phase 6 Enhanced Product Features

- Product categories, filtering, search, and product detail pages are available.
- Catalog sorting currently supports featured order, latest catalog position, popularity, price, and name.
- Related product suggestions are available on product detail pages.
- Product detail pages show available size/color variant metadata from inventory.
- Product detail pages show seeded customer reviews and rating summaries.
- Admin product creation supports image uploads through the API.

### Completed: Phase 9 Advanced Features

- Wishlist state is available in the storefront, persists locally, and has a `/wishlist` route.
- Product recommendations are served from `/api/products/recommendations` and shown on storefront/product pages.
- Core storefront navigation and hero copy use a lightweight EN/FR i18n foundation.
- Product cards, header navigation, and hero type have mobile-responsive refinements.
- Order confirmation and status-change email hooks are available through the API email service.
- Product reads use a Redis-ready cache abstraction controlled by `PRODUCT_CACHE_TTL_SECONDS`.
- Order status updates can be streamed from `/api/orders/:id/events` with Server-Sent Events.
- OpenAPI JSON is served from `/api/docs/openapi.json`.

## Development Roadmap

See `AGENTS.md` for the complete phased development plan covering:

- Cart & checkout system.
- User authentication.
- Database integration.
- Admin dashboard.
- Enhanced product features.
- Testing & QA.
- Deployment & production.
- Advanced features.
- OAuth & social features.

## Monorepo Structure

- `apps/frontend` - React customer storefront app.
  - `src/components` - reusable UI components.
  - `src/store` - Redux store setup.
  - `src/slices` - feature slices.
  - `src/api` - storefront RTK Query API controllers.
- `apps/admin` - React admin back office app.
  - `src/components` - admin shell and shared admin UI.
  - `src/pages` - admin login and dashboard pages.
  - `src/api` - admin/auth RTK Query API controllers.
  - `src/store` - admin-only Redux store and auth persistence.
- `apps/api` - Express backend app.
  - `src/controllers` - request handlers.
  - `src/routes` - route definitions.
  - `src/services` - business logic and database access.
  - `src/db.ts` - database connection setup.
  - `tests` - API unit tests.
- `packages/shared` - shared checkout and order DTOs consumed by the frontend and API.

## Setup

1. Install dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Start all apps in development:

   ```bash
   pnpm dev
   ```

   Or start them independently:

   ```bash
   pnpm dev:frontend
   pnpm dev:admin
   pnpm dev:api
   ```

3. Build for production:

   ```bash
   pnpm build
   ```

4. Run checks and tests:

   ```bash
   pnpm check
   pnpm test
   pnpm test:coverage
   ```

5. Run browser E2E smoke tests:

   ```bash
   pnpm exec playwright install chromium
   pnpm test:e2e
   ```

## CI

GitHub Actions runs `pnpm check`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, and the Playwright E2E smoke suite on pushes to `main` and pull requests using Node 20 with pnpm 8.10.0. Coverage reports are uploaded as CI artifacts. The E2E suite includes Axe accessibility scans for storefront/admin routes and keyboard checks for navigation and login forms.

## Environment

Copy `.env.example` to `.env` at the repository root and add any required values. The API and frontend scripts both load this root env file during local development.

## Local Stripe Webhooks

When testing real Stripe test-mode payments locally, keep the Stripe CLI forwarding webhooks to the API while the app is running:

```bash
stripe listen --forward-to http://localhost:4000/api/stripe/webhook
```

Use the `whsec_...` secret printed by that command as `STRIPE_WEBHOOK_SECRET` in `.env`, then restart the API. Without the listener, local orders can stay on `awaiting payment` because Stripe cannot reach `localhost:4000` directly.

## Local Admin Access

Public signup always creates customer accounts. For local development, create the first admin through the dev-only bootstrap endpoint while the API is running:

```bash
curl -X POST http://localhost:4000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "x-admin-bootstrap-secret: local_admin_bootstrap_secret" \
  -d "{\"name\":\"OSAI Admin\",\"email\":\"admin@osai.dev\",\"password\":\"password123\"}"
```

Then start the admin app with `pnpm dev:admin` and log in at `http://localhost:5174/login` with `admin@osai.dev` / `password123`. The endpoint is disabled in production and refuses to create another admin once one exists.

## Database

Phase 4 uses plain SQL migration and seed files:

- `apps/api/db/migrations/001_initial_schema.sql`
- `apps/api/db/migrations/002_product_popularity_score.sql`
- `apps/api/db/migrations/003_product_reviews.sql`
- `apps/api/db/seeds/001_seed_products.sql`

Apply them to your PostgreSQL database with your preferred SQL client before running the API with `DATABASE_URL`. Without `DATABASE_URL`, the API keeps using deterministic in-memory data so tests and local frontend work still run.

## Deployment

The API is configured for Render with the root `render.yaml` Blueprint. The Blueprint creates:

- `osai-api` as a Node web service.
- `osai-postgres` as the production PostgreSQL database.
- `DATABASE_URL` wired from the Render database connection string.
- `/api/health/ready` as the API health check path.

Production API commands:

```bash
pnpm --filter @osai/shared build && pnpm --filter @osai/api build
pnpm --filter @osai/api start
```

Production environment matrix:

| Area | Variable | Owner | Notes |
| --- | --- | --- | --- |
| API runtime | `NODE_ENV` | Render Blueprint | Set to `production`. |
| API runtime | `PORT` | Render Blueprint | Set to `10000`; Express reads `process.env.PORT`. |
| Database | `DATABASE_URL` | Render database | Injected from `osai-postgres`. |
| Auth | `JWT_SECRET` | Render Blueprint | Generated by Render. |
| CORS | `CORS_ORIGINS` | Render Dashboard | Comma-separated Netlify storefront/admin origins. |
| Stripe | `STRIPE_SECRET_KEY` | Render Dashboard | Secret key for server-side Stripe calls. |
| Stripe | `STRIPE_PUBLISHABLE_KEY` | Render Dashboard | Returned by API checkout config responses. |
| Stripe | `STRIPE_WEBHOOK_SECRET` | Render Dashboard | Webhook signing secret from the Stripe Dashboard. |
| Monitoring | `SENTRY_DSN` | Render Dashboard | Optional Sentry DSN for API error reporting. |
| Monitoring | `SENTRY_TRACES_SAMPLE_RATE` | Render Dashboard | Optional trace sample rate from `0` to `1`; defaults to `0`. |
| Uploads | `UPLOAD_DIR` | Render Dashboard | Optional local upload directory; defaults to `uploads` under the repo root. Use a persistent Render disk for durable product uploads. |
| Cache | `PRODUCT_CACHE_TTL_SECONDS` | Render Dashboard | Product read cache TTL; set `0` to disable local caching. |
| Cache | `REDIS_URL` | Render Dashboard | Reserved for Redis-backed caching when a Redis service is added. |
| Email | `EMAIL_FROM` | Render Dashboard | Sender address used by the email notification service. |
| Storefront | `VITE_API_BASE_URL` | Netlify | Public API URL plus `/api`. |
| Storefront | `VITE_STRIPE_PUBLISHABLE_KEY` | Netlify | Browser-safe Stripe publishable key. |
| Admin | `VITE_API_BASE_URL` | Netlify | Same public API URL plus `/api`. |

After the Render Blueprint is applied, run the SQL files in `apps/api/db/migrations` and `apps/api/db/seeds` against the production database before sending real traffic to the storefront.

Netlify hosts the storefront and admin as separate sites from the same repository:

| App | Build command | Publish directory |
| --- | --- | --- |
| Storefront | `pnpm --filter @osai/frontend build` | `apps/frontend/dist` |
| Admin | `pnpm --filter @osai/admin build` | `apps/admin/dist` |

Both Vite apps include a `public/_redirects` file so direct reloads on client-side routes such as `/cart`, `/checkout`, `/products/:id`, and admin `/login` return `index.html`.

Each app also has its own `netlify.toml` for file-based configuration. Keep the Netlify site base directory empty when using those files, because their build and publish paths are relative to the repository root. If Netlify is configured with an app base directory instead, override the settings in the Netlify dashboard with:

| App | Base directory | Publish directory |
| --- | --- | --- |
| Storefront | `apps/frontend` | `dist` |
| Admin | `apps/admin` | `dist` |

Render and Netlify provide HTTPS certificates for their managed service domains.

## Architecture Decisions

- Runtime config is centralized in `apps/frontend/src/config.ts`, `apps/admin/src/config.ts`, and `apps/api/src/config.ts`; avoid reading environment variables directly from feature code.
- Customer and admin are separate Vite apps. Storefront-specific cart, checkout, Stripe Elements, and product browsing code lives in `apps/frontend`; admin order, product, inventory, analytics, and user management code lives in `apps/admin`.
- API health checks live at `/api/health` and `/api/health/ready`.
- Backend errors should return consistent JSON with `code` and `message`.
- Request validation strategy: use schema validation at the controller boundary before checkout/auth write endpoints are added. Prefer adding a dedicated validator library such as Zod when the first real write contract is implemented, then keep parsed payload types close to the route/controller.
- Shared DTO strategy: keep types app-local while product browsing is simple. Introduce `packages/shared` when checkout/order request and response shapes are stable enough to be reused by both frontend and backend.
- Checkout totals displayed by the frontend are estimates. The API recalculates order totals from product data when creating the mocked order.
- Auth and orders use PostgreSQL-backed repositories when `DATABASE_URL` is configured, with in-memory fallback for tests and no-database local development.
- Stripe secret-key operations stay on the API. The storefront requests `/api/orders/payment-intent` and confirms payment with Stripe Elements when a publishable key is configured.
- Product image uploads are admin-only and stored under `UPLOAD_DIR/product-images`; the API serves them from `/uploads/product-images/...`.
- Product recommendations are available at `/api/products/recommendations` and favor popularity, rating, and matching category.
- Product reads are cached through a small cache service. The current implementation is in-memory with Redis-ready config (`REDIS_URL`) documented for a provider swap.
- Order status updates can be consumed with Server-Sent Events from `/api/orders/:id/events`.
- OpenAPI JSON is available at `/api/docs/openapi.json`.
- Email notification hooks send order confirmation and order status messages through the API email service; wire a provider inside that service when moving beyond console/local delivery.
- The API emits structured request logs with method, path, status code, duration, timestamp, and level. It does not log request bodies or secrets.
- Sentry API error monitoring is optional and activates only when `SENTRY_DSN` is configured. The API captures server errors and leaves validation/auth errors out of Sentry noise.

## Project Skills

Project-local Codex skills live in `.agents/skills/`.

- OSAI-specific skills: `osai-ui-design`, `osai-api-design`, `osai-database-design`, `osai-security-review`, `osai-qa-testing`, `osai-deployment`, and `osai-brainstorming`.
- Vendored official OpenAI skills: `security-best-practices`, `security-threat-model`, `netlify-deploy`, `render-deploy`, and `playwright`.

## Notes

- `AGENTS.md` defines the planned agent roles, skills, and phased roadmap for this project.
- `.agents/skills/` contains the reusable project-local Codex skills for OSAI.
- `.gitignore` excludes dependency folders, build output, local env files, editor files, and local pnpm cache output.
