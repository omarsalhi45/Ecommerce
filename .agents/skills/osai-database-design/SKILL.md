---
name: osai-database-design
description: Design OSAI PostgreSQL persistence for products, users, orders, order items, carts, inventory, migrations, seeds, and indexes. Use when introducing database schemas, migration tooling, data access patterns, seed data, or persistence decisions for the ecommerce app.
---

# OSAI Database Design

## Workflow

1. Inspect the API services and `apps/api/src/db.ts` before proposing schema changes.
2. Choose or follow the existing migration tool before adding schema files.
3. Model ecommerce data around stable business concepts: users, products, variants, inventory, orders, order items, payments, and addresses.
4. Keep seed data realistic enough for frontend development and tests.
5. Add tests for data mapping and service behavior that depends on persistence.

## Schema Guidance

- Use UUIDs or opaque IDs for public resources.
- Keep order totals auditable: subtotal, shipping, tax, discount, and total.
- Store order item snapshots so historical orders do not change when products change.
- Track inventory separately from product display data.
- Add indexes for lookup paths that user/admin flows need.
- Avoid adding live payment persistence until the checkout contract is stable.

## Verification

Run migrations against a local database when migration tooling exists, then run `pnpm.cmd check` and `pnpm.cmd test`.
