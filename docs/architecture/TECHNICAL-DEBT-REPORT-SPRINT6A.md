# Technical Debt Report — Sprint 6A

**Generated:** 2026-08-02

---

## Resolved in Sprint 6A

| Item | Resolution |
|------|------------|
| 37 lookup repos backed by in-domain arrays | Port-backed via `IMasterDataLookupRegistryPort` |
| 7 master-data UoW slots as empty stubs | Real adapters + coded aggregate delegation |
| Enterprise services direct seed imports | `IMasterDataEnterpriseConfigPort` |
| 3 enterprise runtime stores | Dedicated stream/aggregate ports |
| Master data outside persistence layer | Fully integrated into UoW |

---

## Remaining Debt

| Priority | Item | Target |
|----------|------|--------|
| P2 | `createRepository()` still exported from `repository.ts` | Remove when all tests migrate to ports |
| P2 | `createPortBackedRepository` read cache not invalidated on port save | Add invalidation hook if mutations increase |
| P3 | Seed data files remain in domain folder | Move to `infrastructure/seed/` in Sprint 6B if desired |
| P3 | `calendarStore[]` in execution-platform (Sprint 5c debt) | Sprint 6B |
| P3 | PostgreSQL async wrapper for sync ports | Sprint 6B PostgreSQL adapter |
| P3 | stockCard / fabricCard / accessoryCard still empty stubs | When card services migrate |

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Bootstrap order (persistence before master-data import) | Low | `providers.tsx` calls persistence first |
| Singleton UoW shared lookup state | Low | `resetPersistenceForTests()` exists |
| Port-backed repo cache stale after external mutation | Low | Current MD is read-heavy; save paths invalidate via new entity version |

---

## Next Sprint Recommendations

1. PostgreSQL adapter for master data lookups (`infrastructure/persistence/postgresql/` only)
2. Move seed constants to infrastructure if strict domain purity desired
3. Add `ProductionCalendarSlot` port (execution platform debt)
4. Integration tests: lookup round-trip (seed → getAll → save → getById)
