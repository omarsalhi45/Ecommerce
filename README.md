# OSAI

A React + TypeScript + Vite ecommerce starter project using `pnpm`.

## Project Overview

This repository is intended to become the OSAI ecommerce application with:

- Modern frontend using React + TypeScript + Vite.
- Redux Toolkit and RTK Query for frontend state and API data.
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

- Admin route and dashboard at `/admin`.
- Admin API routes protected by JWT and admin role checks.
- Order management with status updates.
- Product management with create/delete support and backend update support.
- Inventory stock editing.
- Sales analytics and user list views.

### Next Priority: Phase 6 Enhanced Product Features

- Product categories and filtering.
- Product search and sorting.
- Product detail pages.
- Variants for sizes and colors.
- Product reviews, ratings, and related products.

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

- `apps/frontend` - React frontend app.
  - `src/components` - reusable UI components.
  - `src/store` - Redux store setup.
  - `src/slices` - feature slices.
  - `src/api` - RTK Query API controllers.
- `apps/api` - Express backend app.
  - `src/controllers` - request handlers.
  - `src/routes` - route definitions.
  - `src/services` - business logic and database access.
  - `src/db.ts` - database connection setup.
  - `tests` - API unit tests.

## Setup

1. Install dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Start both apps in development:

   ```bash
   pnpm dev
   ```

3. Build for production:

   ```bash
   pnpm build
   ```

4. Run checks and tests:

   ```bash
   pnpm check
   pnpm test
   ```

## Environment

Copy `.env.example` to `.env` and add any required values.

## Local Admin Access

Public signup always creates customer accounts. For local development, create the first admin through the dev-only bootstrap endpoint while the API is running:

```bash
curl -X POST http://localhost:4000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "x-admin-bootstrap-secret: local_admin_bootstrap_secret" \
  -d "{\"name\":\"OSAI Admin\",\"email\":\"admin@osai.dev\",\"password\":\"password123\"}"
```

Then log in at `/login` with `admin@osai.dev` / `password123` and open `/admin`. The endpoint is disabled in production and refuses to create another admin once one exists.

## Database

Phase 4 uses plain SQL migration and seed files:

- `apps/api/db/migrations/001_initial_schema.sql`
- `apps/api/db/seeds/001_seed_products.sql`

Apply them to your PostgreSQL database with your preferred SQL client before running the API with `DATABASE_URL`. Without `DATABASE_URL`, the API keeps using deterministic in-memory data so tests and local frontend work still run.

## Architecture Decisions

- Runtime config is centralized in `apps/frontend/src/config.ts` and `apps/api/src/config.ts`; avoid reading environment variables directly from feature code.
- API health checks live at `/api/health` and `/api/health/ready`.
- Backend errors should return consistent JSON with `code` and `message`.
- Request validation strategy: use schema validation at the controller boundary before checkout/auth write endpoints are added. Prefer adding a dedicated validator library such as Zod when the first real write contract is implemented, then keep parsed payload types close to the route/controller.
- Shared DTO strategy: keep types app-local while product browsing is simple. Introduce `packages/shared` when checkout/order request and response shapes are stable enough to be reused by both frontend and backend.
- Checkout totals displayed by the frontend are estimates. The API recalculates order totals from product data when creating the mocked order.
- Auth and orders use PostgreSQL-backed repositories when `DATABASE_URL` is configured, with in-memory fallback for tests and no-database local development.

## Project Skills

Project-local Codex skills live in `.agents/skills/`.

- OSAI-specific skills: `osai-ui-design`, `osai-api-design`, `osai-database-design`, `osai-security-review`, `osai-qa-testing`, `osai-deployment`, and `osai-brainstorming`.
- Vendored official OpenAI skills: `security-best-practices`, `security-threat-model`, `netlify-deploy`, `render-deploy`, and `playwright`.

## Notes

- `AGENTS.md` defines the planned agent roles, skills, and phased roadmap for this project.
- `.agents/skills/` contains the reusable project-local Codex skills for OSAI.
- `.gitignore` excludes dependency folders, build output, local env files, editor files, and local pnpm cache output.
