# Sales Order Lifecycle Report — Phase 3 Module 1

**Date:** 2026-08-03  
**Status:** COMPLETE

## State Machine

```
Draft → Under Review → Approved → Active → Closed → Archived
         ↓ (reject)      ↓ (cancel)
        Draft          Cancelled
```

## UI Actions by Status

| Status | Actions |
|--------|---------|
| Draft | Düzenle, İncelemeye Gönder, İptal |
| Under Review | Düzenle, Onayla, İptal |
| Approved | Aktive et, İptal, Revizyon |
| Active | Kapat, Revizyon |
| Closed | Arşivle, Revizyon |
| Cancelled | Read-only |
| Archived | Read-only |

Editable: `Draft`, `Under Review`

## Business Rules

- **SO-PC-01:** Create/update requires `productCard.status === Approved`
- **SO-PC-02:** No Product Card creation from order flow
- MRP regenerated on create/update/approve from PC BOM

## Domain Guarantees

- Transition guard: `isSalesOrderTransitionAllowed`
- Optimistic lock: `expectedVersion`
- Revision immutable via `createRevision` + `revisionHistory` append-only
- Audit + timeline + outbox on every persist

## Component

`OrderLifecyclePanel` on order detail — Onayla, İptal, Kapat, Arşivle
