# PostgreSQL Readiness Review — Pre Sprint 7

**Generated:** 2026-08-02  
**Scope:** Architecture validation only — **no PostgreSQL adapter code**  
**Authority:** [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md)

---

## Executive Summary

| Area | Status |
|------|--------|
| Port surface (47 contracts) | 🟢 Ready |
| InMemory adapter parity | 🟢 Ready |
| Aggregate boundaries | 🟢 Valid |
| Index / partition design (constitution) | 🟢 Documented |
| Runtime TX + Outbox semantics | 🔴 **Not implemented** |
| Catalog domain on ports | 🟡 Partial |
| Async port contract | 🟡 Gap |

**Final verdict: PARTIAL** — Port katmanına güvenle başlanır; production cutover için Sprint 7 öncesi TX/Outbox runtime zorunlu.

---

## 1. Repository Port Review (47)

### Yeterlilik

Constitution P01–P24 çekirdeği **tam**. Sprint 6A/6B ile eklenen portlar boşlukları kapattı:

| Eksik (Sprint 5) | Sprint 6B karşılığı |
|------------------|---------------------|
| ProductionCalendar | `IProductionCalendarReadModel` ✅ |
| Collaboration (Comment, Tag, …) | 8 × `ICollectionRepository` ✅ |
| Master Data lookup | `IMasterDataLookupRegistryPort` (37 entity) ✅ |

### Hâlâ eksik (PostgreSQL öncesi)

| Eksik | Öncelik | Not |
|-------|---------|-----|
| `domain/data/` → P01/P02 domain wiring | P1 | SalesOrder, ProductCard hâlâ static import |
| Notification dispatch port | P2 | Constitution TX dışı — outbox worker tüketir; ayrı port opsiyonel |
| Dashboard/KPI read model port | P3 | Outbox-triggered refresh yeterli olabilir |

### Fazla port?

**Hayır — kritik fazlalık yok.** 47 sayısı constitution 24 + MD genişlemesi + platform collection genişlemesinin doğal sonucu.

### Birleştirilebilir port?

| Aday | Öneri |
|------|-------|
| `enterpriseTimeline` + `orderTimeline` + `executionEvents` | **Birleştirme** — farklı domain sözleşmeleri; PG'de ayrı tablo, read-layer'da birleşik view |
| `masterDataChanges` + `auditLog` | **Birleştirme** — farklı retention/compliance |
| 8 × Collection port | **Birleştirme** — ortak `ICollectionRepository<T>` base zaten var; PG'de ayrı tablolar |
| `IMasterDataLookupRegistryPort` (37) | **Registry korunur** — PG: `entity_type` discriminator veya schema-per-entity; port tek kalır |

### Yeni port tipi uyarısı

Sprint 6B `ICollectionRepository<T>` constitution'daki 3 tipin dışında **4. pattern**. PostgreSQL mapping:

- Mutable platform entity → normal OLTP tablo (`UPDATE`/`DELETE` OK)
- Stream entity → append-only tablo (`INSERT` only)

**Aksiyon:** Collection portları PG adapter'da stream değil **mutable table** olarak map edilmeli (constitution uyumlu).

---

## 2. Aggregate Root Re-validation

### Sınıflandırma (değişmedi — doğru)

| Entity | Tip | Lock |
|--------|-----|------|
| ExecutionContext + OperationExecution | AR (P06) | Optimistic — **rollup hot spot** |
| Bundle + Tickets | AR (P08) | Optimistic — **shop floor hot spot** |
| WorkSession, ExecutionEvent, Audit, WipTransfer | Stream | Append-only |
| WipPosition, ProductionCalendar | Read model | Rebuild |

### Transaction sınırları

Constitution matrisi **doğru tasarlanmış**. Ancak **runtime uygulaması eksik**:

```
grep begin\(\)|commit\(\)|enqueue\( → domain/
  begin/commit: 0 çağrı
  enqueue: 0 çağrı (yalnızca port tanımı)
```

InMemory adapter senkron ve TX'siz çalışıyor — PostgreSQL'de **partial write riski** oluşur.

### Lock kapsamı

| Aggregate | Risk | Değerlendirme |
|-----------|------|---------------|
| Bundle (P08) | Row-level hot lock | ✅ Doğru ayrım — ExecutionContext TX dışı |
| ExecutionContext (P06) | JSON/array rollup büyük row | ⚠️ Constitution 2-TX modeli gerekli |
| StockLedger (P14) | Financial critical | ✅ Ayrı AR doğru |
| WorkSession `updateSession()` | Mutable stream | ⚠️ PG'de UPDATE gerekir — append-only ihlali; refactor veya `session_revision` stream |

---

## 3. Execution Platform Write Load Analysis

**Varsayımlar:** 500 kullanıcı · 12 hat · 3 vardiya · 10M kümülatif kayıt (~24 ay)

### Günlük hacim tahmini

