# Sales Order Report — Phase 3 Module 1

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Aggregate

Sales Order is an **aggregate root** with dedicated `SalesOrderInMemoryRepository`.

## Domain Write Path

| Operation | Service | Side Effects |
|-----------|---------|--------------|
| Create | `persistCreateSalesOrder` | audit, timeline, outbox, MRP |
| Update | `persistUpdateSalesOrder` | audit, timeline, outbox, MRP refresh |
| Submit | `persistSubmitSalesOrderForReview` | audit, timeline, outbox |
| Approve | `persistApproveSalesOrder` | audit, timeline, outbox |
| Activate | `persistActivateSalesOrder` | audit, timeline, outbox |
| Cancel | `persistCancelSalesOrder` | audit, timeline, outbox |
| Close | `persistCloseSalesOrder` | audit, timeline, outbox |
| Archive | `persistArchiveSalesOrder` | audit, timeline, outbox |
| Revision | `persistCreateSalesOrderRevision` | entity revision immutable |

## Application Layer

| Execute Command | Hook |
|-----------------|------|
| `executeCreateSalesOrder` | `useCreateSalesOrderMutation` |
| `executeUpdateSalesOrder` | `useUpdateSalesOrderMutation` |
| `executeApproveSalesOrder` | `useApproveSalesOrderMutation` |
| `executeCancelSalesOrder` | `useCancelSalesOrderMutation` |
| `executeCloseSalesOrder` | `useCloseSalesOrderMutation` |
| `executeArchiveSalesOrder` | `useArchiveSalesOrderMutation` |
| `executeCreateRevision` | `useCreateSalesOrderRevisionMutation` |

## Integration Chain

```
Sales Order (repository)
  → Approved Product Card (queryProductCardById, status === Approved)
  → BOM (toLegacyBomLines)
  → generateMrp (Stock Card repository)
  → Planned Cost / MRP lines
```

## UI — `/orders`

- List (repository-backed via `LIST_ORDERS` proxy)
- Create (`OrderCreatePage` — real persist, no mock)
- Edit (`OrderEditPage` — real update)
- Detail + `OrderLifecyclePanel` (cancel, close, archive, approve)
- Product tab: `useApprovedProductCardOptions` only — no PC create

## Mock Removal

- `use-order-create`: mock save removed → `toCreateCommand` + mutation
- `OrderCreatePage`: no `window.alert` mock
- `OrderEditPage`: no mock save simulation
- `orders.ts`: runtime reads via `queryAllSalesOrders()`
