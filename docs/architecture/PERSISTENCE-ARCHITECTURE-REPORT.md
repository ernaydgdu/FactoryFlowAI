# Kepler ERP — Persistence Architecture Report

**Sprint:** 4 — Persistence Foundation  
**Generated:** 2026-08-02  
**Status:** Architecture Only — **No PostgreSQL implementation in this sprint**  
**Authority:** Domain + Application frozen; this sprint defines Infrastructure contracts only

---

## Executive Summary

Kepler ERP şu an **47+ in-memory store** ile çalışan bir SPA prototipidir. Sprint 4, gerçek PostgreSQL kodu yazmadan önce **Infrastructure katmanının anayasasını** oluşturur.

| Metrik | Değer |
|--------|-------|
| Tespit edilen in-memory store | 47+ |
| Aggregate Root (OLTP) | 18 |
| Append-only event stream | 6 |
| Materialized read model | 4 |
| Repository sözleşmesi | 24 |
| Transaction boundary (UoW) | 12 |

**500 kullanıcı / 10 milyon kayıt sorusu:** Bu rapordaki mimari **EVET** — ancak yalnızca aşağıdaki koşullar sağlandığında:

1. Shop-floor olayları **partitioned append-only** tablolarda tutulur (full event-sourcing değil, hybrid OLTP + event log)
2. WIP Position **materialized view** olarak yeniden hesaplanır; birincil kaynak değildir
3. Brain / Digital Twin **OLTP'den ayrı read path** kullanır (replica + cache)
4. Tüm tenant-scoped tablolar **`tenant_id` + zaman partition** ile bölünür
5. Sayaç tabanlı string ID'ler **UUID v7 / snowflake** ile değiştirilir

---

## 1. Mevcut Durum — In-Memory Store Envanteri

### 1.1 Store Kategorileri

| Kategori | Store sayısı | Örnek | 10M riski |
|----------|-------------|-------|-----------|
| **Static seed** | 35+ array | `SALES_ORDERS`, `PRODUCT_CARDS`, master-data seeds | Düşük — DB'ye migrate edilir, bounded |
| **Per-order aggregate** | 5 Map | `lifecycleStore`, `contextStore`, `operationStore` | Orta — O(orders) ~10⁴–10⁵ |
| **Per-bundle / per-scan** | 3 Map + 1 array | `bundleStore`, `sessionStore`, `ticketStore` | **Yüksek** — O(bundles × ops) ~10⁶–10⁷ |
| **Append-only event log** | 8 array | `auditStore`, `timelineStore`, `eventStore`, `execution timeline` | **Kritik** — unbounded ~10⁷+ |
| **Derived / rebuild** | 2 array | `wipPositionStore`, `calendarStore` | Orta — materialized, rebuild edilir |
| **Caller-owned** | 0 global | `StockLedger` (parametre) | Yüksek — kalıcı ledger gerekli |
| **Session / cache** | 4 | Brain memory, graph cache | Düşük — Redis TTL |

### 1.2 Tam Store Listesi (Kaynak → Hedef)

