# MRP Hardening Report — Phase 3 Module 2

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Tier-1 Capabilities Delivered

| # | Scenario | Implementation |
|---|----------|----------------|
| 1 | Multi Sales Order consolidation | `consolidateProductDemands()` — same productCardId across orders |
| 2 | Color / Size variant explosion | `explodeOrderVariantDemands()` — matrix × BOM per variant |
| 3 | Fabric lot evaluation | `readFabricLots()` — lot1No/lot1Qty per stock card |
| 4 | Safety Stock (Min/Max/ROP) | `readSafetyStockPolicy()` + `applySafetyStockToRequirement()` |
| 5 | Lead Time breakdown | `readLeadTimeBreakdown()` — supplier / production / transit |
| 6 | Structured exceptions | 7 codes: MISSING_BOM, MISSING_PRODUCT_CARD, NO_SUPPLIER, NEGATIVE_STOCK, LATE_PURCHASE, LATE_PRODUCTION, LOW_COVERAGE |
| 7 | Purchase proposal by supplier | `purchaseProposalGroups[]` in snapshot |
| 8 | Production proposal by workshop/line/capacity | `productionProposalGroups[]` with utilization % |
| 9 | Immutable snapshots | `freezeMrpSnapshot()` + history deep clone on regenerate |
| 10 | Audit / Timeline / Outbox | unchanged write path in `mrp-crud.service.ts` |

## New Domain Modules

- `mrp-explosion.service.ts` — variant BOM explosion + product consolidation
- `mrp-stock-policy.service.ts` — safety stock, lead times, fabric lots
- `mrp-snapshot.service.ts` — immutable snapshot helper

## Stock Card Seed

Fabric and accessory cards now include `minStock`, `maxStock`, `reorderPoint`, lead time attributes, and fabric lot breakdowns.

## UI — `/planning/mrp`

- Product consolidation panel
- Supplier-grouped purchase proposals
- Workshop/line/capacity production groups
- Structured exception codes in grid
- ROP, lead time (S/P/T), lot count, variant count columns
