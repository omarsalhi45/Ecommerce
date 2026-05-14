---
name: osai-ui-design
description: Design and implement OSAI frontend experiences using React, TypeScript, Chakra UI, Redux Toolkit, and RTK Query. Use for product browsing, cart, checkout, customer account pages, admin UI surfaces, responsive ecommerce layout, Chakra theme work, and young-audience clothing ecommerce UX decisions.
---

# OSAI UI Design

## Workflow

1. Inspect existing frontend patterns before changing UI: `apps/frontend/src/App.tsx`, `pages`, `components`, `theme.ts`, `slices`, and `api`.
2. Keep the first screen usable, not marketing-only. For OSAI, prioritize browsing, cart, checkout, and admin workflows.
3. Use Chakra UI primitives and the OSAI theme first. Add component abstractions only when repeated structure or behavior justifies them.
4. Keep components small and typed. Put shared state in Redux slices and server data in RTK Query APIs.
5. Add focused Vitest/Testing Library coverage for new UI logic, reducers, selectors, or critical interactions.

## OSAI UI Rules

- Build for young clothing shoppers: confident, clean, modern, fast to scan.
- Use product images that show the actual product state whenever possible.
- Keep cards for repeated product/order items, not page sections.
- Make cart and checkout controls obvious: quantity steppers, remove actions, totals, shipping, tax, and confirmation states.
- Preserve responsive behavior on mobile, tablet, and desktop.
- Do not add broad landing page copy when the requested feature is an app workflow.

## Verification

Run `pnpm.cmd check` and `pnpm.cmd test` from the repo root after UI changes. For meaningful visual changes, start the frontend and inspect the page in the browser.
