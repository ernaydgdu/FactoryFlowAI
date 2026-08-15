# Technical Debt Backlog

**Source:** Enterprise Architecture Review Sprint (2026-08-04)  
**Last updated:** 2026-08-04 — P0 Remediation Program Closed  
**Classification:** P0 (must before production claim) · P1 (high) · P2 (material) · P3 (hygiene)  
**Effort:** S ≤1d · M 2–5d · L 1–2w · XL >2w (one senior engineer, frontend-centric)

---

## P0 program status — CLOSED

Sprint-sized P0 remediations are complete (6/8). Remaining items are **enterprise transformation programs**, not backlog sprints. **Do not attempt partial implementations.**

### P0 Remaining (deferred)

| ID | Item | Status | Program |
|----|------|--------|---------|
| TD-P0-05 | Multi-tenant hardwired to `kepler-default` | **Deferred to Program — Multi-Tenant Transformation** | Phase 9 — see `ENTERPRISE-NEXT-PHASE-ROADMAP.md` |
| TD-P0-07 | Postgres cutover blocked (`readyCount: 0`, factory throws) | **Deferred to Program — PostgreSQL Cutover** | Phase 10 — see `POSTGRES-CUTOVER-PLAN.md` + roadmap |

**Reason:** These are enterprise transformation programs, not sprint-sized remediations.

### Closed in P0 Remediation Sprint 2

| ID | Resolution |
|----|------------|
| TD-P0-03 | Command-path guards via `runPermittedWriteCommand`: inventory (`inventory.write`), sales (`orders.write`), purchasing (`purchasing.write`), shop-floor (`execution.write`), quality (`quality.write`), barcode workflows (`execution.write`), IAM admin (`platform.users.manage`), PO board (`production.write`). New Permission union members + role grants. |

### Closed in P0 Remediation Sprint 1

| ID | Resolution |
|----|------------|
| TD-P0-01 | `stock-ledger-crud.service.ts` `saveLedgerMovement` passes `{ expectedVersion: existing.version }` |
| TD-P0-02 | `lifecycle-persistence.ts` passes `{ expectedVersion: existing.version }` on update |
| TD-P0-04 | `runWithExecutionPermission` uses `resolveTrustedExecutionRole()` + `execution.write`; client `role` ignored for authz |
| TD-P0-06 | Infra/performance imports moved to `application/.../enterprise-hardening-observability.query.ts`; domain query infra-free |
| TD-P0-08 | `enterprise-ai-foundation` EVENT_CATALOG = full `DomainEventType` set (no invented names) |

---

## P1 — High production / correctness risk

| ID | Item | Evidence | Effort | Module(s) |
|----|------|----------|--------|-----------|
| TD-P1-01 | UI bypasses Application (repos/domain queries) | InventoryPages, PurchasingPages, DashboardPage, use-order-create | M | Legacy UI |
| TD-P1-02 | Circular dependency production-order ↔ execution-platform | Mutual imports lifecycle ↔ provisioning | M | PO / Execution |
| TD-P1-03 | Constitution 18 AR vs 32 aggregate ports — Freeze contract stale | PERSISTENCE-CONSTITUTION vs UoW | S (docs) / M (reconcile) | Architecture |
| TD-P1-04 | Idempotency absent on sales/PO/stock/MD/MRP core commands | No idempotencyKey in those DTOs/paths | L | Core domains |
| TD-P1-05 | Route/write asymmetry residual | Write permissions exist (Sprint 2); some routes still read-only prefixes (e.g. purchasing→`orders.read`) | S | IAM |
| TD-P1-06 | Dual permission systems unbridged (Kepler vs Execution) | Two policy files — **partially mitigated** by Kepler→Execution map in Sprint 1; full SoD still open | M | IAM / Execution |
| TD-P1-07 | `getAllAuditLogs` / audit ID gen capped at 100 | `audit-service.ts` | M | Platform |
| TD-P1-08 | `queryAll*` silent truncation (cursor not walked) | `PERSISTENCE_CURSOR_MAX_LIMIT=100` | L | Cross-cutting |
| TD-P1-09 | React Query `.all` invalidation blast radius | master-data, product-card, sales, purchasing, inventory, shop-floor, quality, barcode, … | M | Application hooks |
| TD-P1-10 | Quality + factory-graph N+1 full-store scans | `quality-query.service.ts`, `factory-graph-engine.ts` | M | Quality / Brain |
| TD-P1-11 | OL omitted on execution bundle/context / GR | Bundle/execution/goods-receipt save paths | M | Execution / Purchasing |
| TD-P1-12 | Postgres readiness catalog covers 18/~58 UoW ports | Incomplete inventory understates cutover | M | Persistence |
| TD-P1-13 | ~~Enterprise hardening reliability copy overstates OL/permission coverage~~ | **Closed with P0-06** — reliability notes corrected in domain query | — | Enterprise Hardening |