| # | Kaynak dosya | Store | Hedef persistence tipi |
|---|-------------|-------|------------------------|
| 1 | `data/orders.ts` | `SALES_ORDERS[]` | Aggregate: `sales_order` |
| 2 | `data/products.ts` | `PRODUCT_CARDS[]` | Aggregate: `product_card` |
| 3 | `data/stock-cards.ts` | `STOCK_CARDS[]` | Master: `stock_card` |
| 4 | `production-order/lifecycle-service.ts` | `lifecycleStore` | Aggregate: `production_order` |
| 5 | same | `dailyEntryStore` | Child: `production_daily_entry` |
| 6 | `execution-platform/execution-platform-service.ts` | `contextStore` | Aggregate: `execution_context` |
| 7 | same | `dailyEntryStore` | Child: `operation_daily_entry` |
| 8 | same | `calendarStore` | Read model: `production_calendar_slot` |
| 9 | `bundle-tracking-service.ts` | `bundleStore` | Aggregate: `bundle` |
| 10 | same | `ticketStore` | Child: `bundle_ticket` |
| 11 | `operation-execution-service.ts` | `operationStore` | Child: `operation_execution` |
| 12 | `operation-work-session-service.ts` | `sessionStore` | Append: `operation_work_session` |
| 13 | `quality-gate-service.ts` | `gateStore` | Child: `quality_gate_evaluation` |
| 14 | `split-execution-service.ts` | `splitStore` | Aggregate: `split_execution` |
| 15 | `wip-query-service.ts` | `wipPositionStore` | **Materialized view** (rebuild) |
| 16 | same | `wipTransferStore` | Append: `wip_transfer` |
| 17 | `execution-timeline-service.ts` | `timelineStore` | **Event stream**: `execution_event` |
| 18 | `platform/audit-service.ts` | `auditStore` | **Event stream**: `audit_log` |
| 19 | `platform/timeline-service.ts` | `timelineStore` | **Event stream**: `order_timeline` |
| 20 | `platform/event-bus.ts` | `eventStore` | **Outbox**: `domain_event_outbox` |
| 21 | `platform/approval-service.ts` | `workflowStore` | Aggregate: `approval_workflow` |
| 22 | `platform/versioning-service.ts` | `revisionStore` | Aggregate: `entity_revision` |
| 23 | `platform/comment/tag/attachment/watcher` | various | Cross-cutting child tables |
| 24 | `master-data/enterprise/*` | approval/audit stores | MD governance tables |
| 25 | `brain/memory-layer.ts` | `sessions` | Redis session (ephemeral) |
| 26 | `brain/twin/decision-memory-engine.ts` | `decisionStore` | Analytics: `brain_decision_memory` |
| 27 | `services/stock-ledger.ts` | caller-owned | Aggregate: `stock_ledger` + movements |

---

## 2. Hedef Mimari — Katmanlar

```
┌─────────────────────────────────────────────────────────────┐
│  UI / Application Layer                                      │
│  (React Query hooks → Application Services)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Command / Query DTO
┌──────────────────────────▼──────────────────────────────────┐
│  Domain Layer (DEĞİŞMEZ — business logic)                    │
│  Services call Repository PORTS (interfaces)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ IRepository / IUnitOfWork
┌──────────────────────────▼──────────────────────────────────┐
│  Infrastructure Layer (YENİ — Sprint 4+)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │ Redis Cache  │  │ Object Storage (S3) │ │
│  │ Adapters    │  │ WIP / Session│  │ Attachments         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Dependency Rule

- Domain **asla** PostgreSQL, Redis veya ORM import etmez
- Repository **interface** Domain'de veya `domain/ports/` altında tanımlanır
- **Implementation** `infrastructure/persistence/` altında (gelecek backend veya frontend adapter)

### 2.2 In-Memory → Repository Geçiş Stratejisi

| Faz | Açıklama |
|-----|----------|
| **P0** | Repository interface + InMemoryAdapter (mevcut Map'leri sarar) |
| **P1** | PostgreSQL adapter (tek tenant pilot) |
| **P2** | Partition + read replica + outbox worker |
| **P3** | Event archival + Brain OLAP path |

Domain servisleri **P0'da** interface'e geçer; davranış değişmez.

---

## 3. Aggregate Root Tanımları

Aggregate Root (AR), transaction sınırının ve optimistic lock'un sahibidir.

| Aggregate Root | Store kaynağı | Child entities | Lock owner |
|----------------|--------------|----------------|------------|
| **SalesOrder** | `SALES_ORDERS` | Matrix lines, snapshots, links | `sales_order.version` |
| **ProductCard** | `PRODUCT_CARDS` | BOM lines, operation route, size/color | `product_card.version` |
| **ProductionOrder** | `lifecycleStore` | Daily entries, snapshots, reservation ref | `production_order.version` |
| **ExecutionContext** | `contextStore` | Operation executions, calendar slots | `execution_context.version` |
| **Bundle** | `bundleStore` | Tickets, transfer history (ref) | `bundle.version` |
| **SplitExecution** | `splitStore` | Child PO references | `split_execution.version` |
| **StockLedger** | caller-owned | Movements, balances | `stock_ledger.version` |
| **StockCard** | `STOCK_CARDS` | Lots (future) | `stock_card.version` |
| **ApprovalWorkflow** | `workflowStore` | Steps, decisions | `approval_workflow.version` |
| **EntityRevision** | `revisionStore` | Revision payload | `entity_revision.version` |
| **MasterDataEntity** | per-type repo | Approval request ref | `md_entity.version` |
| **QualityGateEvaluation** | `gateStore` | Disposition effects | `quality_gate.version` |
| **PurchaseOrder** | workflows seed | Lines, receipts | `purchase_order.version` |
| **FabricCard / AccessoryCard** | master-data | Supplier history | `*.version` |
| **Warehouse** | master-data | Zones, locations | `warehouse.version` |

### 3.1 AR Olmayan Varlıklar (Child veya Append-Only)

| Entity | Neden AR değil | Sahiplik |
|--------|---------------|----------|
| `OperationWorkSession` | Yüksek yazma frekansı; bundle/op altında | Bundle veya ExecutionContext ref |
| `WipPosition` | Derived state | Materialized view |
| `WipTransfer` | Append-only log | Event stream |
| `ExecutionTimelineEvent` | Append-only | Event stream |
| `AuditLogEntry` | Immutable log | Event stream |
| `DomainEvent` | Outbox pattern | Infrastructure |
| `BundleTicket` | Bundle aggregate child | Bundle AR |
| `OperationExecution` | ExecutionContext child | ExecutionContext AR |
| `BrainSessionMemory` | Ephemeral | Redis TTL |

### 3.2 Bundle vs ExecutionContext Ayrımı (Kritik)

Shop floor'da **Bundle kendi AR'ıdır** — günde binlerce scan/move işlemi ExecutionContext'i kilitlememeli.

```
ExecutionContext (1 per PO)
  ├── OperationExecution[] (route snapshot)
  └── refs Bundle[] (foreign key, ayrı transaction)

