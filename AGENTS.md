# AGENTS

This file defines the AI agents, custom skills, and development roadmap that guide the OSAI ecommerce project.

## Purpose

- Document agent roles, responsibilities, and ownership areas.
- Define the skills needed for product management, checkout flow, admin tools, security, database work, and developer workflow.
- Keep the TODO list aligned with the actual repository state.
- Capture the future direction for conversational and automation agents.

## Project Definition

- Project name: `OSAI`
- Front office: landing page with project description, product browsing, product categories such as clothes, cart, checkout, and purchase flow.
- Back office: admin dashboard for managing orders and commands.
- Target audience: young people.
- API style: RESTful TypeScript backend using Express.
- Database: PostgreSQL.
- Authentication: guest checkout plus registered customers, with separate admin users.
- Payment provider: Stripe.
- Styling system: Chakra UI with a custom OSAI design system theme.
- Code quality: Biome for formatting and linting instead of ESLint.
- Deployment target: Netlify for the storefront and admin apps, with separate Node/Express backend hosting.
- Testing requirement: unit tests first using Vitest, with E2E planned later.

## Architecture Considerations

- Repository: monorepo with separate app folders, `apps/frontend`, `apps/admin`, and `apps/api`.
- Storefront: React + TypeScript + Vite + Chakra UI + Redux Toolkit + RTK Query.
- Admin: separate React + TypeScript + Vite app with admin-only routes, state, and API slices.
- Backend: Express REST API in TypeScript, hosted separately from the frontend.
- Data: PostgreSQL for orders, products, users, and inventory.
- Auth: email/password plus optional OAuth for both customers and admin roles, with role-based access managed in the same auth system.
- Deployment: storefront and admin on Netlify, backend as a separate Node/Express service.
- Checkout: start with simple flat-rate shipping and a fixed tax rate.
- Product catalog: initial clothing categories with flexible attributes for easy expansion.
- Recommended backend hosting options: Render, Railway, or Fly.io for Express + PostgreSQL.
- OAuth: plan for later implementation after email/password auth is stable.

## Priorities / TODO

### Phase 1: Core Frontend And API Scaffold - Complete

- [x] Implement monorepo scaffold with `apps/frontend` and `apps/api`.
- [x] Build frontend with React + TypeScript + Vite + Chakra UI.
- [x] Add Redux Toolkit + RTK Query setup.
- [x] Create product listing page with sample data.
- [x] Connect frontend to backend API.
- [x] Add Express API routes for products and placeholder orders.
- [x] Add initial OSAI Chakra theme.

### Phase 1.5: Frontend Rework & Architecture Hardening - Complete

- [x] Fix root package scripts to use scoped pnpm filters: `@osai/frontend` and `@osai/api`.
- [x] Add frontend app routing foundation with routes for `/`, `/cart`, `/checkout`, and order confirmation.
- [x] Add a shared app layout/header that can hold cart count, navigation, and future auth/admin links.
- [x] Add cart count/badge visibility in the shared header.
- [x] Complete an early targeted storefront redesign before deeper checkout work.
- [x] Redesign the homepage into a more polished storefront, not just a product-grid demo.
- [x] Add a stronger product-led hero with real clothing/storefront imagery.
- [x] Add a category or collection strip for quick product discovery.
- [x] Tighten product card styling with better image ratios, clearer hierarchy, and less generic card treatment.
- [x] Add add-to-cart feedback such as a toast and quick access to the cart.
- [x] Replace random placeholder product images with better clothing/product imagery.
- [x] Tune the OSAI theme so the brand feels less generic and less slate-heavy.
- [x] Remove or narrow global CSS transitions that apply to every element.
- [x] Move API base URL and frontend runtime assumptions into a small typed frontend config helper.
- [x] Move API CORS origins, port, and environment assumptions into backend config.
- [x] Add API health/readiness endpoint for deployment checks.
- [x] Add API 404 and centralized error-handling middleware.
- [x] Choose and document request validation strategy before adding checkout/auth write endpoints.
- [x] Add service-layer boundaries before auth and Stripe implementation so controllers stay thin.
- [x] Decide when to introduce `packages/shared` for API DTOs and shared types; default to adding it when checkout/order contracts expand.
- [x] Document architecture decisions in `README.md` or `AGENTS.md` when they affect app boundaries.

