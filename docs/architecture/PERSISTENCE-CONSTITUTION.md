# Kepler ERP — Persistence Constitution

**Sprint:** 5 — Persistence Contract Freeze  
**Status:** 🔒 **LOCKED — Constitution v1**  
**Generated:** 2026-08-02  
**Authority:** Bu belge `FOUNDATION.md` ile eşit otoritededir. Repository interface'leri ancak bu belge onaylandıktan sonra yazılır.  
**Companion:** [PERSISTENCE-ARCHITECTURE-REPORT.md](./PERSISTENCE-ARCHITECTURE-REPORT.md) · [PERSISTENCE-READINESS-REPORT.md](./PERSISTENCE-READINESS-REPORT.md)

---

## 0. Sprint 5 Kapsamı

| Bu sprintte YAPILIR | Bu sprintte YAPILMAZ |
|---------------------|----------------------|
| Persistence Constitution (bu belge) | PostgreSQL / SQL kodu |
| Repository convention dondurma | Repository TypeScript interface dosyaları |
| 24 port review + readiness | InMemory adapter implementasyonu |
| Transaction + Outbox sözleşmesi | Domain servis refactor |
| Aggregate boundary re-validation | UI değişikliği |

**Tek amaç:** Persistence Contract'ını dondurmak.

---

## 1. Repository Convention

### 1.1 Üç Port Tipi (Tek Standart Aile)

Tüm persistence erişimi yalnızca aşağıdaki üç port tipinden birine ait olabilir. Domain servisleri **asla** Map, Array veya store değişkenine doğrudan erişmez.

```
IAggregateRepository<T>     → Aggregate Root (OLTP, versioned)
IStreamRepository<T>          → Append-only kayıt (audit, timeline, session, transfer)
IReadModelRepository<T>       → Derived / materialized (WIP, calendar, KPI)
```

Ek altyapı portu:

```
IOutboxRepository             → Transaction sonrası async dağıtım kuyruğu
```

### 1.2 IAggregateRepository — Zorunlu Metod Seti

| Metod | İmza (konsept) | Zorunlu | Açıklama |
|-------|----------------|---------|----------|
| `findById` | `(tenantId, id) → T \| null` | **EVET** | Primary key ile tekil okuma |
| `findByCode` | `(tenantId, code) → T \| null` | Koşullu | Natural key olan AR/MD'de zorunlu |
| `findByIdForUpdate` | `(tenantId, id) → T \| null` | **EVET** | TX içinde pessimistic hint (adapter implementasyon detayı) |
| `save` | `(tenantId, aggregate, expectedVersion?) → T` | **EVET** | Upsert + optimistic lock check |
| `delete` | `(tenantId, id) → void` | Koşullu | Soft delete destekleyen AR'larda |
| `exists` | `(tenantId, id) → boolean` | **EVET** | Varlık kontrolü |
| `version` | `(tenantId, id) → number` | **EVET** | Mevcut version okuma (conflict UI için) |
| `cursor` | `(tenantId, filter, page) → PageResult<T>` | **EVET** | Sayfalı listeleme — **`findAll()` YASAK** |

**Yasaklar:**
- `findAll()` offset/limit ile — **10M kayıtta kullanılmaz**
- Repository içinde başka repository çağrısı
- Repository içinde business rule
- SQL/ORM tipi domain'e sızması

### 1.3 IStreamRepository — Zorunlu Metod Seti

| Metod | İmza (konsept) | Açıklama |
|-------|----------------|----------|
| `append` | `(tenantId, streamKey, events[]) → void` | Append-only yazım; TX içinde |
| `stream` | `(tenantId, streamKey, fromSequence) → T[]` | Monotonic sequence ile okuma |
| `cursor` | `(tenantId, filter, page) → PageResult<T>` | Filtreli sayfalı okuma |
| `latest` | `(tenantId, streamKey, n) → T[]` | Son N kayıt (gate, session) |
| `exists` | `(tenantId, eventId) → boolean` | Idempotency guard |

**Not:** Stream portlarında `save` / `delete` / `version` **yoktur**. Kayıtlar immutable'dır.

### 1.4 IReadModelRepository — Zorunlu Metod Seti

| Metod | Açıklama |
|-------|----------|
| `get` | `(tenantId, key) → T \| null` |
| `refresh` | `(tenantId, sourceKey) → void` — async worker veya sync rebuild |
| `cursor` | Sayfalı okuma |

Read model **asla** birincil kaynak değildir; rebuild edilebilir.

### 1.5 Ortak Tipler (Database-Agnostic)

```typescript
// Konsept — implementasyon Sprint 5b (Constitution onayı sonrası)

interface AggregateRoot {
  id: string              // UUID v7 — surrogate PK
  tenantId: string
  version: number         // optimistic lock
  schemaVersion: number   // payload migration
  createdAt: string       // ISO-8601
  updatedAt: string
  deletedAt?: string | null
}

interface CursorPage {
  cursor?: string         // opaque, adapter-encoded
  limit: number           // max 100 (constitution limit)
  sort?: string           // whitelisted field names only
}

interface PageResult<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

interface StreamKey {
  streamType: string      // catalog constant
  streamId: string        // e.g. productionOrderNo, entityId
}
```

