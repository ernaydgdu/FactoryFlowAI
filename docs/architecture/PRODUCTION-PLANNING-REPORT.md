# Phase 4 Module 2 — Production Planning Report

**Date:** 2026-08-04
**Verdict:** YES — all mandatory gates PASS.

## Scope Delivered

Existing production-planning UI was entirely demo-backed (`SALES_ORDERS` mocks + in-process engines); the persisted production order aggregate was never read by planning pages. This module adds a **real, lifecycle-backed scheduling layer** alongside the existing pages, layer by layer.

### 1. Domain — `src/domain/production-planning/`

| File | Responsibility |
|------|----------------|
| `planning.types.ts` | SchedulingMode (FINITE/INFINITE), CalendarDay, WorkCenterLoadBucket, ScheduledOrder, ConstraintViolation, ScheduleResult, ReschedulePlanInput |
| `production-calendar.service.ts` | Production Calendar — working-day model (Sundays off, ISO week labels), `buildProductionCalendar`, `workingDaysBetween`, `nextWorkingDate` |
| `scheduling-engine.service.ts` | Finite / Infinite Scheduling — reads **persisted production orders** (`IProductionOrderRepository`) + master-data `ProductionLine.capacityPerDay`; INFINITE spreads demand over requested window (overloads flagged), FINITE clamps line-day buckets to capacity and spills to next working day (priority + termin order) |
| `work-center-load.service.ts` | Work Center Load / Line Calendar — aggregates schedule buckets per line and workshop over the planning horizon |
| `constraint-engine.service.ts` | Constraint Engine (advisory) — CAPACITY_OVERLOAD, TERMIN_RISK, PRECEDENCE, MATERIAL_SHORTAGE (BR-03 reservation) |
| `planning-crud.service.ts` | Planning ↔ UE write path — `persistReschedulePlan` updates plannedStart/plannedFinish/line on the **existing** production order aggregate with audit + timeline + outbox |

The schedule is a deterministic read-model derived from persisted production orders + master data + calendar. **No new persistence port or seed step was introduced** (Architecture Freeze respected); a persisted Schedule aggregate is deliberately deferred until real optimization is in scope.

### 2. Repository

- Reads: `IProductionOrderRepository` (via `production-order-query.service`), master-data `productionLineRepository` / `workshopRepository` (P17).
- Writes: existing production order port via `saveLifecycleRecord` — no new repository.
- Bootstrap chain untouched; no new seed, no seed exceptions.

### 3. Application — `src/application/production-planning/`

- `production-planning-scheduling.dto.ts` — board/capacity/line-load DTOs.
- `production-planning-scheduling.mapper.ts` — `mapScheduleBoard`, `mapCapacityView`, `mapLineLoadList` (query).
- `production-planning-scheduling-command.mapper.ts` — `executeReschedulePlan` in `runCommandInTransaction` (command).
- `production-planning-scheduling.application-service.ts` — facade.
- `use-production-planning-scheduling.ts` — React Query hooks (`useScheduleBoard`, `useCapacityView`, `useLineLoad`, `useReschedulePlanMutation`) with invalidation of planning + production-order(-lifecycle) namespaces.
- `applicationQueryKeys.productionPlanning` namespace added.

### 4. UI — `src/modules/production-planning/pages/PlanningSchedulingPages.tsx`

| Route | Page | Content |
|-------|------|---------|
| `/production-planning/board` | PlanningBoardPage | Production Planning Dashboard KPIs + weekly/daily line×day load grid + **drag & drop skeleton** (UE chip → line-day cell drops call the reschedule command; no optimization) + constraint violations panel |
| `/production-planning/capacity-view` | CapacityViewPage | Workshop/line time-phased capacity vs load, finite/infinite toggle |
| `/production-planning/line-load` | LineLoadPage | Work-center load per line over the horizon |

Sub-nav (layout) and sidebar navigation entries added. Existing demo-backed pages left untouched (migration is a known follow-up).

### 5. Validation

- `scripts/production-planning-validation.mjs` — **55 checks**, wired into `npm run build` as `validate:production-planning`.

## Gate Results

| Gate | Result |
|------|--------|
| `npm run build` (all validate:* + tsc + vite) | PASS |
| `validate:production-planning` | PASS (55/55) |
| Bootstrap Integrity Audit | PASS (9/9) |
| Startup Regression Audit | PASS (90/90 routes) |
| Page errors / Console errors | 0 / 0 |
| Unhandled rejections | 0 |
| Error boundary triggers | 0 |
| Critical Chain | PASS |

## Known Follow-ups (deferred by design)

- Migrate legacy demo-backed planning pages (Dashboard, Takvim, Program, Kapasite, Hat) to the lifecycle-backed scheduling layer.
- Persisted schedule/plan aggregate + capacity reservations once real optimization (drag & drop beyond skeleton) is in scope.
- Factory holiday calendar in master data (calendar model already supports per-day working flags).
