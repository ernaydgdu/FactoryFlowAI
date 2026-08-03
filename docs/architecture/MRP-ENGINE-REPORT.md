# MRP Engine Report — Phase 3 Module 2

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Aggregate

`MrpRun` is an **aggregate root** with immutable snapshot revisions stored in `MrpRunInMemoryRepository`.

## Planning Chain

```
Sales Order (repository)
  → BOM explosion (order.mrp.lines)
  → Stock Card (availableQty, reserved)
  → Open Purchase Orders (remainingQty)
  → Open Production Orders (BOM × remaining qty)
  → Net Shortage
  → Purchase / Production Proposals
```

## Domain Write Path

| Operation | Service | Side Effects |
|-----------|---------|--------------|
| Run | `persistRunMrp` | audit, timeline, outbox, revision |
| Regenerate | `persistRegenerateMrp` | immutable snapshot history, audit, outbox |
| Approve | `persistApproveMrp` | audit, timeline, outbox |
| Release Purchase | `persistReleasePurchaseSuggestions` | PO repository, audit, outbox |
| Release Production | `persistReleaseProductionSuggestions` | Production Order lifecycle, audit, outbox |

## Application Layer

| Execute Command | Hook |
|-----------------|------|
| `executeRunMrp` | `useRunMrpMutation` |
| `executeRegenerateMrp` | `useRegenerateMrpMutation` |
| `executeApproveMrp` | `useApproveMrpMutation` |
| `executeReleasePurchaseSuggestions` | `useReleasePurchaseSuggestionsMutation` |
| `executeReleaseProductionSuggestions` | `useReleaseProductionSuggestionsMutation` |

## UI — `/planning/mrp`

- MRP Dashboard with KPIs
- MRP Result Grid (gross, net, stock, reserved, open PO/UE, shortage)
- Material Shortage panel
- Purchase / Production Suggestions
- Inventory Coverage bar
- Exception Messages
- Action bar: Run, Regenerate, Approve, Release SAT/UE

## Integration

- `PurchaseOrderInMemoryRepository` — real adapter (replaces empty stub)
- `production-order-query.service` — open UE for netting
- `purchase-order-query.service` — open SAT for netting
- Bootstrap: PO seed → production seed → initial MRP run
