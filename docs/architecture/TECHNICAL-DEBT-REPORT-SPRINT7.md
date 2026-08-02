# Technical Debt Report — Sprint 7

**Generated:** 2026-08-03  
**Scope:** PostgreSQL adapter skeleton completion

---

## Closed in Sprint 7

| ID | Item | Resolution |
|----|------|------------|
| TD-PG-01 | PostgreSQL adapter yok | Skeleton module tree + stubs |
| TD-PG-02 | Async UoW wrapper tasarımı belirsiz | `async-unit-of-work-wrapper.ts` |
| TD-PG-03 | Backend seçim mekanizması yok | `PERSISTENCE_BACKEND` flag |

---

## Deferred (Sprint 8+)

| ID | Item | Priority | Target |
|----|------|----------|--------|
| TD-PG-04 | Gerçek pg driver + pool | P0 | Sprint 8 |
| TD-PG-05 | TX SQL binding | P0 | Sprint 8 |
| TD-PG-06 | Outbox DDL + worker PG | P0 | Sprint 8 |
| TD-PG-07 | MD lookup PG implementasyonu | P1 | Sprint 8 |
| TD-PG-08 | Platform collection PG | P1 | Sprint 8 |
| TD-PG-09 | Audit / timeline stream PG | P1 | Sprint 8 |
| TD-CAT-01 | SalesOrder/ProductCard port migration | P1 | Sprint 9 |
| TD-FUNC-01 | Mock UI save flows | P2 | Functional Stabilization |
| TD-FUNC-02 | Orphan application hooks | P2 | Functional Stabilization |
| TD-EVB-01 | `event-bus.subscribe()` legacy API | P2 | Sprint 8 cleanup |

---

## Risk Notes

- `PERSISTENCE_BACKEND=postgres` şu an **bilinçli olarak fail-fast** — production'da flag açılmamalı.
- Skeleton stub'ları `PostgresAdapterNotReadyError` fırlatır; silent fallback yok.
