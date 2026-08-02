# Architecture Integrity Report — Sprint 6A

**Generated:** 2026-08-02  
**Authority:** [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md)

---

## Dependency Rule Compliance

| Rule | Status |
|------|--------|
| Domain MUST NOT import infrastructure | ✅ Verified |
| Adapters ONLY in `infrastructure/persistence/in-memory/` | ✅ |
| Ports in `domain/ports/persistence/` | ✅ +6 new |
| Seed bootstrap in infrastructure | ✅ |
| Domain services use `requireUnitOfWork()` ports | ✅ |
| External API backward compatible | ✅ |

---

## Layer Diagram (Post Sprint 6A)

```
┌─────────────────────────────────────────┐
│  Application / UI (providers.tsx)       │
│  ensurePersistenceBootstrapped()        │
│    └─ ensureMasterDataLookupsSeeded()   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Domain Master Data Services            │
│  masterDataLookups() / enterpriseConfig │
│  createPortBackedRepository (bridge)    │
└─────────────────┬───────────────────────┘
                  │ ports only
┌─────────────────▼───────────────────────┐
│  domain/ports/persistence/              │
│  IMasterDataLookupRegistryPort + 5 more │
└─────────────────┬───────────────────────┘
                  │ implemented by
┌─────────────────▼───────────────────────┐
│  infrastructure/persistence/in-memory/│
│  LookupRegistry + EnterpriseConfig + …  │
└─────────────────────────────────────────┘
```

---

## PostgreSQL Readiness Test

**Question:** Bugün PostgreSQL Adapter yazılsa Master Data Domain kodunda tek satır değişiklik gerekir mi?

## **NO**

| Layer | PostgreSQL swap impact |
|-------|------------------------|
| `domain/master-data/*.ts` | **0 changes** |
| `domain/ports/persistence/` | **0 changes** |
| `infrastructure/persistence/postgresql/` | New files only |
| `infrastructure/persistence/bootstrap.ts` | Factory swap only |

Domain depends exclusively on port interfaces. PostgreSQL adapters implement the same contracts and register via `registerUnitOfWorkFactory()` — identical to Sprint 5c pattern.

---

## Integrity Violations Found

None.

---

## Sprint Success Criteria

| Criterion | Result |
|-----------|--------|
| No new features / rules / screens | ✅ |
| Behavior identical | ✅ (build + routes pass) |
| No dual access paths | ✅ |
| PostgreSQL = zero domain changes | ✅ **NO** required |

**Sprint 6A: COMPLETE**