### 1.6 Naming Convention

| Öğe | Kural | Örnek |
|-----|-------|-------|
| Port interface | `I{Entity}Repository` | `IBundleRepository` |
| Stream port | `I{Entity}StreamRepository` | `IAuditLogStreamRepository` |
| Read model port | `I{Name}ReadModel` | `IWipPositionReadModel` |
| Adapter (infra) | `{Entity}{Adapter}Repository` | `BundleInMemoryRepository` |
| Natural key field | `{entity}Code` veya `{entity}No` | `productionOrderNo`, `barcode` |

### 1.7 Port Konumu

```
frontend/src/domain/ports/persistence/     ← Interface ONLY (Sprint 5b)
frontend/src/infrastructure/persistence/ ← Adapter ONLY (Sprint 5c+)
  in-memory/
  postgres/          (gelecek — constitution DB-agnostic)
```

---

## 2. Aggregate Root Boundary — Re-Validation

### 2.1 Kesinleşmiş Karar: AR vs Stream vs Read Model

Kullanıcı tarafından sorgulanan varlıklar **yeniden doğrulandı**:

| Varlık | Sınıf | AR mı? | Gerekçe |
|--------|-------|--------|---------|
| **ExecutionContext** | `IAggregateRepository` | **EVET** | PO başına bir; route + OperationExecution[] child |
| **Bundle** | `IAggregateRepository` | **EVET** | Bağımsız yüksek yazma; shop-floor hot path |
| **OperationWorkSession** | `IStreamRepository` | **HAYIR** | Immutable append; günde milyonlarca kayıt |
| **QualityGateEvaluation** | `IStreamRepository` | **HAYIR** | Immutable değerlendirme kaydı; Bundle TX'te referans |
| **Timeline (Order)** | `IStreamRepository` | **HAYIR** | Append-only order narrative |
| **Timeline (Execution)** | `IStreamRepository` | **HAYIR** | Append-only shop-floor event (`execution_event`) |
| **Audit** | `IStreamRepository` | **HAYIR** | Immutable compliance log |

### 2.2 OperationExecution — Child, Ayrı Port Yok

`OperationExecution` **Aggregate Root değildir**. `IExecutionContextRepository` üzerinden parent aggregate ile birlikte yüklenir/kaydedilir.

**Sprint 4'ten değişiklik:** `IOperationExecutionRepository` **kaldırıldı** — child entity port yasağı.

### 2.3 Transaction İçi / Dışı Matrisi

| Varlık | TX İçinde | TX Dışında | Not |
|--------|-----------|------------|-----|
| **ExecutionContext** | `initialize`, `rollup` (op execution save) | — | Bundle move **dahil değil** |
| **Bundle** | `create`, `move`, `hold`, `complete`, `split` | — | En sık TX |
| **OperationWorkSession** | `append` (start/pause/complete) | — | Stream; TX içinde yazılır |
| **QualityGateEvaluation** | `append` + Bundle `save` | — | Aynı TX, iki port |
| **ExecutionEvent (Timeline)** | `append` | — | Bundle/Op command ile aynı TX |
| **OrderTimeline** | `append` | — | PO/Sales command ile aynı TX |
| **AuditLog** | `append` | — | **Her command TX'inde zorunlu** |
| **WipTransfer** | `append` | — | Bundle move TX'inde |
| **WipPosition** | — | `refresh` (async/sync) | **TX dışı** — derived |
| **ProductionCalendar** | — | `refresh` | **TX dışı** — derived |
| **DomainEventOutbox** | `enqueue` (TX içinde yaz) | `dispatch` (TX sonrası) | Outbox record TX'te; delivery değil |
| **Brain** | — | **Tamamen TX dışı** | Outbox worker |
| **Dashboard KPI** | — | **Tamamen TX dışı** | Read model refresh |
| **Notification** | — | **Tamamen TX dışı** | Outbox worker |
| **Digital Twin** | — | **Tamamen TX dışı** | Outbox worker |

### 2.4 Kritik Ayrım: ExecutionContext ≠ Bundle TX

```
❌ YANLIŞ: moveBundle → ExecutionContext.save + Bundle.save (tek AR kilidi, contention)

✅ DOĞRU: moveBundle TX:
    1. BundleRepository.save()
    2. WipTransferStream.append()
    3. ExecutionEventStream.append()
    4. AuditLogStream.append()
    5. OutboxRepository.enqueue('BundleMoved')
    → Commit
    → Worker: WipPositionReadModel.refresh() [async]
    → Worker: Brain / Dashboard / Twin [async]
```

ExecutionContext rollup (operation progress) **ayrı command** veya **post-commit outbox handler** ile güncellenir — Bundle TX'i bloke etmez.

### 2.5 Tam Aggregate Root Listesi (18 AR)