### Phase 2: Cart & Checkout System - Mock Checkout Complete

- [x] Add cart slice with add, decrement, remove, and clear actions.
- [x] Wire product cards to add items to the cart.
- [x] Use the Phase 1.5 routing foundation for cart, checkout, and order confirmation navigation.
- [x] Create cart page component (`/cart`).
- [x] Add cart item quantity controls in the cart page.
- [x] Connect cart page and header badge/count to the same cart selectors.
- [x] Implement cart selectors for item count, subtotal, shipping, tax, and total.
- [x] Persist cart state locally so refreshes do not empty the cart.
- [x] Add empty cart, empty product list, and product loading skeleton states.
- [x] Add retry affordance for product loading failures.
- [x] Add unit tests for cart reducer and cart total calculations.
- [x] Define checkout API contract before Stripe integration.
- [x] Validate checkout request payloads on the backend.
- [x] Recalculate trusted checkout totals on the backend instead of trusting client totals.
- [x] Create checkout page with customer information form.
- [x] Add shipping address collection.
- [x] Create backend order creation endpoint with mocked payment status.
- [x] Implement order confirmation page.
- [x] Add order success/failure handling.
- [x] Add shared checkout/order DTOs once the request and response shapes stabilize.
- [x] Add backend Stripe PaymentIntent creation after order persistence exists.
- [x] Wire frontend Stripe Elements confirmation to the PaymentIntent endpoint.
- [x] Configure backend Stripe webhook handling after database-backed orders exist.
- [x] Verify local Stripe webhook forwarding with test-mode `payment_intent.succeeded` events.

### Phase 3: User Authentication - Complete

- [x] Confirm auth service boundaries before adding controllers or middleware.
- [x] Create login/signup pages.
- [x] Add password hashing and password policy rules.
- [x] Add auth request validation and safe auth error responses.
- [x] Implement JWT authentication in backend.
- [x] Add protected routes middleware.
- [x] Create user registration API endpoints.
- [x] Add login/logout functionality.
- [x] Implement role-based access (customer/admin).
- [x] Add user profile management.
- [x] Store user session in Redux.

### Phase 4: Database Integration - Complete

- [x] Choose and configure migration approach with project SQL migration files.
- [x] Set up PostgreSQL connection through backend config.
- [x] Create database schema for users, products, orders, order items, carts, cart items, and inventory.
- [x] Move product catalog from in-memory sample data to seeded database data when `DATABASE_URL` is configured.
- [x] Store order item snapshots so historical orders keep product name, price, size, and color at purchase time.
- [x] Implement product CRUD service/API operations for admin use.
- [x] Add order storage and retrieval through PostgreSQL-backed repositories when configured.
- [x] Implement user data persistence through PostgreSQL-backed repositories when configured.
- [x] Add database migrations.
- [x] Set up database seeding for initial data.
- [x] Keep shared DTOs aligned with persisted product, user, and order shapes.

### Phase 5: Admin Dashboard (Back Office) - Complete

- [x] Create admin layout with navigation.
- [x] Split admin into a separate `apps/admin` Vite app instead of bundling back office routes into the storefront.
- [x] Build order management page for viewing all orders.
- [x] Add admin empty, loading, and error states for order/product management.
- [x] Add order status updates from pending to shipped to delivered.
- [x] Show payment status in order management.
- [x] Create product management with CRUD-capable API operations and initial admin UI.
- [x] Add inventory management.
- [x] Implement sales analytics dashboard.
- [x] Add user management for admins.
- [x] Create admin authentication guards.

### Phase 6: Enhanced Product Features

- [x] Add product categories and filtering.
- [x] Add product sorting by newest, price, and popularity once product metadata supports it.
- [x] Implement search functionality.
- [x] Add product detail pages (`/products/:id`).
- [ ] Create product image upload using local or cloud storage.
- [x] Add product variants such as sizes and colors.
- [ ] Implement product reviews and ratings.
- [x] Add related products suggestions.

### Phase 7: Testing & Quality Assurance

