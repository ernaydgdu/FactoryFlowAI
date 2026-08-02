# Kepler ERP — Persistence Readiness Report

**Sprint:** 4 — Persistence Foundation  
**Generated:** 2026-08-02  
**Companion:** [PERSISTENCE-ARCHITECTURE-REPORT.md](./PERSISTENCE-ARCHITECTURE-REPORT.md)

Her domain için: mevcut store durumu, aggregate tanımı, repository ihtiyacı, transaction sınırı, event store gereksinimi, snapshot/lock/soft-delete değerlendirmesi ve **Readiness Score**.

**Skor legendi:** 🟢 Ready to implement | 🟡 Needs design work | 🔴 Blocker

---

## Özet Matris

| Domain | Store sayısı | AR sayısı | Readiness | 10M risk | Öncelik |
|--------|-------------|-----------|-----------|----------|---------|
| Sales | 1 static | 1 | 🟢 92% | Düşük | P1 |
| Planning | 0 mutable | 0 | 🟢 88% | Düşük | P2 |
| Production | 2 mutable | 1 | 🟢 90% | Orta | P1 |
| Execution Platform | 11 mutable | 3 | 🟡 75% | **Kritik** | **P0** |
| Stock Ledger | 0 global | 1 | 🟡 80% | Yüksek | P1 |
| Master Data | 30+ static + 3 | 12+ | 🟢 85% | Düşük | P1 |
| Brain | 4 mutable | 0 | 🟡 70% | Orta | P3 |
| Digital Twin | 0 persistent | 0 | 🟢 82% | Düşük | P3 |
| Audit | 2 mutable | 0 | 🟢 95% | Yüksek | P1 |
| Timeline | 3 mutable | 0 | 🟢 90% | Yüksek | P1 |
| Approval | 2 mutable | 1 | 🟢 88% | Düşük | P2 |
| Versioning | 1 mutable | 1 | 🟢 90% | Düşük | P2 |

---

## 1. Sales

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `SALES_ORDERS` | Static array (45 demo) | `domain/data/orders.ts` |
| Derived workflows | Computed at load | `domain/data/workflows.ts` |

**Runtime mutation:** Minimal — bootstrap'ta tek order split uygulanır.

### Aggregate Root

**SalesOrder** — root entity; matrix lines, production link, shipment ref child.

### Repository Sözleşmesi

```typescript
interface ISalesOrderRepository extends IRepository<SalesOrder> {
  findByOrderNo(tenantId: string, orderNo: string): Promise<SalesOrder | null>
  findByCustomer(tenantId: string, customerId: string, page: PageRequest): Promise<PageResult<SalesOrder>>
  findByStatus(tenantId: string, status: SalesOrderStatus, page: PageRequest): Promise<PageResult<SalesOrder>>
}
```

### Transaction Sınırları

| Command | TX scope |
|---------|----------|
| Create order | SalesOrder + initial timeline event |
| Update matrix | SalesOrder (version lock) |
| Link to production | SalesOrder (read) + ProductionOrder (write) — cross-aggregate |

### Event Store

| Gerekli? | Stream |
|----------|--------|
| Kısmi | Order status changes → `order_timeline` |
| Hayır | Full event sourcing |

### Snapshot

- Order snapshot at approval gate (BOM + matrix freeze)
- `sales_order_snapshot` JSONB table

### Optimistic Locking

**EVET** — `sales_order.version`; matrix edit conflicts common.

### Soft Delete

**Status = Cancelled** — no physical delete. `cancelled_at`, `cancelled_by`.

### Readiness Score: **92% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Entity model mature | Repository interface not yet coded |
| Clear AR boundary | Matrix line normalization (child table design) |
| Status lifecycle defined | Multi-currency snapshot schema |

**Blocker:** Yok.

---

## 2. Planning

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `PLANNING_ENGINE_OUTPUT` | Static computed | `domain/data/planning-demo.ts` |
| Engine functions | Pure (no store) | `domain/services/planning-engine.ts` |
| MRP/Capacity/Termin | Pure functions | `domain/services/planning/*` |

**Planning state persist edilmez** — her çağrıda Sales + Master Data + Production'dan hesaplanır.

### Aggregate Root

**Yok** — Planning bir **domain service** (compute-on-read).

Persist edilecek opsiyonel cache:

