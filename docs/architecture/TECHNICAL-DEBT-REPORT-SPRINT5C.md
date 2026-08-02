# Technical Debt Report — Sprint 5c

**Generated:** 2026-08-02

---

## Resolved in Sprint 5c

| Item | Resolution |
|------|------------|
| Promise<> wrappers on sync ports | Removed (35 methods) |
| Platform services direct store access | Migrated to ports |
| Execution platform module-level stores | Eliminated (except calendar) |
| UoW stub repos throwing at runtime | Replaced with real/empty adapters |
| Outbox missing legacy event API | Extended `IDomainEventOutboxRepository` |
| Missing persistence-registry export | Added to domain barrel |

---

## Remaining Debt

| Priority | Item | Target |
|----------|------|--------|
| P1 | `calendarStore[]` in execution-platform-service — no port | Sprint 6 or new P-port |
| P2 | Master-data ports use empty stub adapters | Sprint 6 when MD services migrate |
| P2 | InMemory array scan vs indexed lookup | Optimize if data scale increases |
| P3 | `EmptyStreamInMemoryRepository` missing custom cursor methods | Add when brain/stock streams are used |
| P3 | Work session stream uses `updateSession` escape hatch | Consider aggregate model refactor |
| P3 | Bundle tickets stored as aggregate child vs separate stream | Document decision; current approach OK |

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Singleton UoW shared state in tests | Low | `resetPersistenceForTests()` exists |
| Seed data re-hydration on cold start | Low | `seedFromSalesOrders()` idempotent check |
| PostgreSQL async mismatch | Medium | Sprint 6 adapter wraps sync port contract |

---

## Next Sprint Recommendations

1. Add `ProductionCalendarSlot` port or embed in ExecutionContext metadata
2. Implement PostgreSQL adapters in `infrastructure/persistence/postgresql/` only
3. Migrate master-data services to wired ports (replace empty stubs)
4. Add integration tests for port round-trip (save → find → cursor)
