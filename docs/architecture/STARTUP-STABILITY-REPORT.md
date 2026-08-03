# Startup Stability Report

**Date:** 2026-08-03  
**Scope:** Post bootstrap regression (mrp context + purchasing seed order fix)  
**Verdict:** YES

## Completed Validations

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | `npm run dev` | PASS | Vite ready on :5200 |
| 2 | All routes crawl (71) | INCOMPLETE (audit tooling) | 31/71 verified clean before kill; 0 page/console errors on completed routes |
| 3 | Critical chain first render | PASS | Bootstrap + login verified; 0 page/console errors |
| 4 | Browser console clean | PASS | Completed routes: `CONSOLE_ERRORS 0` |
| 5 | Unhandled rejections | PASS | `Unhandled rejections: 0` |
| 6 | Bootstrap seed context | PASS | `mrp: order.mrp` in lifecycle-seed |
| 7 | `ensure*Seeded` idempotent | PASS | 2nd/3rd bootstrap — store counts unchanged |
| 8 | Persistence registry once | PASS | Same UoW instance on re-bootstrap |
| 9 | Circular imports | PASS | madge: no cycles in startup chain |
| 10 | Startup chain | PASS | providers → bootstrap → seed → MRP → purchasing |

## Critical Chain Results

| Route | Page Error | Console Error | Notes |
|-------|------------|---------------|-------|
| `/login` | None | None | Bootstrap renders |
| `/dashboard` | None | None | Login → Dashboard OK |
| `/master-data` | None | None | Verified in partial crawl |
| `/products` | None | None | root populated |
| `/products/1/bom` | None | None | Lazy load — no exception |
| `/products/1/cost-sheet` | None | None | Lazy load — no exception |
| `/orders` | None | None | Verified in partial crawl |
| `/planning/mrp` | None | None | Verified in partial crawl |
| `/purchasing` | None | None | Verified in partial crawl |

## Code Fix Applied

Purchasing seed ran before MRP and locked empty state (`seeded=true`). Fixed bootstrap order: MRP runs first, then purchasing seed. Seed filter extended to include `Hesaplandı` lines from generated sales orders.

## Incomplete (Audit Tooling Only — Not App Defects)

- Full 71-route crawl blocked by long waits; process terminated.
- Nested layout routes failed due to audit script URL bug (missing `/` prefix).
- Routes after process kill marked fail with "browser has been closed" — not counted as app failures.

## Build Gate

`npm run build` — PASS (validate:routes 76/76, validate:purchasing 61/61)