| Entity | Tip | Amaç |
|--------|-----|------|
| `PlanningRunResult` | Cache row | Expensive MRP snapshot |
| `CapacityPlanSnapshot` | Cache row | Workshop load history |

### Repository Sözleşmesi

```typescript
interface IPlanningResultCacheRepository {
  get(tenantId: string, cacheKey: string): Promise<PlanningRunResult | null>
  put(tenantId: string, cacheKey: string, result: PlanningRunResult, ttlSec: number): Promise<void>
  invalidate(tenantId: string, pattern: string): Promise<void>
}
```

### Transaction Sınırları

Planning **read-only** — TX yok. Cache write ayrı lightweight TX.

### Event Store

**HAYIR** — planning sonuçları deterministic; input değişince yeniden hesaplanır.

### Snapshot

- Optional: `planning_snapshot` for "planning as-of date" audit
- Termin milestones → Production Order snapshot'a taşınır

### Optimistic Locking

**HAYIR** — cache overwrite idempotent.

### Soft Delete

Cache TTL expiry — no delete semantics.

### Readiness Score: **88% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Pure function engines | Cache repository not defined |
| Clear read-only nature | Planning-as-of snapshot policy |
| Depends on Sales/MD/Production repos | Invalidation rules on PO change |

**Blocker:** Yok — Planning persistence optional (cache-only).

---

## 3. Production (Production Order Lifecycle)

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `lifecycleStore` | `Map<string, ProductionOrderLifecycleRecord>` | `production-order/lifecycle-service.ts` |
| `dailyEntryStore` | `DailyProductionEntryRecord[]` | same |
| `poCounter`, `entryCounter` | ID generators | same |

### Aggregate Root

**ProductionOrder** — daily entries child; snapshots embedded array (→ normalize to child table).

### Repository Sözleşmesi

```typescript
interface IProductionOrderRepository extends IRepository<ProductionOrder> {
  findByProductionOrderNo(tenantId: string, no: string): Promise<ProductionOrder | null>
  findBySalesOrderId(tenantId: string, salesOrderId: string): Promise<ProductionOrder[]>
  findByStatus(tenantId: string, status: ProductionOrderLifecycleStatus, page: PageRequest): Promise<PageResult<ProductionOrder>>
}

interface IProductionDailyEntryRepository {
  append(tenantId: string, entry: ProductionDailyEntry): Promise<void>
  findByProductionOrderNo(tenantId: string, no: string, page: PageRequest): Promise<PageResult<ProductionDailyEntry>>
}
```

### Transaction Sınırları

| Command | TX scope |
|---------|----------|
| `createProductionOrderFromSalesOrder` | ProductionOrder + ExecutionContext provision + Audit |
| `transitionProductionOrderStatus` | ProductionOrder + StockLedger reserve/complete + Execution provision |
| `addDailyProductionEntry` | ProductionOrder (qty rollup) + DailyEntry append |

### Event Store

| Stream | Gerekli |
|--------|---------|
| `order_timeline` | EVET — status transitions |
| Status history | EVET — append |

### Snapshot

**KRİTİK** — `snapshots[]` array → `production_order_snapshot` table:

```
revision, captured_at, bom JSONB, operation_route JSONB, cost JSONB, planning JSONB
```

Her transition'da yeni snapshot row.

### Optimistic Locking

**EVET** — `production_order.version`; concurrent daily entry + status change.

### Soft Delete

**Status = Cancelled** — reservation reversal via stock movement.

### Readiness Score: **90% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Clear lifecycle FSM | Snapshot table normalization |
| Execution provisioning hook | Counter → UUID migration |
| BR-integrated transitions | Daily entry partition strategy |

**Blocker:** Yok.

---

## 4. Execution Platform

### Mevcut Durum

| Store | Tip | Büyüme |
|-------|-----|--------|
| `contextStore` | Map | Per PO |
| `bundleStore` | Map | **Per PO × bundles (10⁶+)** |
| `operationStore` | Map | Per PO × route |
| `sessionStore` | Map | **Per event (10⁷+)** |
| `gateStore` | Array | Per event |
| `splitStore` | Array | Per PO |
| `wipPositionStore` | Array | Derived rebuild |
| `wipTransferStore` | Array | Per event |
| `timelineStore` | Array | **Per event (10⁷+)** |
| `ticketStore` | Array | Per bundle |
| `dailyEntryStore`, `calendarStore` | Array | Per PO/event |

