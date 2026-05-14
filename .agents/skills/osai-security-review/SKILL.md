---
name: osai-security-review
description: Review and implement OSAI-specific security for authentication, authorization, guest checkout, admin roles, Stripe PaymentIntent and webhook flows, secrets, environment variables, customer data, and order data. Use for security-sensitive ecommerce features and to adapt general security guidance to OSAI.
---

# OSAI Security Review

## Workflow

1. Inspect the current frontend/API flow and identify trust boundaries before suggesting fixes.
2. Use `security-best-practices` for general JavaScript/TypeScript web guidance when a broader security review is needed.
3. Use `security-threat-model` when the user asks for explicit threat modeling.
4. Keep secrets server-side. Never expose Stripe secret keys, JWT secrets, database URLs, or webhook secrets to the frontend.
5. Add security-focused tests for auth, roles, validation, and webhook behavior.

## OSAI Security Priorities

- Separate customer and admin authorization clearly.
- Support guest checkout without granting account privileges.
- Validate checkout payloads server-side, including totals and product IDs.
- Treat client-side totals as display-only; calculate trusted totals on the backend.
- Verify Stripe webhook signatures before processing events.
- Document required secrets in `.env.example` without committing real values.

## Verification

Run `pnpm.cmd check` and `pnpm.cmd test`. For reports, include concrete file/line references and severity.