Bundle (N per PO)
  ├── BundleTicket[]
  ├── WipTransfer[] (append)
  └── OperationWorkSession[] (append)
```

---

## 4. Repository Sözleşmeleri

Tüm sözleşmeler `domain/ports/persistence/` altında tanımlanacak (implementasyon Sprint 5+).

### 4.1 Temel Tipler

```typescript
/** Tüm AR'lar için ortak */
interface AggregateRoot {
  id: string
  tenantId: string
  version: number          // optimistic lock
  schemaVersion: number    // migration compat
  createdAt: string
  updatedAt: string
  deletedAt?: string | null  // soft delete (MD + config entities)
}

interface PageRequest {
  cursor?: string
  limit: number
  sort?: string
}

interface PageResult<T> {
  items: T[]
  nextCursor?: string
  totalEstimate?: number
}

/** Repository base — Domain port */
interface IRepository<T extends AggregateRoot, TId = string> {
  findById(tenantId: string, id: TId): Promise<T | null>
  findByIdForUpdate(tenantId: string, id: TId): Promise<T | null>  // SELECT FOR UPDATE
  save(tenantId: string, aggregate: T): Promise<T>                  // upsert + version check
  delete(tenantId: string, id: TId): Promise<void>                 // soft delete where applicable
}

/** Append-only — event streams */
interface IEventStreamRepository<TEvent> {
  append(tenantId: string, streamId: string, events: TEvent[]): Promise<void>
  read(tenantId: string, streamId: string, fromSequence: number): Promise<TEvent[]>
  readPaged(tenantId: string, filter: EventFilter, page: PageRequest): Promise<PageResult<TEvent>>
}
```

### 4.2 Domain Repository Listesi

| Repository | Extends | Özel metodlar |
|------------|---------|---------------|
| `ISalesOrderRepository` | `IRepository<SalesOrder>` | `findByOrderNo`, `findActiveByCustomer` |
| `IProductCardRepository` | `IRepository<ProductCard>` | `findByProductCode`, `findByBuyer` |
| `IProductionOrderRepository` | `IRepository<ProductionOrder>` | `findBySalesOrder`, `findByStatus` |
| `IExecutionContextRepository` | `IRepository<ExecutionContext>` | `findByProductionOrderNo` |
| `IBundleRepository` | `IRepository<Bundle>` | `findByBarcode`, `findByProductionOrder`, `findByOperation` |
| `IOperationExecutionRepository` | child repo | `findByProductionOrderNo` |
| `IWorkSessionRepository` | append repo | `findActiveByOperation`, `findByBundle` |
| `IQualityGateRepository` | `IRepository<QualityGateEvaluation>` | `findLatestByBundleAndOp` |
| `IWipTransferRepository` | `IEventStreamRepository` | `findByProductionOrderNo` |
| `IExecutionEventRepository` | `IEventStreamRepository` | `findByContext`, `findByEventType` |
| `IStockLedgerRepository` | `IRepository<StockLedger>` | `findByWarehouse`, `getBalance` |
| `IStockMovementRepository` | append repo | `findByLedger`, `findByStockCard` |
| `IAuditLogRepository` | `IEventStreamRepository` | `findByEntity`, `findByUser`, `findByDateRange` |
| `IOrderTimelineRepository` | `IEventStreamRepository` | `findByOrderId` |
| `IApprovalWorkflowRepository` | `IRepository<ApprovalWorkflow>` | `findPending`, `findByEntity` |
| `IEntityRevisionRepository` | `IRepository<EntityRevision>` | `findByEntity`, `findActive` |
| `IMasterDataRepository<T>` | `IRepository<T>` | `findByCode`, `findActive` (mevcut pattern korunur) |
| `IDomainEventOutboxRepository` | outbox | `claimPending`, `markPublished` |
| `IBrainDecisionMemoryRepository` | analytics | `findSimilar`, `findByTenant` |
| `ISplitExecutionRepository` | `IRepository<SplitExecution>` | `findByParentOrder` |

### 4.3 Unit of Work

```typescript
interface IUnitOfWork {
  /** Transaction başlat — tek business command = tek UoW */
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>