### Aggregate Roots

| AR | Gerekçe |
|----|---------|
| **ExecutionContext** | PO başına bir; route + operation executions |
| **Bundle** | Bağımsız yüksek yazma; scan/move kendi TX |
| **SplitExecution** | BR-11 parent-child split |

### Repository Sözleşmeleri

```typescript
interface IExecutionContextRepository extends IRepository<ExecutionContext> {
  findByProductionOrderNo(tenantId: string, poNo: string): Promise<ExecutionContext | null>
}

interface IBundleRepository extends IRepository<Bundle> {
  findByBarcode(tenantId: string, barcode: string): Promise<Bundle | null>
  findByProductionOrderNo(tenantId: string, poNo: string, page: PageRequest): Promise<PageResult<Bundle>>
  findByCurrentOperation(tenantId: string, opCode: string, page: PageRequest): Promise<PageResult<Bundle>>
}

interface IOperationWorkSessionRepository {
  append(tenantId: string, session: OperationWorkSession): Promise<void>
  findActive(tenantId: string, poNo: string, opCode: string): Promise<OperationWorkSession | null>
  findByBundle(tenantId: string, bundleId: string, page: PageRequest): Promise<PageResult<OperationWorkSession>>
}

interface IExecutionEventRepository extends IEventStreamRepository<ExecutionTimelineEvent> {
  findByProductionOrderNo(tenantId: string, poNo: string, page: PageRequest): Promise<PageResult<ExecutionTimelineEvent>>
}

interface IWipTransferRepository extends IEventStreamRepository<WipTransfer> {}

interface IWipPositionReadModel {
  rebuild(tenantId: string, productionOrderNo: string): Promise<WipPosition[]>
  getGlobalDensity(tenantId: string): Promise<WipDensitySnapshot[]>
}
```

### Transaction Sınırları

| Command | TX scope | Not |
|---------|----------|-----|
| `initializeExecutionPlatform` | ExecutionContext + OperationExecution[] | Idempotent |
| `moveBundleToOperation` | Bundle + WipTransfer + ExecutionEvent | **Hot path** |
| `startWorkSession` | WorkSession append + OpExecution rollup | Bundle TX ayrı olabilir |
| `evaluateQualityGate` | QualityGate + Bundle status | |
| `splitBundle/mergeBundles` | 2+ Bundle AR | Multi-row TX |

### Event Store

**EVET — partial hybrid:**

| Stream | Zorunlu | Partition |
|--------|---------|-----------|
| `execution_event` | EVET | tenant + month |
| `wip_transfer` | EVET | tenant + PO hash |
| Bundle state | OLTP table | tenant + PO |

### Snapshot

| Entity | Strateji |
|--------|----------|
| Route | `operation_execution` rows at init |
| WIP Position | Materialized view — **not stored as source** |
| Calendar | Derived from WIP + schedule |

### Optimistic Locking

**EVET — kritik:**

| Entity | Lock |
|--------|------|
| Bundle | `version` — scan race |
| ExecutionContext | `version` — init idempotent |
| WorkSession | Append-only — no lock |
| ExecutionEvent | Append-only — no lock |

### Soft Delete

| Entity | Politika |
|--------|----------|
| Bundle | `status = Scrapped/Cancelled` |
| ExecutionContext | `status = Completed/Archived` |
| Events | **Never delete** |

### Readiness Score: **75% 🟡**

| Tamamlanan | Eksik |
|------------|-------|
| Rich domain model (Sprint 3) | 11 separate stores → unified repo layer |
| Event catalog (31 events) | Bundle AR separation in service code |
| Auto-provisioning wired | WIP as MV not designed in code |
| Permission + audit hooks | Counter IDs → UUID |
| | Partition strategy not implemented |
| | Work session volume not tested |

**Blocker:** Store fragmentation — 11 independent Maps/arrays must become cohesive repository layer before PostgreSQL.

**10M verdict:** Mimari EVET; **mevcut kod HAYIR** — refactor required.

---

## 5. Stock Ledger

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `DEMO_STOCK_LEDGER` | Static snapshot | `domain/data/stock-ledger-demo.ts` |
| Caller-owned ledger | Parameter object | `domain/services/stock-ledger.ts` |

**No global ledger store** — each business rule creates `createEmptyLedger()` and discards.

### Aggregate Root

**StockLedger** — movements append-only child; balances derived.

