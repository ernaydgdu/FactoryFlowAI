# Technical Debt Report — Sprint 6C

**Sprint:** 6C — Persistence Constitution Runtime  
**Generated:** 2026-08-02

---

## 1. Kapatılan Borç (Bu Sprint)

| ID | Borç | Durum |
|----|------|-------|
| TD-RTX-01 | UoW begin/commit/rollback no-op | ✅ CLOSED |
| TD-RTX-02 | Outbox enqueue hiç çağrılmıyor | ✅ CLOSED |
| TD-RTX-03 | Sync subscribe handlers | ✅ CLOSED |
| TD-RTX-04 | notifyWatchers command path | ✅ CLOSED |
| TD-RTX-05 | rebuildWipIndex command path | ✅ CLOSED |
| TD-RTX-06 | MD brain direct publish | ✅ CLOSED |

---

## 2. Açık Borç (Sonraki Sprintler)

| ID | Borç | Öncelik | Hedef Sprint |
|----|------|---------|--------------|
| TD-PG-01 | PostgreSQL adapter | P0 | Sprint 7 |
| TD-DATA-01 | `domain/data/` → Repository Port | P0 | Sprint 9 |
| TD-TX-02 | Singleton repo TX snapshot | P1 | Sprint 7 |
| TD-OBX-01 | Outbox handler idempotency keys | P2 | Sprint 8 |
| TD-OBX-02 | Dead letter queue UI | P3 | Sprint 9 |
| TD-EVB-01 | `event-bus.subscribe()` legacy API removal | P2 | Sprint 7 |
| TD-WIP-01 | WIP stale read without sync fallback | P2 | Monitor post-deploy |
| TD-DOM-01 | `lifecycle-service` domain/data imports | P1 | Sprint 9 |
| TD-DOM-02 | `bundle-tracking-service` domain/data imports | P1 | Sprint 8 |

---

## 3. domain/data Port Migration Planı

### P0 — Core Catalog (Sprint 9)

| Static Source | Target Port | Import Count | Domain Impact |
|---------------|-------------|--------------|---------------|
| `orders.ts` → `SALES_ORDERS`, `getSalesOrderById` | `ISalesOrderRepository` (P01) | 18 | lifecycle, bundle, business-rule |
| `products.ts` → `PRODUCT_CARDS`, `getProductById` | `IProductCardRepository` (P02) | 16 | lifecycle, bundle, cost |
| `stock-cards.ts` → `STOCK_CARDS`, `getStockCardById` | `IStockCardRepository` (P16) | 12 | stock-ledger, BOM |

### P1 — Supporting Catalog

| Static Source | Target Port | Sprint |
|---------------|-------------|--------|
| `size-sets.ts` | New `ISizeSetRepository` or MD lookup | 9 |
| `warehouses.ts` | `IWarehouseRepository` (exists) | 9 |

### P2 — Demo/UI Only (Defer)

| Static Source | Not | Sprint |
|---------------|-----|--------|
| `workflows.ts` | UI demo data — read model veya demo port | 10+ |
| `planning-demo.ts` | Dev/demo | 10+ |
| `stock-ledger-demo.ts` | Validation demo | 10+ |

### P3 — Brain/Localization (Out of PG scope)

| Static Source | Not |
|---------------|-----|
| `brain-config.ts` | Brain config port exists (P18 BrainConfig) |
| `localization-demo.ts`, `translations.ts`, `languages.ts` | Localization sprint |

---

## 4. Migration Sırası (Önerilen)

```
Sprint 7: PG adapter + TX connection scope
Sprint 8: Execution hot path (bundle domain/data cleanup)
Sprint 9: P01 SalesOrder + P02 ProductCard + P16 StockCard seed migration
Sprint 10: workflows demo → read models
```

---

## 5. Risk Notları

1. **lifecycle-service** hâlâ `SALES_ORDERS` static import ile seed yapıyor — PG cutover öncesi P01 migration şart.
2. **WIP stale reads** default async modda query anında eski read model dönebilir — UI refresh stratejisi gerekebilir.
3. **Duplicate handler mapping** domain + infra — Sprint 7'de consolidate edilmeli.

---

## 6. Sonuç

Runtime constitution borcu kapatıldı. Kalan borç PostgreSQL adapter ve catalog port migration.