  /** Repository erişimi — aynı transaction connection'ı paylaşır */
  salesOrders: ISalesOrderRepository
  productionOrders: IProductionOrderRepository
  executionContexts: IExecutionContextRepository
  bundles: IBundleRepository
  stockLedgers: IStockLedgerRepository
  auditLog: IAuditLogRepository
  outbox: IDomainEventOutboxRepository
  // ...
}
```

---

## 5. Transaction Sınırları

**Kural:** Bir Application Command = Bir UoW = Bir iş kuralı atomikliği.

| Business Command | UoW kapsamı | AR'lar | Outbox event |
|-----------------|-------------|--------|--------------|
| `createProductionOrderFromSalesOrder` | Single TX | SalesOrder (read), ProductionOrder (write), ExecutionContext (provision), StockLedger (reserve) | `ProductionOrderCreated` |
| `transitionProductionOrderStatus` | Single TX | ProductionOrder, StockLedger (Released/Completed), ExecutionContext (provision) | `ProductionOrderStatusChanged` |
| `initializeExecutionPlatform` | Single TX | ExecutionContext, OperationExecution[] | `ExecutionInitialized` |
| `moveBundleToOperation` | Single TX | Bundle, WipTransfer (append), ExecutionEvent (append) | `BundleMoved` |
| `startWorkSession` | Single TX | WorkSession (append), OperationExecution (rollup) | `WorkSessionStarted` |
| `evaluateQualityGate` | Single TX | QualityGate, Bundle (hold/release), ExecutionEvent | `QualityGateEvaluated` |
| `applyStockMovement` | Single TX | StockLedger, StockMovement (append) | `StockMovementApplied` |
| `submitForApproval` | Single TX | ApprovalWorkflow, AuditLog | `ApprovalSubmitted` |
| `approveMasterDataChange` | Single TX | MasterDataEntity, ApprovalWorkflow, MD Audit | `MasterDataApproved` |

### 5.1 Cross-Aggregate Kuralları

| Durum | Strateji |
|-------|----------|
| Aynı PO içi (Context + Bundle) | **Saga değil** — ardışık TX veya Bundle bağımsız TX |
| PO oluştur + Execution provision | **Same TX** (tek command) |
| Bundle move + WIP rebuild | **Same TX** (transfer append) + **async MV refresh** |
| Brain notification | **Outbox → async worker** (TX dışı) |
| Audit yazımı | **Same TX** (fail = rollback) |

### 5.2 Saga Gereken Senaryolar (İleri Faz)

| Saga | Adımlar |
|------|---------|
| PO Complete → FG stock → Invoice trigger | 3 TX + compensating |
| Split Production (BR-11) | Parent PO + N child PO + N contexts |
| Cross-workshop transfer | Source ledger TX → Target ledger TX |

---

## 6. Event Store Analizi

### 6.1 Event Store Gerekli mi?

| Stream | Event Store? | Gerekçe |
|--------|-------------|---------|
| **Execution Timeline** | **EVET (partial)** | Shop-floor traceability; replay for dispute |
| **Audit Log** | **EVET (full append)** | Compliance; immutable |
| **Order Timeline** | **EVET (append)** | Order lifecycle narrative |
| **Domain Event Outbox** | **EVET (outbox)** | Reliable async delivery |
| **WIP Transfer** | **EVET (append)** | WIP rebuild source |
| **Stock Movement** | **HAYIR (OLTP table)** | Ledger zaten movement-based; double-write gereksiz |
| **Bundle state** | **HAYIR (OLTP + snapshot)** | Current state table yeterli; event log supplementary |
| **Brain / Twin** | **HAYIR** | Derived analytics; OLTP'den okur |

### 6.2 Hybrid Model (Önerilen)

```
┌──────────────────┐     append      ┌─────────────────────┐
│  Domain Command  │ ──────────────► │  OLTP Aggregate     │
│                  │                 │  (current state)    │
└────────┬─────────┘                 └─────────────────────┘
         │
         │ same TX
         ▼
