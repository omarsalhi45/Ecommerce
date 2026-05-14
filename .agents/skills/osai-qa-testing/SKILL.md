---
name: osai-qa-testing
description: Plan and implement OSAI quality coverage using Vitest, React Testing Library, API tests, reducer tests, integration tests, and future E2E scenarios. Use for test strategy, regression coverage, checkout edge cases, cart logic, API endpoint behavior, and release-readiness checks.
---

# OSAI QA Testing

## Workflow

1. Inspect the feature and existing tests before adding coverage.
2. Test new logic at the smallest useful boundary: reducer, selector, service, controller, or component.
3. Cover ecommerce edge cases: empty cart, quantity changes, removed products, invalid checkout fields, failed payment, and order confirmation.
4. Keep tests deterministic. Mock network/payment/database dependencies until those integrations are intentionally under test.
5. Run the project checks before reporting completion.

## Coverage Priorities

- Cart actions, selectors, and total calculations.
- Checkout form validation and order payload creation.
- Product and order API service behavior.
- Auth and admin guard behavior once implemented.
- Stripe webhook signature handling once Stripe is integrated.
- Future E2E flows: browse products, add to cart, checkout, confirmation, admin order update.

## Verification

Use `pnpm.cmd test` for test suites and `pnpm.cmd check` for lint/type coverage.
