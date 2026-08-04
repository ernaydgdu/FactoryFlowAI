# Enterprise Architecture Review

**Date:** 2026-08-04  
**Updated:** 2026-08-04 — P0 Remediation Sprint 2  
**Scope:** Completed ERP modules (Platform → Enterprise Hardening)  
**Method:** Evidence-only (code + existing architecture reports). No new features. No speculative refactors.  
**Runtime truth:** Frontend in-memory `IUnitOfWork` is the system of record. NestJS backend is auth/platform stub only.

---

## Executive Verdict

| Dimension | Score | Summary |
|-----------|-------|---------|
| Architecture | **PARTIAL** | UoW/port model coherent; **domain→infra break closed (P0-06)**; Freeze ADR-expanded beyond 18-AR constitution; legacy UI bypasses application |
| Reliability | **PARTIAL** | Bootstrap resilient; TX/outbox solid; **PO + stock-ledger expectedVersion (P0-01/02)**; idempotency still uneven elsewhere |
| Security | **PARTIAL** | **Command-path write guards on all TD-P0-03 modules (Sprint 2)** + prior logistics/finance/execution hardening; multi-tenant still single-tenant (P0-05) |
| Performance | **PARTIAL** | Bounded monitors/queues; many `queryAll*` silent 100-cap; broad RQ `.all` invalidations remain |
| PostgreSQL readiness | **NO** | `readyCount: 0`; factory throws; cutover blocked (P0-07 open) |
| AI readiness | **PARTIAL** | Deterministic foundation; **event catalog ⊆ DomainEventType (P0-08)**; LLM disabled; RM coverage still partial |
| Enterprise maturity (overall) | **PARTIAL** | 6/8 P0s closed; remaining = multi-tenant + Postgres programs |

### P0 Remediation Sprint 2 — changes

| ID | What changed |
|----|----------------|
| TD-P0-03 | Added `quality.write`, `inventory.write`, `purchasing.write`; guards + mapper wraps for Inventory, Sales, Purchasing, Shop Floor, Quality, Barcode workflows, IAM admin, PO board |

### P0 Remediation Sprint 1 — changes

| ID | What changed |
|----|----------------|
| TD-P0-01 | `stock-ledger-crud.service.ts` — `saveLedgerMovement` uses `{ expectedVersion: existing.version }` |
| TD-P0-02 | `lifecycle-persistence.ts` — update save uses `{ expectedVersion: existing.version }` |
| TD-P0-04 | `execution-permission.guard.ts` + `kepler-execution-role.ts` — session-mapped role + `execution.write`; client role ignored for authz |
| TD-P0-06 | Observability composed in `enterprise-hardening-observability.query.ts`; domain query has zero infra imports |
| TD-P0-08 | `enterprise-ai-foundation.ts` catalog rebuilt from `DomainEventType` |

---

## 1. Architecture

### 1.1 Intended dependency graph

```
UI (modules/pages)
  → Application (hooks / application-services / mappers)
    → Domain services
      → Ports (IUnitOfWork)
        ← Infrastructure adapters (in-memory / postgres skeleton)
```

### 1.2 Aggregate ownership

- **IUnitOfWork** exposes ~58 ports (aggregates + streams + collections + read models). See `frontend/src/domain/ports/persistence/unit-of-work.port.ts`.
- **Constitution §2.5** locked **18 ARs**; codebase + Phase 5–8 ADRs expanded to **32 aggregate port files** (purchasing chain, packing/shipment/export, accounting, cost/style closing, mrpRuns, userAccounts, etc.).
- **Child entities (correct):** BOM / Cost Sheet write through `IProductCardRepository` — no separate AR ports.

### 1.3 Architecture Freeze compliance

| Claim | Evidence | Status |
|-------|----------|--------|
| No new ports in Phase 8 | ENTERPRISE-HARDENING-REPORT + no new aggregate interface | OK |
| Freeze = no new ARs ever | Contradicted by Phase 6–7 ADR ports on UoW | Docs drift |
| Inventory single write path | Shipment/Export reuse inventory persistence | OK |
| Constitution 18 AR current | Stale vs `unit-of-work.port.ts` | **P1 drift** |

### 1.4 Layer violations (evidence)