┌──────────────────┐                 ┌─────────────────────┐
│  Event Stream    │ ──async───────► │  Materialized Views │
│  (append-only)   │                 │  WIP, Calendar, KPI │
└──────────────────┘                 └─────────────────────┘
```

**Full Event Sourcing uygulanmaz** — yalnızca audit/traceability stream'leri append-only'dir. Aggregate state OLTP tabloda tutulur.

### 6.3 Event Stream Şeması

```typescript
interface PersistedEvent {
  id: string              // UUID v7
  tenantId: string
  streamType: 'execution' | 'audit' | 'order_timeline' | 'wip_transfer' | 'outbox'
  streamId: string        // e.g. productionOrderNo, entityId
  sequence: number        // monotonic per stream
  eventType: string       // catalog guard (EXECUTION_EVENT_CATALOG)
  payload: JsonObject
  metadata: {
    actor: string
    correlationId: string
    causationId?: string
    schemaVersion: number
  }
  occurredAt: string
}
```

### 6.4 Partition Stratejisi (10M+)

| Tablo | Partition key | Retention |
|-------|--------------|-----------|
| `execution_event` | `(tenant_id, occurred_at MONTH)` | 24 ay hot → archive |
| `audit_log` | `(tenant_id, occurred_at MONTH)` | 7 yıl (compliance) |
| `wip_transfer` | `(tenant_id, production_order_no HASH)` | PO lifecycle + 1 yıl |
| `domain_event_outbox` | `(tenant_id, created_at DAY)` | 30 gün (published silinir) |

---

## 7. Snapshot Stratejisi

### 7.1 Production Order Snapshots

Mevcut: `ProductionOrderLifecycleRecord.snapshots[]` (in-memory array)

| Strateji | Açıklama |
|----------|----------|
| **Ne zaman** | Her status transition + manual revision |
| **Nerede** | `production_order_snapshot` tablosu (JSONB payload) |
| **Limit** | Son 10 snapshot hot; eskiler cold storage |
| **Format** | `schemaVersion` + typed JSONB (BOM, route, cost, planning) |

### 7.2 Execution Context Route Snapshot

| Strateji | Açıklama |
|----------|----------|
| **Ne zaman** | `initializeExecutionPlatform` anında |
| **Nerede** | `execution_context.route_snapshot` JSONB + `operation_execution` rows |
| **Değişmez** | Route version artınca yeni context (split child) |

### 7.3 WIP Position Snapshot

| Strateji | Açıklama |
|----------|----------|
| **Tip** | **Materialized view** — birincil kaynak değil |
| **Rebuild** | `wip_transfer` + `bundle.current_operation` üzerinden |
| **Refresh** | Sync (command sonrası) veya async (5 sn batch) |
| **Cache** | Redis `wip:{tenant}:{po}` TTL 30 sn |

### 7.4 Brain / Twin Snapshot

| Strateji | Açıklama |
|----------|----------|
| **Tip** | Compute-on-read + cache |
| **Persist** | `brain_decision_memory`, `brain_feedback` (analytics) |
| **TTL** | Factory graph cache 60 sn (mevcut pattern korunur) |

---

## 8. Optimistic Locking

### 8.1 Gereksinim: **EVET** — tüm AR'lar

500 eşzamanlı kullanıcıda aynı bundle/PO üzerinde çakışma kaçınılmazdır.

| Alan | Tip | Davranış |
|------|-----|----------|
| `version` | `INTEGER NOT NULL DEFAULT 1` | Her save +1 |
| Save SQL | `UPDATE ... WHERE id = $1 AND version = $2` | 0 row → `ConcurrencyConflictError` |
| Application | Retry 3× exponential backoff | UI: "Başka kullanıcı güncelledi, yenileyin" |

### 8.2 Yüksek Yazma Varlıkları

| Entity | Lock stratejisi |
|--------|----------------|
| **Bundle** | Row-level optimistic lock |
| **WorkSession** | Append-only — lock gerekmez |
| **ExecutionEvent** | Append-only — lock gerekmez |
| **WipPosition (MV)** | Lock yok — eventual consistency kabul |

### 8.3 ExecutionContext vs Bundle Çakışması

Bundle move **Bundle AR'ını** kilitler; ExecutionContext rollup **ayrı TX** veya `SELECT FOR UPDATE SKIP LOCKED` ile async güncellenir.

---

## 9. Soft Delete Politikaları

| Domain | Politika | Alanlar | Hard delete |
|--------|----------|---------|-------------|
| **Master Data** | Soft delete | `deleted_at`, `deleted_by`, `deletion_reason` | Yalnızca GDPR purge job |
| **Sales Order** | Status = Cancelled (soft) | `status`, `cancelled_at` | Hayır |
| **Production Order** | Status = Cancelled | `status` | Hayır |
| **Product Card** | Obsolete + soft | `status`, `deleted_at` | Hayır |
| **Bundle** | Status = Scrapped/Cancelled | `status` | Hayır |
| **Execution Context** | Status = Completed/Archived | `status`, `archived_at` | Hayır |
| **Audit / Timeline / Events** | **Silinmez** | — | **Asla** |
| **Stock Movement** | **Silinmez** (reversal movement) | `reversal_of_id` | Hayır |
| **Approval Workflow** | Status terminal | `status` | Hayır |
| **Brain session** | TTL expiry | Redis | Otomatik |
| **Attachments** | Soft + S3 lifecycle | `deleted_at` | S3 90 gün sonra purge |

**Kural:** Operasyonel veride fiziksel DELETE yok; iptal/reversal pattern kullanılır.

---

## 10. Versioning Stratejisi

### 10.1 Üç Seviye Versioning

| Seviye | Alan | Amaç |
|--------|------|------|
| **Schema version** | `schema_version` on entity | JSONB payload migration |
| **Aggregate version** | `version` (integer) | Optimistic lock |
| **Business revision** | `revision` / `EntityRevision` | BOM değişikliği, route değişikliği |

### 10.2 Entity Revision (mevcut `versioning-service` → DB)

```
entity_revision
  id, tenant_id, entity_type, entity_id
  revision_number, status (Draft|Active|Obsolete)
  payload JSONB, schema_version
  created_by, activated_at, obsoleted_at
  version (lock)