### Repository Sözleşmesi

```typescript
interface IStockLedgerRepository extends IRepository<StockLedger> {
  findByWarehouse(tenantId: string, warehouseCode: string): Promise<StockLedger | null>
  getBalance(tenantId: string, stockCardId: string, warehouseCode: string): Promise<StockBalance>
}

interface IStockMovementRepository {
  append(tenantId: string, ledgerId: string, movement: StockMovement): Promise<void>
  findByLedger(tenantId: string, ledgerId: string, page: PageRequest): Promise<PageResult<StockMovement>>
  findByStockCard(tenantId: string, stockCardId: string, page: PageRequest): Promise<PageResult<StockMovement>>
}
```

### Transaction Sınırları

| Command | TX scope |
|---------|----------|
| Reservation (PO Released) | StockLedger + Movement append |
| Consumption (BR-07) | StockLedger + Movement |
| Production complete (FG) | StockLedger + Movement |
| Reversal | New reversal movement (never delete) |

### Event Store

**HAYIR** — movement table **is** the audit trail. Optional mirror to `audit_log`.

### Snapshot

- Balance snapshot job (nightly) for reporting
- `stock_balance_snapshot` — `(tenant, stock_card, warehouse, as_of_date, qty)`

### Optimistic Locking

**EVET — kritik** — `stock_ledger.version`; concurrent reservation race.

### Soft Delete

**Movement never deleted** — `reversal_of_movement_id` for corrections.

### Readiness Score: **80% 🟡**

| Tamamlanan | Eksik |
|------------|-------|
| Clean domain API (parameter ledger) | No persistent ledger exists |
| Movement-based model | Global ledger identity (per warehouse?) |
| BR integration points clear | Balance materialization strategy |
| | Demo ledger → real migration path |

**Blocker:** Caller-owned pattern must become injected repository before any PO/Execution TX can include stock.

---

## 6. Master Data

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| 30+ seed arrays | Static | `master-data/mock-data.ts` |
| `createRepository()` | Read-only wrapper | `master-data/repository.ts` |
| `changeStore` | MD audit | `master-data/enterprise/audit-service.ts` |
| `approvalStore` | MD approval | `master-data/enterprise/approval-service.ts` |
| `brainChangeFeed` | Bounded (200) | `master-data/enterprise/brain-change-feed.ts` |

### Aggregate Roots

Her master entity kendi AR'ı:

Customer, Supplier, Workshop, ProductionLine, Machine, Operator, Warehouse, StockCard, FabricCard, AccessoryCard, UnitOfMeasure, Country, ...

### Repository Sözleşmesi

Mevcut `MasterDataRepository<T>` → genişlet:

```typescript
interface IMasterDataRepository<T extends MasterDataEntity> extends IRepository<T> {
  findByCode(tenantId: string, code: string): Promise<T | null>
  findActive(tenantId: string, page: PageRequest): Promise<PageResult<T>>
  validate(tenantId: string, entity: T): ValidationResult  // existing
}
```

Write path → enterprise approval workflow.

### Transaction Sınırları

| Command | TX scope |
|---------|----------|
| Create MD entity | Entity + ApprovalRequest + MD Audit |
| Approve change | Entity update + Approval + Audit + Outbox (Brain feed) |
| Deactivate | Soft delete + Audit |

### Event Store

| Stream | Gerekli |
|--------|---------|
| MD change audit | EVET — append |
| Brain change feed | Outbox → Brain worker |

### Snapshot

MD entities versioned via `EntityRevision` — not inline snapshot.

### Optimistic Locking

**EVET** — concurrent MD edit by admin users.

### Soft Delete

**EVET — primary pattern:**

```
deleted_at, deleted_by, deletion_reason
status = Inactive | Obsolete
```

Hard delete: GDPR purge job only.

### Readiness Score: **85% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Repository pattern exists | Read-only — no write repo |
| 30+ entities cataloged | Seed → DB migration scripts |
| Enterprise approval/audit | `tenant_id` not in current model |
| Validation framework | Cache invalidation on write |

**Blocker:** Yok — lowest risk domain to migrate first.

---