---

## P2 — Material gaps

| ID | Item | Evidence | Effort | Module(s) |
|----|------|----------|--------|-----------|
| TD-P2-01 | Soft bootstrap may clear fatalError on recovery | `ensurePersistenceBootstrappedSafe` | S | Bootstrap |
| TD-P2-02 | Application hard-depends on infrastructure adapters | command-transaction, IAM/API factories | M | Application |
| TD-P2-03 | UI imports infrastructure runtime config | PlatformApiStatusCard | S | Platform UI |
| TD-P2-04 | Style-closing / Brain high fan-in orchestration | 15 domain imports; AI foundation fan-in | L | Style Closing / AI |
| TD-P2-05 | Architecture docs stale (Freeze Audit MISSING matrix) | ARCHITECTURE-FREEZE-AUDIT vs Phase 6–8 | M | Docs |
| TD-P2-06 | Master data approval lacks versioning | approval repo overwrite by id | M | Master Data |
| TD-P2-07 | IAM API getCurrentUser masks errors as null | iam-api.repository catch → null | S | IAM |
| TD-P2-08 | Bootstrap serial seed cost grows with catalogs | 8 seed phases + inventory GR loops | M | Bootstrap |
| TD-P2-09 | KPI services re-filter full lists repeatedly | finance/cost/style query services | M | Closing modules |
| TD-P2-10 | AI foundation omits packaging/commercial/lifecycle/execution RMs | enterprise-ai-foundation wired 4 only | M | AI |
| TD-P2-11 | Twin empty knowledge snapshot; CONTAINER node unused; order cap 10 | factory-graph-engine / twin types | M | Twin |
| TD-P2-12 | Twin prediction engine still uses legacy data arrays | prediction-engine + STOCK_CARDS/SALES_ORDERS | M | Twin |
| TD-P2-13 | Sync IUnitOfWork vs async PG only sketched | async-unit-of-work-wrapper | L | Persistence |
| TD-P2-14 | PG packing-list/outbox skeleton throw-on-use (not ready) | postgres repos | XL (impl) | Persistence |
| TD-P2-15 | Memory empty adapters for fabric/accessory/brainConfig | catalog-empty-adapters | M | Catalog |

---

## P3 — Hygiene / consistency

| ID | Item | Evidence | Effort | Module(s) |
|----|------|----------|--------|-----------|
| TD-P3-01 | Consolidate permission guards onto `runPermittedWriteCommand` | Mixed guard styles | M | Application |
| TD-P3-02 | Document style-closing route (`products.read`) vs write (`style.close`) | permission-policy | S | IAM docs |
| TD-P3-03 | Type-only cycles ports ↔ brain/platform/MD | Import graph | S | Ports |
| TD-P3-04 | Explicit `virtualScroll` unused (auto@50 OK) | data-table.tsx | S | UI |
| TD-P3-05 | Repo `listAll` unused by domain (latent unbounded API) | in-memory repos | S | Persistence |
| TD-P3-06 | Backend not hosting domain (acceptable stub; API-first unmet) | Nest AppModule | XL (program) | Backend |
| TD-P3-07 | FOUNDATION.md Application path outdated (`modules/*/hooks`) | FOUNDATION.md | S | Docs |
| TD-P3-08 | Bootstrap recovery empty catch | bootstrap.ts | S | Bootstrap |

---

## Next execution

Active work shifts to **P1 backlog** and program phases in `ENTERPRISE-NEXT-PHASE-ROADMAP.md`.

| Order | Track |
|-------|--------|
| 1 | Phase 9 — Multi-Tenant Transformation (absorbs TD-P0-05) |
| 2 | Phase 10 — PostgreSQL Cutover (absorbs TD-P0-07) |
| 3 | Phase 11 — Brain AI Enterprise |
| 4 | Phase 12 — Reporting & Analytics |
| 5 | Phase 13 — External Integrations |