```

### 10.3 Execution Schema Version

Mevcut: `EXECUTION_SCHEMA_VERSION = 1` → DB'de `execution_context.schema_version`

Bundle barcode format: `KPL-BUNDLE-V1` → `format_version` column

---

## 11. Migration Stratejisi

### 11.1 Araç ve Kurallar

| Konu | Karar |
|------|-------|
| Araç | **Flyway** (SQL-first) veya **Prisma Migrate** (ORM tercih edilirse) |
| Naming | `V{yyyyMMddHHmm}__{description}.sql` |
| Tenant | Shared schema + `tenant_id` column (Phase 1); schema-per-tenant (enterprise tier) |
| Zero-downtime | Expand → migrate data → contract (3-phase) |
| Rollback | Forward-only migrations + compensating migration |

### 11.2 Migration Fazları

| Faz | İçerik |
|-----|--------|
| **M1** | Master data + Sales + Product tables |
| **M2** | Production Order + Stock Ledger |
| **M3** | Execution Platform OLTP (context, bundle, operation) |
| **M4** | Event streams (audit, execution_event, wip_transfer) |
| **M5** | Platform cross-cutting (approval, revision, comments) |
| **M6** | Brain analytics tables |
| **M7** | Partition + index optimization |
| **M8** | Seed migration (demo data → DB seed scripts) |

### 11.3 In-Memory → DB Data Migration

```
1. Export seed arrays → SQL INSERT scripts (idempotent)
2. Runtime counters → UUID v7 assignment on first save
3. Dual-write period (P1): InMemory + PostgreSQL, compare
4. Cutover: InMemory adapter disabled
```

---

## 12. Backup ve Restore Senaryoları

### 12.1 Backup

| Tip | Sıklık | RTO | RPO |
|-----|--------|-----|-----|
| **Continuous WAL archive** | Sürekli | 1 saat | 5 dk |
| **Full pg_dump** | Günlük | 4 saat | 24 saat |
| **Tenant logical export** | Haftalık | 2 saat | 7 gün |
| **Event stream archive (S3)** | Aylık | 24 saat | 0 (append-only) |
| **Attachment (S3)** | Cross-region replication | 1 saat | 0 |

### 12.2 Restore Senaryoları

| Senaryo | Prosedür |
|---------|----------|
| **S1 — DB corruption** | PITR to last good WAL point; replay outbox |
| **S2 — Tenant data loss** | Logical export restore; tenant_id filter |
| **S3 — Accidental PO delete** | Soft delete → `deleted_at IS NULL` restore; audit replay |
| **S4 — Execution event gap** | Replay from `execution_event` stream; rebuild WIP MV |
| **S5 — Full factory disaster** | Full restore + S3 attachments + Redis cold start |
| **S6 — Compliance audit request** | Point-in-time audit_log export by date range |

### 12.3 WIP Rebuild After Restore

```
1. Restore OLTP tables + event streams
2. TRUNCATE wip_position_mv
3. Run rebuild job: scan all active POs
4. Compare WIP totals with bundle.current_operation counts
5. Alert on mismatch
```

---

## 13. 10 Milyon Kayıt — Kapasite Modeli

### 13.1 Büyüme Projeksiyonu (500 kullanıcı, 5 yıl)

| Entity | Yıllık hacim | 5 yıl toplam |
|--------|-------------|--------------|
| Production Order | 2.000 | 10.000 |
| Bundle | 200.000 | 1.000.000 |
| Work Session | 2.000.000 | 10.000.000 |
| Execution Event | 3.000.000 | 15.000.000 |
| WIP Transfer | 1.000.000 | 5.000.000 |
| Audit Log | 5.000.000 | 25.000.000 |
| Stock Movement | 500.000 | 2.500.000 |

**10M hedefi primarily Work Session + Execution Event + Audit'ten gelir.**

### 13.2 Mimari Dayanıklılık Kontrol Listesi

| Kontrol | Durum | Çözüm |
|---------|-------|-------|
| Unbounded array scan | ❌ (mevcut) | Cursor pagination + partition |
| String counter ID | ❌ (mevcut) | UUID v7 |
| Single Map global store | ❌ (mevcut) | PostgreSQL + connection pool |
| WIP full rebuild O(n) | ⚠️ | Incremental MV + Redis |
| Audit in same array as UI | ❌ | Dedicated partitioned table |
| Brain full table scan | ⚠️ | Read replica + pre-aggregated KPI |
| No tenant isolation | ❌ | `tenant_id` on all tables + RLS |

### 13.3 Index Stratejisi (Özet)

| Tablo | Index |
|-------|-------|
| `bundle` | `(tenant_id, production_order_no)`, `(tenant_id, barcode) UNIQUE` |
| `operation_work_session` | `(tenant_id, production_order_no, operation_code, started_at DESC)` |
| `execution_event` | `(tenant_id, stream_id, sequence)`, `(tenant_id, occurred_at DESC)` |
| `audit_log` | `(tenant_id, entity_type, entity_id)`, `(tenant_id, occurred_at DESC)` |
| `production_order` | `(tenant_id, status, updated_at DESC)` |
| `stock_movement` | `(tenant_id, ledger_id, movement_no)` |

---

## 14. Implementation Roadmap (Sprint 5+)

| Sprint | Deliverable |
|--------|-------------|
| **S4** (bu sprint) | Architecture report + repository interfaces + InMemory adapter wrapper |
| **S5** | PostgreSQL schema M1–M3 + Production/Execution adapters |
| **S6** | Event streams + outbox worker + audit |
| **S7** | WIP materialized view + Redis cache |
| **S8** | Dual-write cutover + seed migration |
| **S9** | Partition + read replica + load test (10M) |
| **S10** | Backup automation + disaster recovery drill |

---

## 15. Son Soru — 500 Kullanıcı / 10M Kayıt

> **"500 kullanıcılı bir fabrikada 10 milyon kayıt oluştuğunda bu mimari çalışır mı?"**

### Cevap: **EVET** — bu rapordaki hybrid OLTP + partitioned event stream + materialized WIP modeli ile.

### Çalışmazdı eğer:

- Full event sourcing (her read = fold all events) kullansaydık → **HAYIR**
- Tek tablo, partition yok, counter ID, in-memory array devam etseydi → **HAYIR**
- WIP'i birincil mutable store olarak tutsaydık → **HAYIR**
- Audit + execution events aynı unbounded array'de kalsaydı → **HAYIR**

### Kritik tasarım kararları (10M için zorunlu):

1. **Bundle = ayrı AR** (ExecutionContext'i kilitleme)
2. **Append-only streams partitioned by time**
3. **WIP = derived, not source of truth**
4. **Cursor pagination everywhere** (offset yok)
5. **Outbox pattern** for Brain/async side effects
6. **Read replica** for dashboard/Brain queries

---

## Appendix A — Dosya Yapısı (Hedef)

```
frontend/src/
  domain/
    ports/
      persistence/
        repository.types.ts
        sales-order.repository.ts
        production-order.repository.ts
        execution-context.repository.ts
        bundle.repository.ts
        ...
  infrastructure/                    ← YENİ (Sprint 5)
    persistence/
      in-memory/                     ← P0: wraps existing stores
      postgres/                        ← P1: real adapters
      migrations/
      outbox-worker/
```

---

## Appendix B — İlgili Raporlar

- [PERSISTENCE-READINESS-REPORT.md](./PERSISTENCE-READINESS-REPORT.md) — Domain bazlı readiness
- [EXECUTION-PLATFORM-ENTITY-ANALYSIS.md](./EXECUTION-PLATFORM-ENTITY-ANALYSIS.md)
- [FOUNDATION.md](./FOUNDATION.md)
- [ENTERPRISE-DOMAIN-READINESS-REPORT.md](./ENTERPRISE-DOMAIN-READINESS-REPORT.md)
