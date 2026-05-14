---
name: osai-api-design
description: Design and implement OSAI backend REST APIs using Express, TypeScript, controllers, routes, services, and validation. Use for product, cart, checkout, order, auth, admin, inventory, and Stripe-facing API contracts in the OSAI monorepo.
---

# OSAI API Design

## Workflow

1. Inspect current API structure before editing: `apps/api/src/app.ts`, `routes`, `controllers`, `services`, and `db.ts`.
2. Define the REST contract before implementation: route, method, request body, response body, status codes, and validation failures.
3. Keep route handlers thin. Put business logic in services and persistence logic behind clear service/database boundaries.
4. Use TypeScript strictly and avoid changing public API shapes without explicit user approval.
5. Add Vitest coverage for new service logic and endpoint behavior.

## OSAI API Conventions

- Product browsing should stay read-friendly and cacheable.
- Checkout should start with mocked order creation before live Stripe behavior.
- Order APIs should return stable IDs, status, totals, and line items.
- Admin APIs should be separated by route and guarded once auth exists.
- Errors should use consistent JSON responses with clear messages.
- Environment-dependent integrations must be documented in `.env.example`.

## Verification

Run `pnpm.cmd check` and `pnpm.cmd test` from the repo root after API changes.
