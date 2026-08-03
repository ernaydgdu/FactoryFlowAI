# Purchase Order Lifecycle Report — Phase 3 Module 3

**Date:** 2026-08-03  
**Status:** COMPLETE

## State Machine

```
Draft → Under Review → Approved → Open → Partially Received → Completed → Closed → Archived
         ↓ cancel       ↓ cancel    ↓ cancel   ↓ cancel
       Cancelled      Cancelled   Cancelled  Cancelled
```

Direct transitions also allowed:
- Open → Completed (full receipt)
- Open → Partially Received (partial GR)

## UI Actions by Status

| Status | Actions |
|--------|---------|
| Draft | Onayla (via submit+approve), İptal, Revizyon (from Open/Closed) |
| Under Review | Onayla, İptal |
| Approved | — (auto-opens on approve) |
| Open | Kapat, İptal, Revizyon, Mal Kabul |
| Partially Received | Kapat, İptal |
| Completed | Kapat |
| Closed | Arşivle, Revizyon |
| Cancelled | Arşivle |
| Archived | Read-only |

Editable: `Draft`, `Under Review`

## Business Rules (unchanged IDs)

- **PO-01-SUBMIT:** Draft → Under Review
- **PO-02-APPROVE:** Under Review → Approved
- **PO-03-OPEN:** Approved → Open (chained on approve)
- **PO-04-RECEIVE:** Open → Partially Received (via GR)
- **PO-05-COMPLETE:** Partial/Full → Completed
- **PO-06-CLOSE:** Completed → Closed
- **PO-07-ARCHIVE:** Closed → Archived
- **PO-08-CANCEL:** Draft/Review/Approved/Open → Cancelled

## Domain Guarantees

- Transition guard: `isPurchaseOrderTransitionAllowed`
- Optimistic lock: `expectedVersion`
- Revision immutable via `createRevision('PurchaseOrder')` + `revisionHistory` append-only
- Audit + timeline + `schedulePurchasingChange` on every persist

## Component

`PurchaseOrderLifecyclePanel` on PO detail — Onayla, İptal, Kapat, Arşivle, Revizyon
