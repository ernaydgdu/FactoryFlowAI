# Architecture Integrity Report — Sprint 6B

**Generated:** 2026-08-02

---

## Dependency Rule Compliance

| Rule | Status |
|------|--------|
| Domain MUST NOT import infrastructure | ✅ |
| Domain services use ports only (no module stores) | ✅ |
| Application uses domain only | ✅ unchanged |
| Bootstrap single entry point | ✅ |
| Seeds in infrastructure only | ✅ |

---

## Layer Diagram (Post Sprint 6B)

```
providers.tsx
  └── ensurePersistenceBootstrapped()  ← SINGLE ENTRY
        ├── registerUnitOfWorkFactory()
        ├── ensureMasterDataLookupsSeeded()
        └── ensurePlatformSeeded()

Domain Services
  ├── requireUnitOfWork().<port>
  ├── masterDataLookups() / enterpriseConfig()
  └── productionCalendarRepo() / commentsRepo() / …

Infrastructure
  └── in-memory/ (40 adapter files)
```

---

## PostgreSQL Readiness

**Persistence katmanı artık %100 Port tabanlı mı?**

## **EVET ✅**

| Criterion | Status |
|-----------|--------|
| All UoW slots have port interface | ✅ 45/45 |
| All UoW slots have InMemory adapter | ✅ 45/45 |
| No module-level stores in domain services | ✅ |
| No generic Empty* stubs in UoW | ✅ |
| Bootstrap factory-swappable | ✅ |

**Sprint 7 (PostgreSQL Adapter) için hazır.**

PostgreSQL implementasyonu:
- `infrastructure/persistence/postgresql/` altına yeni dosyalar
- `registerUnitOfWorkFactory(PostgresUnitOfWorkFactory)` swap
- Domain / Application değişikliği: **0 satır**

---

## Known Non-Persistence Exceptions

| Item | Scope |
|------|-------|
| `event-bus` handlers Map | In-process event dispatch |
| `domain/data/` demo imports | Demo layer (sales orders, products) — not module stores |

These are outside the persistence constitution scope and do not block PostgreSQL adapter work.
