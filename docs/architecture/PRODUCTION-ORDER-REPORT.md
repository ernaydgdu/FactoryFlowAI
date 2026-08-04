# Phase 4 Module 3 — Production Order Report

**Date:** 2026-08-04
**Verdict:** YES — all mandatory gates PASS.

## Scope Delivered

The Production Order aggregate and lifecycle (Draft → Planned → Approved → Released → In Production ⇄ Paused → Completed → Closed, + Cancelled) already existed on the persisted `IProductionOrderRepository`. This module closed the biggest integrity gap and added the missing surfaces.

### Key finding (investigation)

The `Released` transition's BR-03 BOM reservation validated against a **throwaway in-memory ledger** (`createEmptyLedger()`) and was **never written to the persisted Stock Ledger**. `persistReservation` from the inventory domain was unused by the production order lifecycle.

### 1. Domain — `src/domain/production-order/`

| File | Responsibility |
|------|----------------|
| `material-reservation.service.ts` | **Material reservation bağlantısı** — posts UE BOM reservations as real `RESERVATION` movements to the persisted Stock Ledger (`persistReservation`, P14/P15; audit + timeline + outbox inside). Per-line results: `RESERVED` / `ALREADY_RESERVED` (idempotent) / `SKIPPED_NO_STOCK_CARD` / `SKIPPED_INSUFFICIENT_STOCK`. Also `releaseMaterialReservationForOrder` (RESERVATION_RELEASE) and `getMaterialReservationState` read model |
| `split-merge.service.ts` | **Split / Merge skeleton** — `planSplitProductionOrder` / `planMergeProductionOrders`: plan proposals + validation only (status, quantity sum, same product/line); deliberately **no persistence mutation** |
| `operation-sequence.service.ts` | **Operation sequence** — `deriveOperationSequence` (step status from production progress), `validateOperationSequence` (contiguity) |

Existing lifecycle service (Release/Start/Pause/Resume/Complete/Cancel transitions, BR rules) untouched.

### 2. Repository

- Reuses `IProductionOrderRepository` reads, Stock Ledger query/crud services, stock card query service.
- **No new persistence port**; bootstrap chain and seeds untouched.

### 3. Application — `src/application/production-order-lifecycle/`

- `production-order-board.dto.ts` / `production-order-board.mapper.ts` — Status Board (9-column kanban read model), Operation List, Material Reservation view, Split/Merge plan DTOs.
- `production-order-board-command.mapper.ts` — `executeReserveMaterials`, `executeReleaseMaterialReservation` (transactional).
- `use-production-order-board.ts` — React Query hooks + invalidation (board, lifecycle, inventory, warehouse-management namespaces).
- **Integration:** `executeTransitionProductionOrder` now persists the BOM reservation to the Stock Ledger after a successful `Released` transition (best-effort per line; BR-03 gate behavior unchanged).

### 4. UI — `src/modules/production-order-lifecycle/pages/ProductionOrderBoardPages.tsx`

| Route | Page | Content |
|-------|------|---------|
| `/production-order-lifecycle/board` | Status Board | Kanban columns per lifecycle status, order cards (progress, line, termin risk) linking to detail + **split preview skeleton** |
| `/production-order-lifecycle/operations` | Operation List | All UE operation route steps with derived status, UE filter |
| `/production-order-lifecycle/reservations` | Material Reservation | Per-order BOM lines: required / reserved / available with per-line status; "Rezervasyonu Deftere İşle" action |

Production Order Dashboard, Detail and Lifecycle Timeline already existed (list KPIs, detail tabs `timeline`/`operations`); sub-nav and sidebar entries added for the three new surfaces.

### 5. Validation

- `scripts/production-order-validation.mjs` — **49 checks**, wired into `npm run build` as `validate:production-order`.

## Gate Results

| Gate | Result |
|------|--------|
| `npm run build` (all validate:* + tsc + vite) | PASS |
| `validate:production-order` | PASS (49/49) |
| Bootstrap Integrity Audit | PASS (9/9) |
| Startup Regression Audit | PASS (93/93 routes) |
| Page errors / Console errors | 0 / 0 |
| Unhandled rejections | 0 |
| Error boundary triggers | 0 |
| Critical Chain | PASS |

## Known Follow-ups (deferred by design)

- Execute real split/merge (child UE creation, quantity/reservation transfer) — current module is plan-only skeleton per scope.
- Auto reservation release on Cancel/Close transitions (release command exists; wiring into transitions is a follow-up).
- Consumption (GI) posting from daily production entries to the persisted ledger — Execution ↔ Inventory integration module.