| # | Aggregate Root | Port | Child entities (aynı port) |
|---|---------------|------|---------------------------|
| 1 | SalesOrder | `ISalesOrderRepository` | Matrix lines |
| 2 | ProductCard | `IProductCardRepository` | BOM, route refs |
| 3 | ProductionOrder | `IProductionOrderRepository` | Snapshot refs (ayrı stream) |
| 4 | ExecutionContext | `IExecutionContextRepository` | OperationExecution[] |
| 5 | Bundle | `IBundleRepository` | BundleTicket[] |
| 6 | SplitExecution | `ISplitExecutionRepository` | Child PO refs |
| 7 | StockLedger | `IStockLedgerRepository` | Balance snapshot |
| 8 | StockCard | `IStockCardRepository` | — |
| 9 | ApprovalWorkflow | `IApprovalWorkflowRepository` | Steps |
| 10 | EntityRevision | `IEntityRevisionRepository` | Payload |
| 11 | PurchaseOrder | `IPurchaseOrderRepository` | Lines |
| 12 | FabricCard | `IFabricCardRepository` | — |
| 13 | AccessoryCard | `IAccessoryCardRepository` | — |
| 14 | Warehouse | `IWarehouseRepository` | Zones (embedded) |
| 15 | Workshop | `IWorkshopRepository` | — |
| 16 | ProductionLine | `IProductionLineRepository` | — |
| 17 | Customer | `ICustomerRepository` | — |
| 18 | BrainConfiguration | `IBrainConfigRepository` | — |

Master Data için **tek generic convention** (`IMasterDataRepository<T>`) yerine **entity başına port** — her biri yalnızca kendi AR'sını yönetir; generic port business rule sızıntısı riski taşır.

---

## 3. Repository Port Review — 24 Port

### 3.1 Anayasal Kurallar

1. **Bir port = bir persistence sorumluluğu** (bir AR veya bir stream tipi)
2. **Port birbirini çağırmaz** — orchestration yalnızca Domain Service + UnitOfWork
3. **Port SQL/ORM bilmez** — adapter implementasyon detayı
4. **Port business rule içermez** — yalnızca CRUD / append / cursor
5. **Cross-aggregate join yok** — application/domain service iki portu sırayla kullanır

### 3.2 24 Port Kataloğu

| # | Port | Tip | Aggregate / Stream | Başka port çağırır mı? | Review |
|---|------|-----|-------------------|----------------------|--------|
| P01 | `ISalesOrderRepository` | Aggregate | SalesOrder | ❌ | ✅ Onaylı |
| P02 | `IProductCardRepository` | Aggregate | ProductCard | ❌ | ✅ Onaylı |
| P03 | `IProductionOrderRepository` | Aggregate | ProductionOrder | ❌ | ✅ Onaylı |
| P04 | `IProductionDailyEntryStreamRepository` | Stream | ProductionDailyEntry | ❌ | ✅ Onaylı |
| P05 | `IProductionOrderSnapshotStreamRepository` | Stream | ProductionOrderSnapshot | ❌ | ✅ Onaylı |
| P06 | `IExecutionContextRepository` | Aggregate | ExecutionContext + OperationExecution | ❌ | ✅ Onaylı |
| P07 | `IOperationDailyEntryStreamRepository` | Stream | OperationDailyEntry | ❌ | ✅ Onaylı |
| P08 | `IBundleRepository` | Aggregate | Bundle + BundleTicket | ❌ | ✅ Onaylı |
| P09 | `IOperationWorkSessionStreamRepository` | Stream | OperationWorkSession | ❌ | ✅ Onaylı |
| P10 | `IQualityGateEvaluationStreamRepository` | Stream | QualityGateEvaluation | ❌ | ✅ Onaylı |
| P11 | `IWipTransferStreamRepository` | Stream | WipTransfer | ❌ | ✅ Onaylı |
| P12 | `IExecutionEventStreamRepository` | Stream | ExecutionTimelineEvent | ❌ | ✅ Onaylı |
| P13 | `ISplitExecutionRepository` | Aggregate | SplitExecution | ❌ | ✅ Onaylı |
| P14 | `IStockLedgerRepository` | Aggregate | StockLedger | ❌ | ✅ Onaylı |
| P15 | `IStockMovementStreamRepository` | Stream | StockMovement | ❌ | ✅ Onaylı |
| P16 | `IStockCardRepository` | Aggregate | StockCard | ❌ | ✅ Onaylı |
| P17 | `IMasterDataEntityRepository` | Aggregate | Template — entity-specific sub-ports | ❌ | ✅ Onaylı (Workshop, Line, …) |
| P18 | `IApprovalWorkflowRepository` | Aggregate | ApprovalWorkflow | ❌ | ✅ Onaylı |
| P19 | `IEntityRevisionRepository` | Aggregate | EntityRevision | ❌ | ✅ Onaylı |
| P20 | `IAuditLogStreamRepository` | Stream | AuditLogEntry | ❌ | ✅ Onaylı |
| P21 | `IOrderTimelineStreamRepository` | Stream | TimelineEntry | ❌ | ✅ Onaylı |
| P22 | `IDomainEventOutboxRepository` | Outbox | OutboxMessage | ❌ | ✅ Onaylı |
| P23 | `IWipPositionReadModel` | ReadModel | WipPosition | ❌ | ✅ Onaylı |
| P24 | `IBrainDecisionMemoryStreamRepository` | Stream | DecisionMemoryEntry | ❌ | ✅ Onaylı |

