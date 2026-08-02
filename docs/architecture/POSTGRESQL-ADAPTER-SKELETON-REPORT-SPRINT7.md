# PostgreSQL Adapter Skeleton Report — Sprint 7

**Sprint:** 7 — PostgreSQL Foundation (Low Risk)  
**Status:** ✅ COMPLETE (skeleton phase)  
**Generated:** 2026-08-03  
**Authority:** [POSTGRESQL-READINESS-REVIEW.md](./POSTGRESQL-READINESS-REVIEW.md) §6

---

## Executive Summary

Sprint 7 hedefi **gerçek PostgreSQL sürücüsü veya SQL yazmak değildi** — adapter iskeleti, TX/outbox/lookup/collection/stream stub'ları ve `PERSISTENCE_BACKEND` feature flag'i tamamlandı. Varsayılan backend **memory**; production cutover Sprint 8+.

| Adım | Kapsam | Durum |
|------|--------|-------|
| 7.1 | Connection pool + migration runner + UoW factory skeleton | ✅ |
| 7.2 | Async UoW wrapper (`Promise<T>` boundary) | ✅ |
| 7.3 | TX middleware skeleton (begin/commit/rollback) | ✅ |
| 7.4 | Outbox table adapter skeleton | ✅ |
| 7.5 | Master Data lookup + enterprise config stub | ✅ |
| 7.6 | Platform collection stubs (comment, watcher, aiMemory) | ✅ |
| 7.7 | Audit + Order Timeline stream stubs | ✅ |
| 7.8 | `PERSISTENCE_BACKEND=memory\|postgres` feature flag | ✅ |

---

## 1. Yeni Dosyalar

| Dosya | Rol |
|-------|-----|
| `persistence-backend.ts` | Backend seçimi (default: `memory`) |
| `persistence-unit-of-work-factory.ts` | `resolveUnitOfWorkFactory()` — memory vs postgres |
| `postgresql/postgres-config.ts` | `DATABASE_URL`, pool, migrations config |
| `postgresql/postgres-connection-pool.ts` | Pool skeleton (driver-free) |
| `postgresql/postgres-migration-runner.ts` | Flyway skeleton |
| `postgresql/postgres-transaction-context.ts` | TX context skeleton |
| `postgresql/async-unit-of-work-wrapper.ts` | Sync port → async boundary |
| `postgresql/postgres-unit-of-work-factory.ts` | PG UoW factory (throws until wired) |
| `postgresql/postgres-not-implemented.error.ts` | Paylaşılan stub hata sınıfı |
| `postgresql/outbox/postgres-outbox.repository.ts` | Outbox port skeleton |
| `postgresql/lookups/postgres-master-data-lookup-registry.stub.ts` | MD lookup stub |
| `postgresql/collections/postgres-collection-repository.stub.ts` | Platform collection stub |
| `postgresql/streams/postgres-audit-log-stream.stub.ts` | Audit + order timeline stub |
| `postgresql/index.ts` | Barrel export + sprint module registry |
| `scripts/postgres-skeleton-validation.mjs` | Static skeleton validation |

---

## 2. Bootstrap Davranışı

```
PERSISTENCE_BACKEND=memory (default)
  → InMemoryUnitOfWorkFactory
  → MD + platform seed
  → wirePersistenceRuntime()

PERSISTENCE_BACKEND=postgres
  → configurePostgresPool() (DATABASE_URL zorunlu)
  → PostgresUnitOfWorkFactory (create() → PostgresAdapterNotReadyError)
  → seed atlanır
  → wirePersistenceRuntime()
```

Memory path **değişmedi** — Sprint 6D runtime davranışı korunur.

---

## 3. Bilinçli Sınırlar (Sprint 7 dışı)

| Konu | Sprint |
|------|--------|
| `pg` npm driver / Prisma | Sprint 8+ |
| Gerçek SQL + migration execution | Sprint 8+ |
| ProductionOrder, Bundle, WorkSession PG | Sprint 8 |
| SalesOrder / ProductCard port migration | Sprint 9 |
| Mock UI akışları, eksik command wiring | Functional Stabilization |

---

## 4. Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| `npm run build` | Beklenen: PASS |
| `npm run validate:routes` | 70/70 |
| `npm run validate:persistence` | Sprint 6D runtime + Sprint 7 skeleton |
| `npm run validate:postgres-skeleton` | Static module registry |
| `pg` dependency | Yok (kasıtlı) |

---

## 5. Sonraki Sprint (8)

1. `pg` driver + connection pool gerçek implementasyon
2. TX middleware — begin/commit/rollback SQL binding
3. Outbox table DDL + worker PG handler
4. ProductionOrder + ExecutionContext hot path
5. WIP refresh outbox worker PG tüketimi

---

## Referans

- [POSTGRESQL-READINESS-REVIEW.md](./POSTGRESQL-READINESS-REVIEW.md)
- [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md)
- [TRANSACTION-RUNTIME-REPORT.md](./TRANSACTION-RUNTIME-REPORT.md)
