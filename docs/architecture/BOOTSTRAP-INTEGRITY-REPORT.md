# Bootstrap Integrity Report

**Date:** 2026-08-03  
**Verdict:** YES

## Chain Order (memory backend)

```
AppProviders.useEffect
  → ensurePersistenceBootstrapped()
    → registerUnitOfWorkFactory(resolveUnitOfWorkFactory())
    → ensureMasterDataLookupsSeeded()
    → ensurePlatformSeeded()
    → ensureStockCardsSeeded()
    → ensureProductCardsSeeded()
    → ensureSalesOrdersSeeded()
    → ensureMrpRunsSeeded()
        → seedFromSalesOrders()
        → persistRunMrp()
        → ensurePurchasingSeeded()
    → ensureUserAccountsSeeded()
    → wirePersistenceRuntime()
```

## Idempotency Audit — 9/9 PASS

| Check | Result |
|-------|--------|
| Same UoW instance on re-bootstrap | PASS |
| Store counts unchanged on 2nd/3rd bootstrap | PASS |
| Sales orders seeded | PASS |
| Product cards seeded | PASS |
| MRP runs seeded | PASS |
| Purchase requests seeded | PASS |
| Purchase orders seeded | PASS |
| User accounts seeded | PASS |
| Lifecycle seed `mrp` context field | PASS |

## Persistence Registry

| Check | Result |
|-------|--------|
| Single `registerUnitOfWorkFactory` per boot | PASS |
| `requireUnitOfWork()` returns same instance | PASS |

## Seed Context Integrity

| Path | Required Field | Status |
|------|----------------|--------|
| `lifecycle-seed` → `buildSnapshotsFromContext` | `mrp` | PASS |
| `mrp-seed` → `seedFromSalesOrders` | full SalesOrder from repo | PASS |
| `purchasing-seed` | sales order MRP lines | PASS (after order fix) |

## Fix Applied

**Root cause:** `ensurePurchasingSeeded()` was called in `bootstrap.ts` before MRP ran. Empty purchasing arrays were written and `seeded=true` blocked re-seed after MRP. Seed filter also excluded `Hesaplandı` lines (all generated seed lines).

**Fix:** Purchasing seed moved to end of `ensureMrpRunsSeeded()`. Filter includes `Hesaplandı` for demo chain population.

## Circular Import Scan

```
madge --circular providers.tsx bootstrap.ts
→ No circular dependency found
```

## Summary

| Area | Score |
|------|-------|
| Bootstrap completes | PASS |
| Idempotent seeds | PASS |
| Registry single-init | PASS |
| Context completeness | PASS |
| Purchasing seed population | PASS |
| Full route regression | INCOMPLETE (audit tooling only) |
