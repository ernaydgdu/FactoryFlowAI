# Technical Debt Report — Sprint 6D

**Sprint:** 6D  
**Generated:** 2026-08-02

---

## Resolved in Sprint 6D

| Debt (from 6C) | Resolution |
|----------------|------------|
| MD commands outside TX | `runDomainCommandInTransaction` on all enterprise writes |
| BOM commands outside TX | `platform-orchestrator.ts` wrapped |
| Singleton repos outside snapshot | `persistence-snapshot.ts` full coverage |
| domain/data in lifecycle/bundle commands | Command context + application bridge |
| ui-options eager repo access breaking bootstrap | Lazy arrays + `ui-options-defaults.ts` |
| No automated TX/outbox validation | `validate:persistence` script |

---

## Open — Blocks PostgreSQL Adapter (P1)

| Item | Impact | Target |
|------|--------|--------|
| P01/P02 catalog on ports | PG adapter needs SalesOrder/ProductCard repos | Sprint 7 |
| `business-rule-engine.ts` domain/data | Command path bypass | Sprint 7 pre-flight |
| `quality-rework-service.ts` domain/data | Indirect command path | Sprint 7 |
| Nested MD TX (approve → recordCreate) | Double wrapper | Low — refactor to internal fn |

---

## Open — Low Priority

| Item | Notes |
|------|-------|
| `domain/index.ts` data re-exports | Barrel pollution; split public API |
| `execution-platform-service.ts` order/product reads (WIP rebuild) | Query-side; acceptable short-term |
| WIP sync fallback flag | `PERSISTENCE_WIP_SYNC_FALLBACK` legacy path |
| WorkSession mutable stream | Constitution append-only note from readiness review |

---

## WIP Stale Read Bounds (Sprint 6D test)

| Metric | Value | Acceptable |
|--------|-------|------------|
| p95 refresh latency | **1.38 ms** | ✅ < 50 ms |
| max | **1.80 ms** | ✅ |
| avg (50 schedules) | **1.16 ms** | ✅ |

Stale read window = outbox post-commit delay + async worker batch — **sub-2ms** under demo load.

---

## Validation Commands

```bash
cd frontend
npm run build
npm run validate:persistence
```

---

## Verdict

Sprint 6D **closed all targeted PARTIAL items** from PostgreSQL Readiness Review §runtime. Remaining debt is **catalog port migration (P01/P02)** — explicit non-goal of 6D, required before production PG cutover.