**Kaldırılan (Sprint 4 → 5 düzeltme):**
- ~~`IOperationExecutionRepository`~~ → P06 child
- ~~`IQualityGateRepository` (aggregate)~~ → P10 stream

**P17 notu:** `IMasterDataEntityRepository` bir **port şablonu** değil, her MD entity için ayrı dosya (`IWorkshopRepository`, `ICustomerRepository` …). 24 port sayısına Master Data'dan yalnızca temsilci olarak `IStockCardRepository` (P16) ve şablon kuralı (P17) dahil edilir; geri kalan MD portları aynı convention'ı tekrarlar — sayı limiti aşılabilir, convention değişmez.

### 3.3 Port → Mevcut In-Memory Store Eşlemesi

| Port | Mevcut store (kaldırılacak doğrudan erişim) |
|------|---------------------------------------------|
| P03 | `lifecycleStore` |
| P04 | `dailyEntryStore` (lifecycle) |
| P06 | `contextStore` + `operationStore` |
| P07 | `dailyEntryStore` (execution) |
| P08 | `bundleStore` + `ticketStore` |
| P09 | `sessionStore` |
| P10 | `gateStore` |
| P11 | `wipTransferStore` |
| P12 | `timelineStore` (execution) |
| P20 | `auditStore` |
| P21 | `timelineStore` (platform) |
| P22 | `eventStore` (event-bus) |
| P23 | `wipPositionStore` |

---

## 4. Transaction Boundaries — Command Kataloğu

### 4.1 Standart Command Akışı

```
Application Command
        ↓
   UoW.begin()
        ↓
   Domain Service (business rules)
        ↓
   Port writes (aggregate save / stream append / outbox enqueue)
        ↓
   UoW.commit()
        ↓
   Outbox Worker (async)
        ├── Brain
        ├── Dashboard (read model refresh)
        ├── Notification
        └── Digital Twin
```

**Kural:** Brain, Dashboard, Notification, Digital Twin **commit sonrası** çalışır. Asla aktif TX içinde.

### 4.2 Command → Transaction Matrisi

#### Sales & Product

| Command | TX içi | TX dışı (outbox) |
|---------|--------|------------------|
| CreateSalesOrder | P01.save, P21.append, P20.append, P22.enqueue | Brain, Notification |
| UpdateSalesOrderMatrix | P01.save, P20.append, P22.enqueue | Dashboard |

#### Production Order

| Command | TX içi | TX dışı |
|---------|--------|---------|
| **CreateProductionOrder** | P03.save, P05.append, P06.save (provision), P21.append, P20.append, P22.enqueue | Brain, Twin, Dashboard |
| TransitionStatus → Released | P03.save, P14.save, P15.append, P06.save, P20, P21, P22 | Brain, Twin |
| TransitionStatus → In Production | P03.save, P06.save, P08.save (bundles if needed), P20, P21, P22 | Brain, WIP refresh |
| TransitionStatus → Completed | P03.save, P14.save, P15.append, P20, P21, P22 | Brain, Twin |
| AddDailyProductionEntry | P03.save, P04.append, P20, P22 | Dashboard |

```
Create Production Order
        ↓
┌─── TRANSACTION ───────────────────────────────────┐
│  ProductionOrderRepository.save()          [P03]  │
│  ProductionOrderSnapshotStream.append()    [P05]  │
│  ExecutionContextRepository.save()         [P06]  │
│  OrderTimelineStream.append()              [P21]  │
│  AuditLogStream.append()                   [P20]  │
│  OutboxRepository.enqueue(POCreated)       [P22]  │
└───────────────────────────────────────────────────┘
        ↓ Commit
        ↓
Outbox Worker
        ├── Brain.ingest(POCreated)
        ├── Twin.invalidate(PO scope)
        ├── Dashboard.invalidate(production KPI)
        └── Notification.send(stakeholders)
```

#### Execution Platform

| Command | TX içi | TX dışı |
|---------|--------|---------|
| InitializeExecutionPlatform | P06.save, P12.append, P20, P22 | WIP refresh, Brain |
| CreateBundles | P08.save (batch), P12.append, P20, P22 | WIP refresh |
| **MoveBundleToOperation** | P08.save, P11.append, P12.append, P20, P22 | **P23.refresh**, Brain |
| StartWorkSession | P09.append, P08.save (optional qty), P12.append, P20, P22 | Dashboard |
| CompleteWorkSession | P09.append, P06.save (rollup — **ayrı kısa TX** tercih), P12, P20, P22 | Dashboard, WIP |
| EvaluateQualityGate | P10.append, P08.save, P12.append, P20, P22 | Brain, Notification |
| SplitBundle | P08.save (2+), P11.append, P12, P20, P22 | WIP refresh |

