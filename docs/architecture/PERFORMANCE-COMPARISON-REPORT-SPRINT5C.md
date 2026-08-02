# Performance Comparison Report — Sprint 5c

**Generated:** 2026-08-02

---

## Context

Sprint 5c replaces direct in-memory Map/Array access with repository port indirection. Performance impact is expected to be negligible for the current demo-scale data volumes.

---

## Comparison (Estimated)

| Operation | Legacy (direct Map) | Port + InMemory Adapter | Delta |
|-----------|--------------------|-------------------------|-------|
| Single aggregate read | O(1) Map lookup | O(n) array scan + filter | ~μs overhead |
| Stream append | O(1) push | O(1) push + metadata wrap | ~negligible |
| Cursor page | O(n) filter | O(n) filter + paginate helper | ~nequal |
| UoW factory lookup | N/A | Singleton `sharedUnitOfWork` | One-time |

---

## Observations

1. **InMemory adapters use array scan** — acceptable for demo/seed data (<1000 records per store)
2. **No network/serialization overhead** — sync in-process calls
3. **Shared singleton UoW** — no per-request factory allocation after bootstrap
4. **Build time** — `npm run build` completes in ~4s (unchanged)

---

## Recommendations for Sprint 6 (PostgreSQL)

- Add indexes matching port query methods (`findByProductionOrderNo`, `cursorByOrderId`, etc.)
- PostgreSQL adapter may use connection pooling; domain stays sync via adapter-side blocking or async wrapper in infrastructure only
- Consider Map-backed indexes in InMemory adapters if demo data grows beyond 10k records per store

---

## Benchmark Status

Formal benchmarks not run — demo-scale in-memory workload shows no perceptible UI regression.