## 7. Brain

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `sessions` | Map (ephemeral) | `brain/services/memory-layer.ts` |
| `COMPANY_CONFIGS` | Array | `brain/data/brain-config.ts` |
| `pluginRegistry` | Map (static) | `brain/plugins/plugin-registry.ts` |
| `decisionStore` | Array | `brain/twin/engines/decision-memory-engine.ts` |
| `feedbackStore` | Array | `brain/twin/engines/human-feedback-engine.ts` |
| Twin engines | Counter only | Various — no persistent store |

### Aggregate Root

**Yok** — Brain **read-only consumer** of OLTP + analytics writer.

Persist edilecek:

| Entity | Tip |
|--------|-----|
| `BrainConfiguration` | Config AR (per tenant) |
| `DecisionMemoryEntry` | Analytics append |
| `HumanFeedbackEntry` | Analytics append |
| `BrainSessionMemory` | Redis ephemeral |

### Repository Sözleşmesi

```typescript
interface IBrainConfigRepository extends IRepository<BrainConfiguration> {
  findByCompanyId(tenantId: string, companyId: string): Promise<BrainConfiguration | null>
}

interface IBrainDecisionMemoryRepository {
  append(tenantId: string, entry: DecisionMemoryEntry): Promise<void>
  findSimilar(tenantId: string, context: DecisionContext, limit: number): Promise<DecisionMemoryEntry[]>
}

interface IBrainSessionCache {
  getSession(sessionId: string): Promise<BrainSessionMemory | null>
  putSession(sessionId: string, memory: BrainSessionMemory, ttlSec: number): Promise<void>
}
```

### Transaction Sınırları

Brain **never participates in OLTP TX** — async via outbox.

### Event Store

**HAYIR** for twin runs — ephemeral compute.

Decision memory: append-only analytics table.

### Snapshot

Factory graph, knowledge graph → **cache only** (Redis, 60s TTL).

### Optimistic Locking

Config: EVET. Analytics append: HAYIR.

### Soft Delete

Config deactivate. Decision memory: archive after 2 years.

### Readiness Score: **70% 🟡**

| Tamamlanan | Eksik |
|------------|-------|
| READ ONLY contract with Execution | No persistence layer |
| Decision/feedback stores exist | Session store → Redis design |
| Plugin registry static | Twin results not persisted (by design?) |
| | OLAP path for 10M fact queries undefined |

**Blocker:** Brain must not block OLTP migration — P3 priority acceptable.

---

## 8. Digital Twin

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| Twin engines | Counter only (ephemeral IDs) | `brain/twin/engines/*` |
| `scenario-engine` | In-memory scenario | Pure compute |
| Graph caches | Single-slot / Map TTL | `performance/*-cache.ts` |

**No persistent twin state** — scenarios computed on demand from factory graph.

### Aggregate Root

**Yok** — Twin is **simulation engine**.

Optional persist:

| Entity | Amaç |
|--------|------|
| `TwinScenarioRun` | Saved scenario for comparison |
| `TwinScenarioResult` | Historical what-if archive |

### Repository Sözleşmesi

```typescript
interface ITwinScenarioRepository {
  save(tenantId: string, scenario: TwinScenarioRun): Promise<void>
  findByProductionOrderNo(tenantId: string, poNo: string): Promise<TwinScenarioRun[]>
}
```

### Transaction Sınırları

Twin runs **outside OLTP TX** — read snapshot → compute → optional save.

### Event Store

**HAYIR**

### Snapshot

Input snapshot frozen at scenario creation time (PO state + WIP snapshot ref).

### Optimistic Locking

**HAYIR** — scenarios immutable once saved.

### Soft Delete

Scenario archive — `archived_at`.

### Readiness Score: **82% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Pure compute engines | Scenario persistence optional |
| Factory graph from OLTP | Input snapshot binding |
| Cache layer exists | 10M scale N/A (compute bound) |

**Blocker:** Yok — depends on Production/Execution repos for input data.

---

## 9. Audit

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `auditStore` | `AuditLogEntry[]` | `platform/services/audit-service.ts` |
| `changeStore` | MD changes | `master-data/enterprise/audit-service.ts` |
| Execution audit | Delegates to platform | `execution-platform/execution-audit-service.ts` |

### Aggregate Root

**Yok** — Audit is **immutable append-only stream**.

### Repository Sözleşmesi

```typescript
interface IAuditLogRepository extends IEventStreamRepository<AuditLogEntry> {
  findByEntity(tenantId: string, entityType: string, entityId: string, page: PageRequest): Promise<PageResult<AuditLogEntry>>
  findByUser(tenantId: string, userId: string, page: PageRequest): Promise<PageResult<AuditLogEntry>>
  findByDateRange(tenantId: string, from: string, to: string, page: PageRequest): Promise<PageResult<AuditLogEntry>>
}
```