```
Move Bundle To Operation
        ↓
┌─── TRANSACTION ───────────────────────────────────┐
│  BundleRepository.save()                   [P08]  │
│  WipTransferStream.append()                [P11]  │
│  ExecutionEventStream.append()             [P12]  │
│  AuditLogStream.append()                   [P20]  │
│  OutboxRepository.enqueue(BundleMoved)     [P22]  │
└───────────────────────────────────────────────────┘
        ↓ Commit
        ↓
Outbox Worker
        ├── WipPositionReadModel.refresh(PO)  [P23]
        ├── Brain.ingest(BundleMoved)
        ├── Dashboard.invalidate(wip KPI)
        └── Notification (if hold/block)
```

**Not:** `CompleteWorkSession` → OperationExecution rollup ExecutionContext'e yazılır. Yoğunlukta **iki aşamalı** model kabul edilir:
1. TX-1: Session append + Bundle (hot path, <50ms)
2. TX-2 (outbox-triggered): ExecutionContext rollup (warm path)

Bu, Bundle/Session hot path'i bloke etmez.

#### Stock

| Command | TX içi | TX dışı |
|---------|--------|---------|
| ApplyStockMovement | P14.save, P15.append, P20, P22 | Brain, Dashboard |
| ReserveForProduction | P14.save, P15.append, P20, P22 | — |

#### Master Data & Governance

| Command | TX içi | TX dışı |
|---------|--------|---------|
| SubmitMasterDataChange | P17.save (draft), P18.save, P20, P22 | Notification |
| ApproveMasterDataChange | P17.save, P18.save, P19.save?, P20, P22 | Brain feed |

#### Cross-Cutting

| Command | TX içi | TX dışı |
|---------|--------|---------|
| SubmitForApproval | P18.save, P20, P22 | Notification |
| ActivateRevision | P19.save, P02/P03.save (target), P20, P22 | Brain |

### 4.3 Unit of Work Sözleşmesi

```typescript
// Konsept — Sprint 5b

interface IUnitOfWork {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>

  // Aggregate ports
  salesOrders: ISalesOrderRepository
  productionOrders: IProductionOrderRepository
  executionContexts: IExecutionContextRepository
  bundles: IBundleRepository
  stockLedgers: IStockLedgerRepository
  // ... tüm aggregate ports

  // Stream ports (TX-scoped append)
  auditLog: IAuditLogStreamRepository
  orderTimeline: IOrderTimelineStreamRepository
  executionEvents: IExecutionEventStreamRepository
  wipTransfers: IWipTransferStreamRepository
  workSessions: IOperationWorkSessionStreamRepository
  qualityGates: IQualityGateEvaluationStreamRepository
  outbox: IDomainEventOutboxRepository
}
```

**UoW Factory** Application Layer'da inject edilir. Domain Service parametre olarak UoW alır veya UnitOfWork scope içinde çalıştırılır.

---

## 5. Outbox Pattern Sözleşmesi

### 5.1 Temel Kural

> Outbox kaydı **TX içinde** yazılır.  
> Outbox tüketimi **TX dışında** (worker) yapılır.

### 5.2 OutboxMessage Şeması

```typescript
interface OutboxMessage {
  id: string                    // UUID v7
  tenantId: string
  aggregateType: string
  aggregateId: string
  eventType: string             // catalog constant
  payload: JsonObject
  correlationId: string
  causationId?: string
  createdAt: string
  publishedAt?: string | null
  publishAttempts: number
  lastError?: string | null
  targetHandlers: OutboxHandler[]  // fan-out hint
}

type OutboxHandler =
  | 'brain'
  | 'dashboard'
  | 'notification'
  | 'digital-twin'
  | 'wip-refresh'
  | 'ai-memory'
```

### 5.3 Handler Sorumlulukları (TX DIŞI)

| Handler | Tetiklenme | Davranış | Fail policy |
|---------|-----------|----------|-------------|
| **brain** | PO/Bundle/Quality events | `Brain.ingest(event)` — READ ONLY facts | Retry 5× → DLQ |
| **dashboard** | Any state change | Read model cache invalidate | Best-effort |
| **notification** | Approval, Gate hold, PO status | Watcher/notification dispatch | Retry 3× |
| **digital-twin** | PO/Execution changes | Invalidate scenario cache | Best-effort |
| **wip-refresh** | Bundle move, Gate | `IWipPositionReadModel.refresh()` | Retry until success |
| **ai-memory** | Domain events | AI memory record | Best-effort |

### 5.4 Outbox Worker Akışı

```
Poll outbox WHERE published_at IS NULL
        ↓
FOR EACH message (batch 100):
        ↓
   Dispatch to handlers (parallel, idempotent)
        ↓
   ON success: mark published_at
   ON failure: increment publish_attempts, last_error
        ↓
   Attempts > 5 → Dead Letter Queue (manual replay)
```

### 5.5 Idempotency

Her handler `correlationId + eventType + handler` ile idempotent olmalıdır. Duplicate delivery kabul edilir (at-least-once).

