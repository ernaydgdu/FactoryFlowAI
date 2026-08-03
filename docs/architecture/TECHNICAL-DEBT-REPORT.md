# Technical Debt Report

**Updated:** 2026-08-03 — Phase 3 Module 3 Purchasing

## Resolved in Purchasing Module

- Mock `PURCHASE_REQUISITIONS` / `PURCHASE_ORDERS` removed from UI
- Full PR → RFQ → Quotation → PO → GR repository chain
- MRP release creates Purchase Request (not direct PO)
- PO lifecycle with approve/close/cancel/archive/revision
- `schedulePurchasingChange` outbox integration
- `validate:purchasing` build gate (61/61)

## Resolved in MRP Hardening (prior)

- Variant-level BOM explosion, safety stock, grouped proposals, immutable snapshots

## Remaining Debt

| Item | Priority | Notes |
|------|----------|-------|
| PostgreSQL adapters for Purchasing aggregates | P1 | In-memory only (PR, RFQ, Quotation, PO, GR) |
| Stock ledger repository write on GR post | P1 | GR updates PO lines; stock movement stream still empty adapter |
| Legacy `workflows.ts` PURCHASE_* lazy generators | P2 | Dashboard widgets may still use legacy proxy |
| Quotation price entry UI (submit prices) | P2 | Domain `persistSubmitQuotationPrices` exists, no UI form |
| Multi-PR RFQ PO consolidation | P2 | Single PR per PO create path |
| Store snapshot TX rollback for purchasing stores | P3 | Pre-existing gap |
| MRP run history UI | P3 | History stored, UI shows latest only |

## Build Gate

`npm run build` — PASS (includes `validate:purchasing` 61/61, `validate:mrp` 81/81)
