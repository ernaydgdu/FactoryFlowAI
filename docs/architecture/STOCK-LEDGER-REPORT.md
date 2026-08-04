# Stock Ledger Report — Phase 3 Module 4

**Date:** 2026-08-03  
**Verdict:** YES

## Architecture

Stock Ledger is the single source of truth (FOUNDATION.md / BR-10). Stok doğrudan değiştirilmez — her değişiklik immutable movement kaydı üretir.

## Movement Types Implemented

| Type | Use Case |
|------|----------|
| RECEIPT | Goods Receipt / PO inbound |
| CONSUMPTION | Goods Issue / production pull |
| TRANSFER_OUT | Transfer source |
| TRANSFER_IN | Transfer destination |
| RESERVATION | Allocate stock |
| RESERVATION_RELEASE | Unallocate |
| ADJUSTMENT | Manual correction / cycle count / opening balance |
| PRODUCTION_OUTPUT | Engine-ready |
| SHIPMENT | Engine-ready |
| WASTE | Engine-ready |

## Persistence

| Port | Implementation |
|------|----------------|
| P14 `IStockLedgerRepository` | `stock-ledger.in-memory.repository.ts` |
| P15 `IStockMovementStreamRepository` | `stock-movement.in-memory.stream.repository.ts` |

## Immutability

- Movements append-only via `stockMovements.append()`
- Ledger aggregate stores current balances + `lastMovementNo`
- Each movement records `onHandAfter` and `reservedAfter`
- BR-10 integrity rules preserved via `recordPersistedMovement` (same logic as `recordMovement`)

## Reference Types

ORDER, MRP, PR, PO, PRODUCTION, TRANSFER, SHIPMENT — linked on every movement.

## UI

`/inventory/ledger` — full movement list from repository stream.