### 5.6 Mevcut event-bus → Outbox Geçişi

| Mevcut | Hedef |
|--------|-------|
| `eventStore[]` + sync handlers | P22 Outbox + async workers |
| `platformPublish()` sync fan-out | TX içi outbox enqueue; worker fan-out |
| `wirePlatformServices()` | Worker registration (infra) |

**Davranış değişikliği:** Brain/Timeline watcher **hemen** değil, commit sonrası ms-sn içinde güncellenir. UI eventual consistency kabul eder.

---

## 6. Repository Adapter Kuralları

### 6.1 İlk Adapter: InMemory

| Kural | Açıklama |
|-------|----------|
| Konum | `infrastructure/persistence/in-memory/` |
| Amaç | Mevcut Map/Array store'ları sarar; **davranış değişmez** |
| Erişim | Yalnızca port interface implementasyonu |
| Doğrudan Map | Domain servislerinde **YASAK** — adapter internal |
| Paylaşımlı state | Adapter instance'ları UoW scope'unda aynı backing store'u paylaşır |
| Test | Adapter swap = integration test without DB |

### 6.2 Adapter Geçiş Sırası

```
Phase A: InMemory adapter (Map wrap)     ← Sprint 5c
Phase B: Dual-write (InMemory + SQL)     ← Sprint 6
Phase C: SQL-only cutover                ← Sprint 7
```

### 6.3 Adapter YASAK Listesi

- Domain import etme (ters yönde OK)
- Business rule içerme
- Cross-port orchestration
- Database-specific exception'ları domain'e fırlatma (PortException wrapper)

---

## 7. Repository Readiness — 24 Port Detay

### P01 — ISalesOrderRepository

| Alan | Değer |
|------|-------|
| **Aggregate** | SalesOrder |
| **Primary Key** | `id` (UUID v7) |
| **Natural Key** | `orderNo` (tenant-scoped UNIQUE) |
| **Indexes** | `(tenant_id, order_no)`, `(tenant_id, customer_id, status)`, `(tenant_id, updated_at DESC)` |
| **Partition** | Hayır (<1M) |
| **Soft Delete** | `status=Cancelled`, `cancelled_at` |
| **Optimistic Lock** | `version` INTEGER |
| **Estimated Volume** | 10⁵ (5 yıl) |
| **Retention** | Permanent; archive after Closed+2y |

### P02 — IProductCardRepository

| Alan | Değer |
|------|-------|
| **Aggregate** | ProductCard |
| **Primary Key** | `id` |
| **Natural Key** | `productCode` |
| **Indexes** | `(tenant_id, product_code)`, `(tenant_id, buyer_id)` |
| **Partition** | Hayır |
| **Soft Delete** | `status=Obsolete`, `deleted_at` |
| **Optimistic Lock** | EVET |
| **Estimated Volume** | 10⁴ |
| **Retention** | Permanent |

### P03 — IProductionOrderRepository

| Alan | Değer |
|------|-------|
| **Aggregate** | ProductionOrder |
| **Primary Key** | `id` |
| **Natural Key** | `productionOrderNo` |
| **Indexes** | `(tenant_id, production_order_no)`, `(tenant_id, status, updated_at DESC)`, `(tenant_id, sales_order_id)` |
| **Partition** | Hayır |
| **Soft Delete** | `status=Cancelled` |
| **Optimistic Lock** | EVET |
| **Estimated Volume** | 10⁵ |
| **Retention** | Permanent |

### P04 — IProductionDailyEntryStreamRepository

| Alan | Değer |
|------|-------|
| **Aggregate** | — (stream) |
| **Primary Key** | `id` |
| **Natural Key** | — |
| **Stream Key** | `productionOrderNo` |
| **Indexes** | `(tenant_id, production_order_no, recorded_at DESC)` |
| **Partition** | `(tenant_id, recorded_at MONTH)` |
| **Soft Delete** | **YASAK** |
| **Optimistic Lock** | N/A (append-only) |
| **Estimated Volume** | 10⁶ |
| **Retention** | 7 yıl |

### P05 — IProductionOrderSnapshotStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `productionOrderNo` |
| **Indexes** | `(tenant_id, production_order_no, revision DESC)` |
| **Partition** | Hayır |
| **Soft Delete** | YASAK |
| **Estimated Volume** | 5× PO count = 5×10⁵ |
| **Retention** | Hot: son 10; cold: permanent archive |

### P06 — IExecutionContextRepository

| Alan | Değer |
|------|-------|
| **Aggregate** | ExecutionContext + OperationExecution[] |
| **Primary Key** | `id` |
| **Natural Key** | `productionOrderNo` (1:1) |
| **Indexes** | `(tenant_id, production_order_no) UNIQUE`, `(tenant_id, status)` |
| **Partition** | Hayır |
| **Soft Delete** | `status=Archived` |
| **Optimistic Lock** | EVET |
| **Estimated Volume** | 10⁵ |
| **Retention** | PO lifecycle + 1y |

