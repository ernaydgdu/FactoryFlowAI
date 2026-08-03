# MRP Scenario Report — Phase 3 Module 2

**Date:** 2026-08-03

## Scenario Coverage

### 1. Multi Sales Order — Same Product

When multiple open sales orders reference the same approved product card, `productConsolidations[]` aggregates total quantity and lists contributing order numbers. Only products with `orderCount > 1` appear.

### 2. Color / Size Planning

For each eligible sales order, the engine reads the approved product card BOM and multiplies consumption by each active color × size cell in the order matrix. Results stored in `variantDemands[]` and rolled into consolidated material lines.

### 3. Fabric Lot

For `Kumaş` category stock cards, available quantity is evaluated per lot from attributes (`lot1No`, `lot1Qty`, …). Net available per lot = qty − reserved. Grid shows lot count per material line.

### 4. Safety Stock

Each material line carries `safetyStock: { minStock, maxStock, reorderPoint }`. Net requirement adjusted when available stock falls below reorder point.

### 5. Lead Time

Each line and purchase suggestion includes `{ supplierDays, productionDays, transitDays, totalDays }` from stock card attributes with fallbacks.

### 6. Exception Messages

Structured `exceptions[]` with code, message, entityRef, severity. All seven required codes implemented in engine and explosion services.

### 7. Purchase Proposal — Supplier Groups

`snapshot.purchaseProposalGroups` aggregates pending suggestions by supplier with total quantity and earliest required date.

### 8. Production Proposal — Workshop / Line / Capacity

`snapshot.productionProposalGroups` groups by workshop + production line. Includes `capacityPerDay`, `allocatedQty`, `utilizationPercent` from master data.

### 9. MRP Snapshot Immutability

Every run/regenerate calls `freezeMrpSnapshot(structuredClone)`. Regenerate appends frozen copy of previous snapshot to `snapshotHistory`; history entries are never mutated in place.

### 10. Audit / Timeline / Outbox

All write operations (`persistRunMrp`, `persistRegenerateMrp`, `persistApproveMrp`, release commands) emit audit log, enterprise timeline entry, and `scheduleMrpChange` outbox event within transaction.

## Validation

`npm run validate:mrp` — 59 base + 18 hardening checks = **77 PASS**
