# Warehouse Report — Phase 3 Module 4

**Date:** 2026-08-03  
**Verdict:** YES

## Warehouse Types Supported

Master-data warehouse hierarchy supports:

- Raw Material Warehouse (Kumaş)
- Accessory Warehouse (Aksesuar)
- Semi Finished / Atölye depoları
- Finished Goods Warehouse (Mamül)
- Scrap / Fire depoları (via hierarchy groups)
- Sample Warehouse
- Transit Warehouse

Operational ledgers are keyed by `warehouseCode` — one `PersistedStockLedger` per warehouse.

## UI Routes

| Page | Route |
|------|-------|
| Warehouse Dashboard | `/warehouse` |
| Goods Receipt | `/warehouse/inbound` |
| Goods Issue | `/warehouse/outbound` |
| Transfer | `/warehouse/transfer` |
| Reservation | `/warehouse/reservation` |
| Cycle Count | `/warehouse/count` |

## Data Source

Warehouse pages read from repository-backed inventory mappers — no `STOCK_CARDS` mock.

`warehouse.mapper.ts` delegates inbound/outbound/count to `inventory.mapper.ts`.

## Commands

- `executeGoodsReceipt` — PO → GR → ledger
- `executeGoodsIssue` — production consumption
- `executeTransfer` — inter-warehouse
- `executeReservation` — allocate for production order
- `executeCycleCount` — count variance adjustment

## Validation

All warehouse UI wired to React Query hooks with invalidation on mutation success.