### P07 — IOperationDailyEntryStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `productionOrderNo` |
| **Partition** | `(tenant_id, entry_date MONTH)` |
| **Estimated Volume** | 10⁶ |
| **Retention** | 7 yıl |

### P08 — IBundleRepository

| Alan | Değer |
|------|-------|
| **Aggregate** | Bundle + BundleTicket[] |
| **Primary Key** | `id` |
| **Natural Key** | `barcode` (tenant-scoped UNIQUE) |
| **Indexes** | `(tenant_id, barcode)`, `(tenant_id, production_order_no)`, `(tenant_id, current_operation_code, status)` |
| **Partition** | `(tenant_id, production_order_no HASH)` — 10⁶+ |
| **Soft Delete** | `status=Scrapped\|Cancelled` |
| **Optimistic Lock** | **EVET — kritik** |
| **Estimated Volume** | **10⁶–10⁷** |
| **Retention** | PO lifecycle + 2y |

### P09 — IOperationWorkSessionStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `{productionOrderNo}:{operationCode}` veya `bundleId` |
| **Indexes** | `(tenant_id, bundle_id, started_at DESC)`, `(tenant_id, production_order_no, operation_code)` |
| **Partition** | `(tenant_id, started_at MONTH)` — **10⁷ hedef** |
| **Soft Delete** | YASAK |
| **Estimated Volume** | **10⁷** |
| **Retention** | 24 ay hot → archive |

### P10 — IQualityGateEvaluationStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `{bundleId}:{operationCode}` |
| **Indexes** | `(tenant_id, bundle_id, evaluated_at DESC)` |
| **Partition** | `(tenant_id, evaluated_at MONTH)` |
| **Estimated Volume** | 10⁶ |
| **Retention** | 7 yıl (compliance) |

### P11 — IWipTransferStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `productionOrderNo` |
| **Partition** | `(tenant_id, transferred_at MONTH)` |
| **Estimated Volume** | 5×10⁶ |
| **Retention** | 24 ay hot → WIP rebuild source → archive |

### P12 — IExecutionEventStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `productionOrderNo` |
| **Indexes** | `(tenant_id, stream_id, sequence)`, `(tenant_id, event_type, occurred_at DESC)` |
| **Partition** | `(tenant_id, occurred_at MONTH)` — **10⁷** |
| **Soft Delete** | **YASAK — immutable** |
| **Estimated Volume** | **10⁷** |
| **Retention** | 24 ay hot → cold archive |

### P13 — ISplitExecutionRepository

| Alan | Değer |
|------|-------|
| **Natural Key** | `parentProductionOrderNo` |
| **Estimated Volume** | 10³ |
| **Optimistic Lock** | EVET |

### P14 — IStockLedgerRepository

| Alan | Değer |
|------|-------|
| **Natural Key** | `warehouseCode` (+ tenant) |
| **Optimistic Lock** | **EVET — kritik** |
| **Estimated Volume** | 10² ledger × tenant |
| **Retention** | Permanent |

### P15 — IStockMovementStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `ledgerId` |
| **Partition** | `(tenant_id, movement_date MONTH)` |
| **Soft Delete** | YASAK — `reversal_of_id` |
| **Estimated Volume** | 2.5×10⁶ |
| **Retention** | Permanent (compliance) |

### P16 — IStockCardRepository

| Alan | Değer |
|------|-------|
| **Natural Key** | `code` |
| **Estimated Volume** | 10⁴ |
| **Soft Delete** | EVET |

### P17 — IMasterDataEntityRepository (×N)

| Alan | Değer |
|------|-------|
| **Pattern** | Her MD entity aynı readiness pattern |
| **Natural Key** | `{entity}Code` |
| **Optimistic Lock** | EVET |
| **Estimated Volume** | 10²–10⁴ per type |
| **Soft Delete** | EVET — primary pattern |

### P18 — IApprovalWorkflowRepository

| Alan | Değer |
|------|-------|
| **Natural Key** | `(entityType, entityId, submissionNo)` |
| **Optimistic Lock** | EVET |
| **Estimated Volume** | 10⁵ |
| **Soft Delete** | Terminal status only |

### P19 — IEntityRevisionRepository

| Alan | Değer |
|------|-------|
| **Natural Key** | `(entityType, entityId, revisionNumber)` |
| **Optimistic Lock** | EVET |
| **Estimated Volume** | 10⁵ |
| **Soft Delete** | `status=Obsolete` |

### P20 — IAuditLogStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `{entityType}:{entityId}` veya global |
| **Partition** | `(tenant_id, occurred_at MONTH)` — **10⁷+** |
| **Soft Delete** | **ASLA** |
| **Estimated Volume** | **2.5×10⁷** |
| **Retention** | 7 yıl minimum (compliance) |

### P21 — IOrderTimelineStreamRepository

| Alan | Değer |
|------|-------|
| **Stream Key** | `orderId` |
| **Partition** | `(tenant_id, occurred_at MONTH)` |
| **Estimated Volume** | 10⁶ |
| **Retention** | Order lifecycle + 3y |

### P22 — IDomainEventOutboxRepository

