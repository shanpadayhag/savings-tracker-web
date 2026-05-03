---
name: nextjs-standards
description: >
  Enforce opinionated Next.js coding standards across the full stack — server-side (API routes, server actions, data fetching) and client-side (React components). Use this skill whenever the user is writing, reviewing, or refactoring Next.js code, React components, API routes, server actions, or any TypeScript/JavaScript in a Next.js project. Trigger even for partial snippets, quick questions about component structure, or requests to "clean up" or "improve" Next.js/React code. Covers: memory-efficient data patterns, single-responsibility design, descriptive naming, readable decomposition, and React performance primitives (memo, useCallback, useMemo, state colocation).
---

# Next.js Coding Standards Skill

Apply these standards to **all** Next.js code — server and client — whenever writing, reviewing, or refactoring. Read the relevant reference file(s) before producing output.

## Reference Files

| File | When to read |
|------|-------------|
| `references/server.md` | API routes, server actions, data fetching, DB queries, middleware |
| `references/client.md` | React components, hooks, state, memoization, event handlers |
| `references/naming.md` | Naming conventions for both layers |

For full-stack tasks (e.g. a page with a server action + a client component), read both `server.md` and `client.md`.

---

## Core Principles (apply everywhere)

These five rules govern **every** file, function, and module:

1. **Memory efficient** — cursor/keyset pagination over full scans; stream or paginate instead of collecting into arrays unless the consumer truly needs all items at once.
2. **Resource efficient** — minimize loops, avoid redundant work, no speculative allocations; do the minimum work required.
3. **Single responsibility** — one action per route handler or server action, one concern per function, one job per component.
4. **Descriptive naming** — names explain *intent* (what it does for the caller), not *implementation* (how it works inside). Read `references/naming.md`.
5. **Readable decomposition** — break functions longer than ~30 lines into named sub-functions; each sub-function should be understandable in isolation.

---

## Quick Decision Tree

```
Is this server-side code?
  ├─ API route / server action / middleware → read references/server.md
  └─ Data fetching in a Server Component  → read references/server.md

Is this client-side code?
  ├─ React component (.tsx, "use client")  → read references/client.md
  └─ Custom hook                           → read references/client.md

Is this both?
  └─ Read both server.md and client.md
```

---

## Non-Negotiables (never violate these)

- Never `SELECT *` or fetch unbounded collections — always limit/paginate.
- Never define functions or objects inside render that can be hoisted or memoized.
- Never use `any` as a type without an explanatory comment.
- Never put multiple unrelated concerns in one component or route handler.
- Never name a variable `data`, `result`, `item`, `obj`, or `temp` without a qualifier.