| Sev | Finding | Evidence |
|-----|---------|----------|
| ~~P0~~ **Closed** | Domain → Infrastructure | Moved to application observability query (TD-P0-06) |
| **P1** | UI → Domain repos/services | `pages/inventory/InventoryPages.tsx` (`warehouseRepository`, `queryAllStockCards`); `pages/purchasing/PurchasingPages.tsx`; `pages/DashboardPage.tsx`; `modules/orders/hooks/use-order-create.ts` |
| **P2** | Application → Infrastructure hard-wire | `command-transaction.ts`, IAM/API factories |
| **P2** | UI → Infrastructure | `PlatformApiStatusCard.tsx` → api-runtime.config |

**Clean:** No UI → `IUnitOfWork` direct; no domain → application/UI.

### 1.5 Circular dependencies

| Cycle | Evidence | Sev |
|-------|----------|-----|
| `production-order` ↔ `execution-platform` | `lifecycle-service.ts` ↔ `execution-provisioning.ts` | **P1** |
| `master-data` ↔ `platform` | Mutual service imports | P2 |
| High fan-in | `style-closing` (15 domains); `enterprise-ai-foundation` | P2 |

### 1.6 Backend

`backend/src/app.module.ts` — Auth / Users / Platform / Prisma only. No ERP domain modules. Aligns with “domain lives in frontend” Freeze posture; fails API-first enterprise target.

---

## 2. Reliability

| Concern | Finding | Sev |
|---------|---------|-----|
| Bootstrap white-screen | `BootstrapStatusScreen` + isolated seeds; critical phases fail-closed | Positive |
| Soft recovery clears fatal | `ensurePersistenceBootstrappedSafe` can set `ready: true` and null fatalError | P2 |
| Transactions | `runCommandInTransaction` → snapshot rollback + outbox flush | Positive |
| Idempotency | Strong on packaging/shipment/export/finance/cost/style/barcode; weak on sales/PO/stock/MD/MRP | **P1** |
| Optimistic locking | **PO + stock-ledger command paths pass expectedVersion (Sprint 1)**; remaining gaps on execution/GR (P1) | Mitigated |
| Error handling | Outbox/offline mark Failed; few empty catches (bootstrap recovery) | Mostly OK |
| Audit “all” | `getAllAuditLogs` capped at first page (100) | **P1** |

---

## 3. Security

### 3.1 Command-path write guards

| Guarded | Still unguarded (out of TD-P0-03 scope) |
|---------|----------------------------------|
| Product Card, Production Order lifecycle **+ board**, Inventory, Sales, Purchasing, Shop Floor, Quality, Barcode workflows, IAM admin, Packaging, Shipment, Commercial Docs, Export Logistics, Finance, Cost Closing, Style Closing, Execution Platform (`execution.write`) | Platform BOM, Master Data, BOM designer, Cost Sheet, MRP, Warehouse FG mapper, Production Planning |

### 3.2 Critical findings

| Sev | Finding | Evidence |
|-----|---------|----------|
| ~~P0~~ **Closed** | Client-selectable ExecutionRole trusted on commands | Authz uses `resolveTrustedExecutionRole()` (TD-P0-04); UI picker no longer authoritative |
| ~~P0~~ **Closed** | Shop Floor / Quality / Inventory / Sales / Purchasing / Barcode / IAM / PO board writes without Kepler write assert | TD-P0-03 — command-path guards + new write permissions |
| **P0** | Multi-tenant not real — `DEFAULT_TENANT_ID = 'kepler-default'` hardwired | TD-P0-05 open |
| **P1** | Route vs write permission asymmetry on some prefixes | e.g. purchasing route still `orders.read` |
| **P1** | Dual IAM residual (matrix still separate; now session-bridged for execution writes) | TD-P1-06 partially mitigated |
| **P1** | Audit tenant always DEFAULT; ID generation from capped cursor | `audit-service.ts` |

---

## 4. Performance

| Area | Finding | Sev |
|------|---------|-----|
| Bootstrap | Serial 8 seed phases + diagnostics; seed volume includes 45 orders + GR loops | P2 |
| `queryAll*` | Often `{ limit: PERSISTENCE_CURSOR_MAX_LIMIT }` (100) without cursor walk — silent truncation | **P1** |
| N+1 | Quality gate evaluations; factory-graph per-order full queries | **P1** |
| RQ invalidation | Many modules still `invalidateQueries(.all)`; finance/cost/style/export/packaging/shipment narrowed | **P1** |
| Rendering | DataTable auto-virtualizes at ≥50 rows | Positive |
| Memory | `MAX_METRICS=500`; offline queue `MAX_QUEUE=200` | Positive |