| Alan | Değer |
|------|-------|
| **Primary Key** | `id` |
| **Indexes** | `(published_at NULLS FIRST, created_at)`, `(tenant_id, aggregate_id)` |
| **Partition** | `(tenant_id, created_at DAY)` |
| **Retention** | Published: 30 gün sonra purge |
| **Estimated Volume** | Transient — ~10× command rate |

### P23 — IWipPositionReadModel

| Alan | Değer |
|------|-------|
| **Key** | `{productionOrderNo}` veya `global` |
| **Source** | P11 + P08 rebuild |
| **Storage** | Redis (hot) + SQL MV (warm) |
| **Estimated Volume** | Derived — 10⁵ rows |
| **Retention** | Rebuild anytime; cache TTL 30s |

### P24 — IBrainDecisionMemoryStreamRepository

| Alan | Değer |
|------|-------|
| **Estimated Volume** | 10⁵ |
| **Retention** | 2 yıl → archive |
| **TX** | Brain write path — **always TX dışı** |

---

## 8. Database Portability Test

> **Soru:** "Bugün PostgreSQL yerine SQL Server, Oracle, MariaDB, CockroachDB veya başka bir veritabanına geçmek istesem Domain kodunda değişiklik yapmak zorunda kalır mıyım?"

### Cevap: **HAYIR** — Domain kodu değişmez.

| Katman | DB değişiminde |
|--------|----------------|
| **Domain services** | Değişmez |
| **Port interfaces** | Değişmez |
| **Application layer** | Değişmez |
| **InMemory adapter** | Değişmez |
| **SQL adapter** | Yalnızca infrastructure swap |
| **Migration scripts** | Adapter-specific (Flyway per dialect) |

### Portability Garantisi Koşulları

1. Port interface'lerinde SQL tipi yok (`JSONB` → port'ta `JsonObject`)
2. Pagination cursor opaque (adapter-encoded)
3. Lock semantics port seviyesinde abstract (`expectedVersion` — not `SELECT FOR UPDATE` in domain)
4. Partition/retention infrastructure config — not domain
5. Outbox worker infrastructure — not domain
6. UUID v7 primary key — tüm DB'lerde desteklenir

**EVET cevabı ne zaman olurdu (yasak):**
- Domain'de `@Entity` ORM decorator
- Domain'de raw SQL string
- Repository'de JOIN orchestrating two aggregates
- PostgreSQL-specific JSON operator in domain service

Bu constitution bu yasakları **lock eder**.

---

## 9. Onay Kapısı — Sonraki Adımlar

| Adım | Önkoşul | Sprint |
|------|---------|--------|
| ✅ Persistence Constitution | Bu belge | Sprint 5a |
| ☐ Eren onayı | Constitution review | Sprint 5a |
| ☐ Port interface dosyaları | Constitution onayı | Sprint 5b |
| ☐ InMemory adapter | Port interfaces | Sprint 5c |
| ☐ Domain service Map → Port geçişi | InMemory adapter | Sprint 5d |
| ☐ PostgreSQL adapter | Load test spec | Sprint 6 |

**Constitution onaylanmadan kod yazılmaz.**

---

## 10. Constitution Özet — 8 Karar

| # | Karar | Durum |
|---|-------|-------|
| 1 | Repository Convention — 3 port tipi, cursor zorunlu, findAll yasak | 🔒 Locked |
| 2 | ExecutionContext=AR, Bundle=AR, WorkSession/Gate/Timeline/Audit=Stream | 🔒 Locked |
| 3 | 24 port, port birbirini çağırmaz | 🔒 Locked |
| 4 | Command TX matrisi + Outbox after commit | 🔒 Locked |
| 5 | Brain/Dashboard/Notification/Twin TX dışı | 🔒 Locked |
| 6 | InMemory ilk adapter, Map doğrudan erişim yasak | 🔒 Locked |
| 7 | 24 port readiness (PK, index, partition, volume) | 🔒 Locked |
| 8 | DB portability — Domain değişmez (HAYIR) | 🔒 Locked |

---

## Appendix A — 10M Kayıt Final Sorusu

> **"500 kullanıcılı fabrikada 10 milyon kayıt oluştuğunda bu constitution çalışır mı?"**

**EVET** — P08 (Bundle), P09 (WorkSession), P12 (ExecutionEvent), P20 (Audit) partition stratejisi; P23 (WIP) derived read model; P22 (Outbox) async fan-out ile.

**Mevcut in-memory Map kodu:** HAYIR — Sprint 5c+ adapter geçişi zorunlu.

---

## Appendix B — Document Hierarchy

```
FOUNDATION.md                          (Chapter 1 — Constitutional Architecture)
    └── PERSISTENCE-CONSTITUTION.md    (Chapter 2 — Persistence Contract) ← BU BELGE
            └── PERSISTENCE-ARCHITECTURE-REPORT.md  (Sprint 4 analysis)
            └── PERSISTENCE-READINESS-REPORT.md     (Sprint 4 domain scores)
            └── [Sprint 5b] domain/ports/persistence/*.ts  (onay sonrası)
```
