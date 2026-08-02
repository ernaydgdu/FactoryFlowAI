# Master Data Migration Report — Sprint 6A

**Generated:** 2026-08-02  
**Authority:** [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md)

---

## Summary

| Metrik | Değer |
|--------|-------|
| Lookup entity count | 37 |
| Enterprise config domains | 6 (attributes, validation, dependencies, defaults, templates, hierarchy) |
| Enterprise runtime stores migrated | 3 (changes, approvals, brain feed) |
| Domain services refactored | 12 |
| TypeScript build | PASS ✅ |
| Route validation | 70/70 PASS ✅ |

---

## Migration Phases

### Phase 1 — Port Layer (6 new ports)

| Port | Path | Purpose |
|------|------|---------|
| `IMasterDataLookupRepository<T>` | `lookups/master-data-lookup.repository.ts` | Generic lookup CRUD |
| `IMasterDataLookupRegistryPort` | `lookups/master-data-lookup-registry.port.ts` | 37 typed lookup repos |
| `IMasterDataEnterpriseConfigPort` | `lookups/master-data-enterprise-config.port.ts` | Enterprise seed/config |
| `IMasterDataApprovalRepository` | `aggregates/master-data-approval.repository.ts` | Approval workflow |
| `IMasterDataChangeStreamRepository` | `streams/master-data-change-stream.repository.ts` | Change audit |
| `IMasterDataBrainChangeStreamRepository` | `streams/master-data-brain-change-stream.repository.ts` | Brain feed |

### Phase 2 — InMemory Adapters

| Adapter | File |
|---------|------|
| Lookup (generic) | `lookups/master-data-lookup.in-memory.repository.ts` |
| Lookup registry | `lookups/master-data-lookup-registry.in-memory.ts` |
| Enterprise config | `lookups/master-data-enterprise-config.in-memory.ts` |
| Approval | `aggregates/master-data-approval.in-memory.repository.ts` |
| Change stream | `streams/master-data-change-stream.in-memory.repository.ts` |
| Brain change stream | `streams/master-data-brain-change-stream.in-memory.repository.ts` |
| Coded aggregate delegate | `aggregates/coded-aggregate-from-lookup.in-memory.repository.ts` |
| Seed bootstrap | `master-data-seed.bootstrap.ts` |

### Phase 3 — Domain Refactor

| Service | Before | After |
|---------|--------|-------|
| `repositories.ts` | `createRepository(seedArray)` × 37 | `createPortBackedRepository(() => port)` |
| `enterprise/audit-service.ts` | `changeStore[]` | `masterDataChanges` port |
| `enterprise/approval-service.ts` | `approvalStore[]` | `masterDataApprovals` port |
| `enterprise/brain-change-feed.ts` | `brainChangeFeed[]` | `masterDataBrainChanges` port |
| `enterprise/attribute-service.ts` | `enterprise-seed` import | `masterDataEnterpriseConfig` port |
| `enterprise/dependency-service.ts` | `MASTER_DATA_DEPENDENCIES` | port |
| `enterprise/validation-rule-service.ts` | `MASTER_DATA_VALIDATION_RULES` | port |
| `enterprise/default-resolver-service.ts` | `MASTER_DATA_DEFAULT_PROFILES` | port |
| `enterprise/template-service.ts` | `PRODUCT_TEMPLATES` | port |
| `enterprise/hierarchy-service.ts` | hybrid seed + repos | port + port-backed repos |

---

## Access Pattern (Post Migration)

```
ensurePersistenceBootstrapped()
  → registerUnitOfWorkFactory(InMemory)
  → ensureMasterDataLookupsSeeded()  [infrastructure only]

Domain service
  → masterDataLookups() / masterDataEnterpriseConfig() / etc.
  → requireUnitOfWork().<port>
  → InMemory adapter
```

Seed data (`mock-data.ts`, `textile-master-seed.ts`, `enterprise-seed.ts`) remains in domain as **type definitions and seed constants** — loaded exclusively by `master-data-seed.bootstrap.ts` in infrastructure. Domain services no longer import seed arrays.

---

## Backward Compatibility

- Public API unchanged: `countryRepository`, `masterData`, `ALL_MASTER_DATA_REPOSITORIES`
- `createPortBackedRepository` bridge preserves `MasterDataRepository<T>` interface
- External consumers (Brain, lifecycle, UI) require no changes