### Transaction Sınırları

**Same TX as business command** — audit write failure = rollback.

### Event Store

**EVET — full append-only.** Dedicated partitioned table.

### Snapshot

**HAYIR** — audit is the snapshot.

### Optimistic Locking

**HAYIR** — append-only.

### Soft Delete

**ASLA** — compliance requirement. Archive to cold storage only.

### Readiness Score: **95% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Unified audit API | 25M row partition plan |
| Execution integration | MD audit merge to single stream? |
| Immutable design | Export API for compliance |

**Blocker:** Yok — highest readiness cross-cutting concern.

---

## 10. Timeline

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `timelineStore` (platform) | `TimelineEntry[]` | `platform/services/timeline-service.ts` |
| `timelineStore` (execution) | `ExecutionTimelineEvent[]` | `execution-platform/execution-timeline-service.ts` |
| `timelineStore` (enterprise) | `EnterpriseTimelineEntry[]` | `enterprise/enterprise-timeline-service.ts` |

**3 ayrı timeline store** — consolidation required.

### Aggregate Root

**Yok** — append-only projection.

### Repository Sözleşmesi

```typescript
interface IOrderTimelineRepository extends IEventStreamRepository<TimelineEntry> {
  findByOrderId(tenantId: string, orderId: string, page: PageRequest): Promise<PageResult<TimelineEntry>>
}

interface IExecutionTimelineRepository extends IEventStreamRepository<ExecutionTimelineEvent> {
  findByProductionOrderNo(tenantId: string, poNo: string, page: PageRequest): Promise<PageResult<ExecutionTimelineEvent>>
}

interface IUnifiedTimelineQuery {
  /** Cross-stream read for enterprise view */
  findByCorrelationId(tenantId: string, correlationId: string, page: PageRequest): Promise<PageResult<UnifiedTimelineEntry>>
}
```

### Transaction Sınırları

Timeline append **same TX** as triggering command.

### Event Store

**EVET** — timeline streams are event store instances.

### Consolidation Plan

| Mevcut | Hedef |
|--------|-------|
| Platform timeline | `order_timeline` stream |
| Execution timeline | `execution_event` stream (same as event store) |
| Enterprise overlay | **Read model** — union query, not third store |

### Optimistic Locking / Soft Delete

Append-only — neither applies. No delete.

### Readiness Score: **90% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Clear event types | 3 stores → 2 streams + 1 read model |
| Platform integration | Unified query interface |
| Correlation ID support | Enterprise overlay merge |

**Blocker:** Store duplication — design resolved in architecture report; implementation Sprint 6.

---

## 11. Approval

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `workflowStore` | `ApprovalWorkflow[]` | `platform/services/approval-service.ts` |
| `approvalStore` | MD approvals | `master-data/enterprise/approval-service.ts` |

### Aggregate Root

**ApprovalWorkflow** — steps, decisions, entity ref.

### Repository Sözleşmesi

```typescript
interface IApprovalWorkflowRepository extends IRepository<ApprovalWorkflow> {
  findByEntity(tenantId: string, entityType: string, entityId: string): Promise<ApprovalWorkflow[]>
  findPending(tenantId: string, approverRole: string, page: PageRequest): Promise<PageResult<ApprovalWorkflow>>
}
```

### Transaction Sınırları

| Command | TX scope |
|---------|----------|
| Submit | Workflow + Audit |
| Approve step | Workflow + Entity update + Audit + Outbox |
| Reject | Workflow + Audit |

### Event Store

Kısmi — approval events → `order_timeline` + `audit_log`.

### Optimistic Locking

**EVET** — concurrent approvers on same workflow.

### Soft Delete

Terminal status (Approved/Rejected/Cancelled) — no delete.

### Readiness Score: **88% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Workflow model | Two stores → unified repo |
| Step FSM | MD vs platform workflow merge |
| Audit integration | Notification outbox |

**Blocker:** Yok.

---

## 12. Versioning

### Mevcut Durum

| Store | Tip | Konum |
|-------|-----|-------|
| `revisionStore` | `VersionedRecord[]` | `platform/services/versioning-service.ts` |

### Aggregate Root

