# TECHNICAL-DEBT-REPORT.md — Phase 5 Module 1

## Performance Impact (expected)

| Metric | Impact |
|--------|--------|
| Route count | +8 shop-floor routes (nested under `/shop-floor`) |
| Bootstrap duration | Unchanged (no new seed) |
| Build duration | +1 validation script (`validate:shop-floor`) + tsc of ~15 new TS files |

Exact gate timings recorded at delivery (build / bootstrap audit / startup regression).

## Known debt / follow-ups

1. Auto-link Operation Complete quantities from session rollups into declaration (today operator declares explicitly).
2. Cancel/Close → auto `RESERVATION_RELEASE` (command exists from Phase 4 M3; not wired here).
3. Full Quality module (Reject/Rework/Hold workflows) — entry points only.
4. Machine Down status as master-data field still absent; runtime status is session-derived only.
5. Legacy demo planning/sewing pages still use `SEWING_LINE_RECORDS` (out of MES scope).

## Go-Live Readiness Score (module coverage)

| Phase area | Status | Weight |
|------------|--------|--------|
| IAM / Platform | Done | 10 |
| Master Data / Product / BOM / Cost | Done | 15 |
| Sales Order / MRP / Purchasing | Done | 15 |
| Inventory / Warehouse / Stock Ledger | Done | 15 |
| Production Planning (scheduling) | Done | 10 |
| Production Order + Reservation | Done | 15 |
| Shop Floor MES (this module) | Done | 10 |
| Full Quality / Shipping / Costing close | Partial / pending | 10 |

**Score: ~85 / 100** — core order-to-warehouse + shop-floor path is repository-backed; Quality depth and shipping close remain for later phases.