- [x] Add first Vitest tests for existing frontend and API logic.
- [x] Add tests around Phase 1.5 architecture helpers such as config parsing and cart selectors.
- [x] Add tests for Phase 6 catalog search, filtering, sorting, and related-product logic.
- [x] Add tests for product variant response data.
- [ ] Write unit tests for React components with Vitest + Testing Library.
- [x] Add API endpoint tests.
- [x] Test Redux actions, reducers, and selectors.
- [x] Add checkout contract tests before Stripe integration.
- [x] Add auth tests before admin features rely on them.
- [x] Add role-guard tests before admin features rely on them.
- [ ] Add accessibility checks for keyboard navigation, focus states, labels, and color contrast.
- [ ] Add empty/loading/error state tests for key frontend flows.
- [ ] Implement E2E tests with Playwright or Cypress.
- [ ] Add integration tests for critical flows.
- [x] Set up CI/CD pipeline with testing.
- [ ] Add code coverage reporting.

### Phase 8: Deployment & Production

- [x] Configure Netlify deployment for frontend.
- [x] Configure Netlify deployment for the separate admin app.
- [x] Add Netlify config file when frontend deployment settings stabilize.
- [x] Fix Netlify hard-refresh routing for SPA routes such as admin `/login`.
- [x] Prevent admin dashboard queries from firing before a valid admin session exists.
- [x] Set up backend deployment on Render, Railway, or Fly.io.
- [x] Add backend hosting config such as `render.yaml` once the API runtime and database are defined.
- [x] Configure environment variables for production.
- [x] Add production env matrix for frontend, backend, database, auth, Stripe, and CORS secrets.
- [x] Configure production CORS origins through environment variables.
- [x] Set up PostgreSQL database in production.
- [x] Add `STRIPE_WEBHOOK_SECRET` and public Stripe publishable key handling to env docs before live Stripe work.
- [x] Add backend Stripe webhook signature verification and payment status handling.
- [x] Configure Stripe webhooks in the Stripe dashboard for production.
- [x] Add error monitoring such as Sentry.
- [x] Implement logging system.
- [x] Add GitHub Actions or equivalent CI for check, test, and build.
- [x] Set up SSL certificates.

### Phase 9: Advanced Features (Future)

- [ ] Add email notifications for order confirmations and shipping updates.
- [ ] Implement wishlist functionality.
- [ ] Add product recommendations.
- [ ] Create mobile-responsive design improvements.
- [ ] Add multi-language support (i18n).
- [ ] Implement caching with Redis.
- [ ] Add real-time order status updates.
- [ ] Create API documentation with Swagger/OpenAPI.

### Phase 10: OAuth & Social Features (Future)

- [ ] Add OAuth providers such as Google and GitHub.
- [ ] Implement social login.
- [ ] Add user profile pictures.
- [ ] Create social sharing for products.
- [ ] Add referral system.
- [ ] Implement user activity tracking.

## Agent Roles

### `dev-planner`

- Use for architecture decisions, folder structure, sequencing, and roadmap changes.
- Owns: high-level planning across `AGENTS.md`, `README.md`, package scripts, and cross-app conventions.
- Expected output: implementation plan, tradeoffs, and updated TODOs when scope changes.

### `frontend-agent`

- Use for UI, product browsing, cart, checkout, customer account pages, and frontend state.
- Owns: `apps/frontend/src/components`, `apps/frontend/src/pages`, `apps/frontend/src/api`, `apps/frontend/src/slices`, and `apps/frontend/src/store`.
- Expected output: small React components, typed Redux/RTK Query logic, responsive Chakra UI, and focused frontend tests.

### `admin-agent`

- Use for back office UI, admin authentication flow, order management, product management, inventory, analytics, and user management.
- Owns: `apps/admin/src/components`, `apps/admin/src/pages`, `apps/admin/src/api`, `apps/admin/src/slices`, and `apps/admin/src/store`.
- Expected output: admin-only React components, typed RTK Query admin operations, role-aware UI states, and focused admin tests.

### `backend-agent`

- Use for REST API design, controllers, routes, services, order management, and backend validation.
- Owns: `apps/api/src/controllers`, `apps/api/src/routes`, `apps/api/src/services`, and API test files.
- Expected output: typed Express handlers, clear service boundaries, REST contracts, and focused API tests.

### `database-agent`