**EntityRevision** — payload blob + status FSM (Draft → Active → Obsolete).

### Repository Sözleşmesi

```typescript
interface IEntityRevisionRepository extends IRepository<EntityRevision> {
  findByEntity(tenantId: string, entityType: string, entityId: string): Promise<EntityRevision[]>
  findActive(tenantId: string, entityType: string, entityId: string): Promise<EntityRevision | null>
  activate(tenantId: string, revisionId: string): Promise<EntityRevision>  // obsoletes previous
}
```

### Transaction Sınırları

| Command | TX scope |
|---------|----------|
| Create revision | EntityRevision + Audit |
| Activate | EntityRevision + Entity update + Obsolete previous + Audit |

### Event Store

Revision events → audit + timeline.

### Snapshot

**EntityRevision payload IS the snapshot** — JSONB with `schema_version`.

### Optimistic Locking

**EVET**

### Soft Delete

Obsolete status — not deleted.

### Readiness Score: **90% 🟢**

| Tamamlanan | Eksik |
|------------|-------|
| Revision FSM | DB table design |
| Active/obsolete logic | Link to ProductCard/BOM entities |
| Schema version field | Payload validation on read |

**Blocker:** Yok.

---

## Cross-Domain Dependency Graph

```
Master Data ──────────────────────────┐
     │                                │
     ▼                                ▼
  Sales ──► Planning (read)      Brain (read)
     │                                ▲
     ▼                                │
 Production Order ──► Execution ──────┤
     │                   │           │
     ▼                   ▼           │
 Stock Ledger ◄─────────┘       Digital Twin (read)
     │
     ▼
  Audit / Timeline (append — all domains write)
     │
     ▼
 Approval / Versioning (cross-cutting)
```

---

## Implementation Priority (Sprint 5+)

| Öncelik | Domain | Gerekçe |
|---------|--------|---------|
| **P0** | Execution Platform | En yüksek volume + store fragmentation |
| **P1** | Production, Stock Ledger, Sales, Audit, Timeline, Master Data | Core OLTP path |
| **P2** | Approval, Versioning, Planning cache | Cross-cutting |
| **P3** | Brain, Digital Twin | Read-only / analytics |

---

## Final Verdict — 500 Users / 10M Records

| Domain | Mevcut kod | Hedef mimari |
|--------|-----------|--------------|
| Sales | 🟡 Static | 🟢 |
| Planning | 🟢 Pure | 🟢 |
| Production | 🟡 In-memory Map | 🟢 |
| Execution Platform | 🔴 11 stores | 🟢 (with refactor) |
| Stock Ledger | 🔴 No persistence | 🟢 |
| Master Data | 🟡 Read-only seed | 🟢 |
| Brain | 🟢 Ephemeral OK | 🟢 |
| Digital Twin | 🟢 Compute OK | 🟢 |
| Audit | 🟡 Unbounded array | 🟢 |
| Timeline | 🟡 3 duplicate stores | 🟢 |
| Approval | 🟡 In-memory | 🟢 |
| Versioning | 🟡 In-memory | 🟢 |

**Genel:** Mevcut in-memory kod **10M için HAYIR**. Bu rapordaki persistence mimarisi **EVET**.

Sprint 5'te ilk adım: **Repository port interfaces + InMemory adapter** (davranış değişmeden).

---

## Appendix — Readiness Checklist (Tüm Domainler)

| Kriter | Sales | Plan | Prod | Exec | Stock | MD | Brain | Twin | Audit | Time | Appr | Ver |
|--------|-------|------|------|------|-------|----|----|------|-------|------|------|-----|
| AR tanımlı | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | n/a | n/a | n/a | n/a | ✓ | ✓ |
| Repo interface | ○ | ○ | ○ | ○ | ○ | △ | ○ | ○ | ○ | ○ | ○ | ○ |
| TX boundary | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✓ | ✓ |
| Event store need | △ | ✗ | △ | ✓ | ✗ | △ | ✗ | ✗ | ✓ | ✓ | △ | △ |
| Optimistic lock | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | △ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Soft delete | ✓ | n/a | ✓ | ✓ | ✗ | ✓ | △ | △ | ✗ | ✗ | ✓ | ✓ |
| 10M ready | ✓ | ✓ | ✓ | △ | △ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

✓ = designed | ○ = pending Sprint 5 | △ = partial | ✗ = not applicable