---

## 5. PostgreSQL Readiness

| Metric | Value |
|--------|-------|
| Default backend | `memory` |
| `readyCount` | **0** |
| Catalogued ports | 18 (incomplete vs ~58 UoW ports) |
| Skeleton (throw-on-use) | packingLists, outbox |
| Stub | masterDataLookups, auditLog, collections |
| Factory | `PostgresUnitOfWorkFactory.create()` → `PostgresAdapterNotReadyError` |
| Cutover | **Blocked** |

See `POSTGRES-CUTOVER-PLAN.md`.

---

## 6. AI Readiness

| Surface | Status |
|---------|--------|
| `queryEnterpriseAiFoundation` | Present; `llmEnabled: false` |
| Brain RMs wired | Finance, Cost Closing, Style Closing, Export only |
| Brain RMs unwired | Packaging, Commercial Docs, lifecycle, execution, planning adapters |
| Twin | `buildFactoryGraph` + health; empty knowledge snapshot; order cap 10 |
| Event catalog | **Aligned to `DomainEventType` (TD-P0-08)**; scheduler topic strings remain a separate P1 vocabulary |
| Recommendations / predictions | Deterministic, `sideEffects: 'NONE'` |

See `AI-ROADMAP.md`.

---

## 7. Module Scorecard

| Module | Arch | Rel | Sec | Perf | Notes |
|--------|------|-----|-----|------|-------|
| Platform | P | P | N | P | API scaffold; BOM cmds unguarded |
| IAM | P | P | Y | P | **Admin writes command-guarded** (`platform.users.manage`) |
| Master Data | Y | P | N | P | TX/audit OK; writes unguarded; RQ `.all` |
| Product Card | Y | Y | Y | P | Command guard + OL; RQ `.all` |
| BOM | Y | Y | N | P | Child of Product Card; writes unguarded |
| Cost Sheet | Y | Y | N | P | Child of Product Card; writes unguarded |
| Sales | Y | P | Y | P | OL + **orders.write guard**; idempotency still weak |
| MRP | Y | P | N | P | TX OK; writes unguarded |
| Purchasing | Y | P | Y | P | **purchasing.write guard**; route still `orders.read` |
| Inventory | P | P | Y | P | UI→domain; OL + **inventory.write guard** |
| Warehouse | P | P | N | P | FG path; writes unguarded |
| Production Planning | Y | P | N | P | Reschedule unguarded |
| Production Order | P | P | Y | P | Lifecycle + **board** guarded + OL; cycle w/ execution |
| Shop Floor | P | P | Y | P | **execution.write** on commands; N+1 residual elsewhere |
| Quality | P | P | Y | P | **quality.write** on commands; N+1 queries remain |
| Barcode & Mobile | Y | Y | Y | P | Offline queue bounded; **workflow writes guarded** |
| Packaging | Y | Y | Y | Y | Guard + idempotency + OL; narrowed RQ |
| Shipment | Y | Y | Y | Y | Same pattern |
| Commercial Documents | Y | Y | Y | Y | Guard + idempotency |
| Export Logistics | Y | Y | Y | Y | Guard + Brain RM |
| Finance Integration | Y | Y | Y | Y | Guard + OL + narrowed RQ |
| Cost Closing | Y | Y | Y | Y | Guard + gates + OL |
| Style Closing | Y | Y | Y | P | Guard OK; high fan-in |
| Enterprise Hardening | Y | P | Y | P | Obs in application layer (**P0-06 closed**); reliability notes corrected |

Y = acceptable · P = partial · N = not enterprise-ready

---

## 8. Cross-References

| Deliverable | Path |
|-------------|------|
| Technical debt backlog | `TECHNICAL-DEBT-BACKLOG.md` |
| Postgres cutover plan | `POSTGRES-CUTOVER-PLAN.md` |
| AI roadmap | `AI-ROADMAP.md` |
| Tier-1 gap analysis | `TIER1-GAP-ANALYSIS.md` |
| Prior Phase 8 report | `ENTERPRISE-HARDENING-REPORT.md` |

---

## 9. Review Constraints Honored

- No new features implemented.
- No refactor without evidence.
- No code changes (P0 items documented; systemic — not single-line production crash fixes).