- Use for PostgreSQL schema design, migrations, seeds, indexes, and data access decisions.
- Owns: database connection setup, future migration files, seed data, and database-backed service logic.
- Expected output: migration plan, schema changes, seed strategy, and data integrity notes.

### `security-agent`

- Use for authentication, authorization, Stripe integration security, sensitive env vars, and safe data handling.
- Owns: auth middleware, token/session design, role checks, payment webhook validation, and security-sensitive review.
- Expected output: security review notes, safe implementation patterns, and tests for auth/payment edge cases.

### `qa-agent`

- Use for test strategy, regression review, checkout edge cases, and release readiness.
- Owns: unit test plans, API endpoint test coverage, future E2E coverage, and CI quality gates.
- Expected output: prioritized findings, missing test coverage, and executable test cases.

### `deployment-agent`

- Use for Netlify frontend deployment, backend hosting, production env vars, database hosting, and CI/CD.
- Owns: deployment docs, environment configuration, production build checks, and hosting-specific setup.
- Expected output: deployment checklist, environment variable matrix, and production verification steps.

### `brainstorming-agent`

- Use for product strategy, naming, UX concepts, feature prioritization, and future roadmap ideas.
- Owns: exploratory product direction, not production code.
- Expected output: concise options, recommended direction, and risks or assumptions.

## Skills

Project-local Codex skills live in `.agents/skills/` so they travel with this repository.

### OSAI-Specific Skills

- `osai-ui-design`: React, Chakra UI, Redux Toolkit, RTK Query, product browsing, cart, checkout, admin UI, and young-audience ecommerce UX.
- `osai-api-design`: Express REST contracts, controllers, routes, services, validation, product/order/auth/admin APIs, and backend test guidance.
- `osai-database-design`: PostgreSQL schemas, migrations, seeds, indexes, products, users, orders, order items, carts, and inventory modeling.
- `osai-security-review`: OSAI-specific auth, admin roles, guest checkout, Stripe safety, webhook validation, secrets, and sensitive customer/order data handling.
- `osai-qa-testing`: Vitest, React Testing Library, reducer tests, API tests, checkout edge cases, regression coverage, and future E2E scenarios.
- `osai-deployment`: OSAI monorepo deployment routing with Netlify for the frontend and Render for the backend.
- `osai-brainstorming`: product strategy, roadmap tradeoffs, naming, audience fit, UX concepts, and future ecommerce feature ideation.

### Vendored Official OpenAI Skills

- `security-best-practices`: general JavaScript/TypeScript web security best-practice review.
- `security-threat-model`: repository-grounded AppSec threat modeling.
- `netlify-deploy`: Netlify deployment workflow for the frontend.
- `render-deploy`: Render deployment workflow for the backend and related infrastructure.
- `playwright`: browser automation and UI-flow debugging support.

### Skill Coverage Areas

- UI design: component layout, responsive Chakra UI, design system consistency, and ecommerce UX.
- API design: REST resources, request/response contracts, error handling, and validation.
- Database design: PostgreSQL schemas, migrations, seeding, indexing, and data integrity.
- Security: authentication, authorization, Stripe webhook verification, secrets, and safe user data handling.
- QA/testing: Vitest unit tests, API endpoint tests, reducer tests, future E2E flows, and regression coverage.
- Infrastructure: monorepo scripts, deployment, environment variables, logging, and production readiness.
- Brainstorming: product strategy, roadmap tradeoffs, audience fit, and feature prioritization.

## Rules

- Use TypeScript strictly.
- Keep components small.
- Do not modify public APIs without asking.
- Add tests for new logic.
- Keep `AGENTS.md` and `README.md` aligned with major architecture changes.
- Keep storefront and admin UI code separated between `apps/frontend` and `apps/admin`.
- Prefer mocked checkout/order flow before integrating live Stripe behavior.
- Do not commit secrets; use `.env.example` for documented environment variables.

## Next Steps

- Continue Phase 6 with product variants, image upload, reviews, ratings, popularity metadata, and richer recommendations.
- Add admin-app focused component tests and deployment config after the split stabilizes.
- Add shared checkout/order DTO package if API/frontend contract duplication starts to drift.
- Move toward Phase 8 deployment once database hosting and production env values are selected.
- Keep `.agents/skills/` updated as OSAI conventions evolve.
