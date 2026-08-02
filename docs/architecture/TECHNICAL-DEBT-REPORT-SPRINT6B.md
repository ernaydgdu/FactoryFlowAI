# Technical Debt Report — Sprint 6B

**Generated:** 2026-08-02

---

## Resolved in Sprint 6B

| Item | Resolution |
|------|------------|
| P1 `calendarStore[]` — no port | `IProductionCalendarReadModel` + adapter |
| TD-P13 Collaboration ports undefined | 8 collection ports + adapters |
| TD-P14 ProductionCalendar port | `IProductionCalendarReadModel` |
| Generic Empty* stubs in UoW | Named catalog adapters |
| `brainDecisionMemory` empty stub | Real stream adapter |
| Dual bootstrap (persistence + master-data) | Single `ensurePersistenceBootstrapped()` |
| 9 module-level platform/brain stores | Port-backed |

---

## Remaining Debt

| Priority | Item | Target |
|----------|------|--------|
| P3 | `domain/data/` demo imports (orders, products) | Sprint 7+ catalog domain migration |
| P3 | `createRepository()` exported from master-data | Remove when tests migrate |
| P3 | Catalog adapters empty (salesOrder, productCard…) | Seed when domain services migrate |
| P3 | PostgreSQL async wrapper | Sprint 7 |
| P3 | Integration tests for port round-trip | Sprint 7 |

---

## Technical Debt Trend (6A → 6B)

| Metric | 6A | 6B | Trend |
|--------|----|----|-------|
| P1 items | 0 | 0 | → |
| Module-level stores | 0 (MD) + 9 (other) | **0** | ↓↓ |
| Empty UoW stubs | 10 | **0** | ↓↓ |
| Undefined collaboration ports | 4 | **0** | ↓↓ |
| Bootstrap entry points | 2 | **1** | ↓ |

**Bu sprint teknik borcu artırdı mı? NO**

---

## Sprint 7 Recommendations

1. PostgreSQL adapter in `infrastructure/persistence/postgresql/`
2. Migrate `domain/data/` consumers to catalog ports (salesOrder, productCard)
3. Seed catalog adapters from demo data in bootstrap
4. Port round-trip integration tests