| Stream / AR | Günlük yazma | 10M'deki pay | Peak (1 vardiya) |
|-------------|-------------|--------------|------------------|
| **Work Session** (P09) | ~4,500 | ~33% (~3.3M) | ~1,500/saat |
| **Execution Timeline** (P12) | ~3,500 | ~26% (~2.6M) | ~1,200/saat |
| **Audit Log** (P20) | ~2,700 | ~20% (~2.0M) | ~900/saat |
| **WIP Transfer** (P11) | ~1,400 | ~10% (~1.0M) | ~470/saat |
| **Bundle** (P08 AR) | ~900 update | ~7% (~700K) | ~300/saat |
| **WIP Read Model** (P23) | ~700 rebuild | ~5% | CPU-bound |

**Toplam:** ~13,700 yazma/gün ≈ Constitution 10⁷ stream hedefi ile uyumlu.

### Darboğaz noktaları

1. **P06 ExecutionContext rollup** — `operationExecutions[]` tek row update; session complete patlaması
2. **P08 Bundle + tickets** — concurrent move aynı bundle row
3. **P23 WIP rebuild** — `rebuildWipIndex()` tüm context'leri tarar + `setPositions()` sync (TX içi olmamalı)
4. **P20 + P12** — partition olmadan 10M+ sequential scan
5. **Fan-out multiplier** — Her shop floor komutu 3–5 stream yazıyor; TX olmadan tutarsızlık riski
6. **Sync port blocking** — 500 concurrent user'da connection pool exhaustion

---

## 4. PostgreSQL Index Plan (Özet)

### Hot path tablolar

#### `bundle` (P08)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Unique | `(tenant_id, barcode)` |
| FK | `(tenant_id, production_order_no) → production_order` |
| Composite | `(tenant_id, production_order_no, status)` |
| Composite | `(tenant_id, current_operation_code, status)` |
| Cursor | `(tenant_id, updated_at DESC, id)` |
| Partition | `HASH(tenant_id, production_order_no)` — 16–32 partition |

#### `operation_work_session` (P09)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| FK | `(tenant_id, production_order_no)` |
| Composite | `(tenant_id, production_order_no, operation_code, started_at DESC)` |
| Composite | `(tenant_id, bundle_id, started_at DESC)` |
| Cursor | `(tenant_id, started_at DESC, id)` |
| Partition | `RANGE(started_at)` monthly |

#### `execution_event` (P12)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Unique | `(tenant_id, stream_type, stream_id, sequence)` |
| Composite | `(tenant_id, production_order_no, occurred_at DESC)` |
| Composite | `(tenant_id, event_type, occurred_at DESC)` |
| Cursor | `(tenant_id, occurred_at DESC, id)` |
| Partition | `RANGE(occurred_at)` monthly |

#### `audit_log` (P20)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Composite | `(tenant_id, entity_type, entity_id, changed_at DESC)` |
| Composite | `(tenant_id, changed_by, changed_at DESC)` |
| Cursor | `(tenant_id, changed_at DESC, id)` |
| Partition | `RANGE(changed_at)` monthly |

#### `wip_transfer` (P11)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Composite | `(tenant_id, production_order_no, transferred_at DESC)` |
| Partition | `RANGE(transferred_at)` monthly |

#### `wip_position` (P23 — read model)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, key)` |
| Composite | `(tenant_id, production_order_no)` |
| Partition | None (small, rebuild) |

#### `outbox_message` (P22)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Composite | `(tenant_id, status, created_at)` WHERE status='pending' |
| Cursor | `(tenant_id, created_at, id)` |

#### `execution_context` (P06)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Unique | `(tenant_id, production_order_no)` |
| Cursor | `(tenant_id, updated_at DESC, id)` |

#### Platform collection tabloları (comment, tag, attachment, watcher, …)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, id)` |
| Composite | `(tenant_id, entity_type, entity_id)` |
| Cursor | `(tenant_id, created_at DESC, id)` |
| Partition | Gerekmez (<10⁶)

#### `master_data_lookup` (37 entity — registry)

| Key | Columns |
|-----|---------|
| PK | `(tenant_id, entity_type, id)` |
| Unique | `(tenant_id, entity_type, code)` |
| Composite | `(tenant_id, entity_type, is_active, sort_order)` |
| Partition | `LIST(entity_type)` veya ayrı tablolar

---

## 5. Outbox Worker Re-evaluation

### Constitution hedefi

```
TX commit → Outbox Worker → Brain | Dashboard | Notification | Twin
```

### Mevcut durum (kod doğrulaması)

| Kontrol | Sonuç |
|---------|--------|
| `outbox.enqueue()` domain'den çağrılıyor mu? | ❌ **Hayır** (0 çağrı) |
| Outbox worker process var mı? | ❌ **Hayır** |
| Brain TX dışı mı? | ⚠️ Brain adapter domain'i **doğrudan sync okur** — outbox yok |
| Dashboard refresh TX dışı mı? | ⚠️ WIP `setPositions()` **komut path'inde sync** |
| Notification TX dışı mı? | ⚠️ `watcherNotifications` sync write — dispatch worker yok |
| Digital Twin TX dışı mı? | ⚠️ Twin engine sync domain read — outbox yok |

