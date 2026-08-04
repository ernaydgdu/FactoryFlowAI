# Technical Debt Report — Phase 3 Module 4

**Date:** 2026-08-03

## Resolved (This Module)

| ID | Item | Resolution |
|----|------|------------|
| P1 | GR does not write stock ledger | **FIXED** — `persistPostGoodsReceipt` → `persistGoodsReceiptToLedger` |
| P1 | StockMovement stream empty stub | **FIXED** — real `StockMovementInMemoryStreamRepository` |
| P1 | StockLedger in-memory stub | **FIXED** — real `StockLedgerInMemoryRepository` |
| P2 | Warehouse UI on mock STOCK_CARDS | **FIXED** — inventory mappers from repository |

## Remaining (Non-Blocking)

| Priority | Item | Notes |
|----------|------|-------|
| P3 | PostgreSQL adapters | In-memory only; ports ready for Sprint 6 |
| P3 | Production Order auto-issue | Manual issue via UI; hook for execution platform TBD |
| P3 | Reservation from MRP release | MRP releases PR/PO; auto-reserve on PO approval optional |
| P3 | `domain/data/stock-ledger-demo.ts` | Legacy demo ledger still used by brain adapter |
| P3 | Negative ADJUSTMENT opening | Engine allows negative onHand via large negative adjustment — monitor in prod |

## Seed Notes

- Opening balance from stock card `availableQty` may overlap with purchasing GR seed quantities — acceptable for demo; production seed should choose one source.

## Overall Module Verdict

**YES** — core inventory chain operational with immutable ledger.