**Sonuç:** Outbox **port tanımlı**, ancak **runtime pattern uygulanmamış**. Brain/Dashboard/Notification/Twin constitution gereği **TX dışına alınmamış**.

### Sprint 7 öncesi zorunlu

1. Application/Domain command wrapper: `UoW.begin()` → writes → `outbox.enqueue()` → `commit()`
2. Outbox worker (infrastructure): `claimPending` → dispatch → `markPublished`
3. WIP refresh, Brain ingest, Dashboard invalidate → worker handler
4. `publishDomainEvent` → `enqueue` ile birleştir veya deprecate

---

## 6. Migration Plan

### Sprint 7 — Foundation + Low Risk

| Adım | Kapsam |
|------|--------|
| 7.1 | `postgresql/` adapter skeleton, connection pool, migration runner (Flyway) |
| 7.2 | Async UoW wrapper (`Promise<T>` adapter, sync port korunur) |
| 7.3 | **TX middleware** — begin/commit/rollback gerçek implementasyon |
| 7.4 | Outbox table + worker skeleton |
| 7.5 | Master Data lookup + enterprise config (read-heavy, düşük risk) |
| 7.6 | Platform collections (comment, tag, attachment, watcher) |
| 7.7 | Audit + Order Timeline streams |
| 7.8 | Feature flag: `PERSISTENCE_BACKEND=memory\|postgres` |

### Sprint 8 — Execution Hot Path

| Adım | Kapsam |
|------|--------|
| 8.1 | ProductionOrder + ExecutionContext |
| 8.2 | Bundle AR (partition) |
| 8.3 | WorkSession + ExecutionEvent streams (monthly partition) |
| 8.4 | WipTransfer stream |
| 8.5 | QualityGate stream |
| 8.6 | Outbox → WIP refresh worker |
| 8.7 | Load test: 12 hat simülasyonu |

### Sprint 9 — Catalog + Cutover

| Adım | Kapsam |
|------|--------|
| 9.1 | SalesOrder, ProductCard domain → port migration |
| 9.2 | StockLedger + StockMovement |
| 9.3 | WipPosition + ProductionCalendar read models |
| 9.4 | Brain decision memory + human feedback |
| 9.5 | Dual-write validation period |
| 9.6 | Production cutover + archive InMemory |

---

## 7. Risk Analysis — Top 10

| # | Adım | Risk | Rollback |
|---|------|------|----------|
| 1 | TX middleware ekleme | Partial commit bug | Feature flag OFF → InMemory; PG rollback script |
| 2 | Outbox worker | Lost/duplicate events | Idempotent handlers; replay from outbox; disable worker |
| 3 | Bundle PG migration | Hot row lock timeout | Keep InMemory for bundle; PG read replica |
| 4 | WorkSession partition | Cross-partition query fail | Unified view; reattach partition |
| 5 | ExecutionContext rollup | Large row bloat | Extract operation_execution child table |
| 6 | WIP async refresh | Stale dashboard | Sync fallback flag; rebuild job |
| 7 | Master Data seed | Wrong tenant data | Transactional seed; truncate + reseed |
| 8 | Async port wrapper | Promise leak / deadlock | Timeout; circuit breaker; revert sync |
| 9 | Audit 10M growth | Slow compliance query | Partition detach → archive; BRIN index |
| 10 | Dual-write period | Data divergence | InMemory authoritative; PG diff report |

---

## Final Question

> Bugün PostgreSQL implementasyonuna güvenle başlanabilir mi?

## **PARTIAL**

### Gerekçe

**EVET olan kısımlar (başlamaya izin verir):**

- 47 port sözleşmesi PostgreSQL mapping için yeterli ve tutarlı
- Aggregate boundary'ler constitution ile uyumlu; partition/index planı hazır
- InMemory adapter'lar port davranışını doğrulamış; domain PG'den izole
- Sprint 7 planı küçük adımlarla riski yönetilebilir kılıyor

**HAYIR olan kısımlar (production cutover'ı engeller):**

- `UoW.begin/commit` runtime'da **hiç kullanılmıyor** — PG TX olmadan veri bütünlüğü garanti edilemez
- `outbox.enqueue()` **hiç çağrılmıyor** — Brain/Dashboard/Notification/Twin TX dışına alınmamış
- WIP refresh komut path'inde sync — constitution ihlali
- `domain/data/` catalog hâlâ port dışı
- Port'lar sync; PG adapter async wrapper tasarımı Sprint 7.2'de netleşmeli
- `workSessions.updateSession()` mutable stream — append-only PG modeli ile çelişir

**Öneri:** Sprint 7'e **adapter kodu yazarak başlanabilir** (7.1–7.3 paralel: PG skeleton + TX middleware + outbox). Production trafiği PostgreSQL'e **Sprint 8 sonrası** yönlendirilmeli; önce TX/Outbox runtime tamamlanmalı.
