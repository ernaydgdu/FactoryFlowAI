# Product Card Lifecycle Report — Phase 2 Module 1

**Date:** 2026-08-03  
**Status:** COMPLETE

## State Machine

```
Draft → Under Review → Approved → In Production → Closed → Archived
```

## UI Actions by Status

| Status | Actions |
|--------|---------|
| Draft | İncelemeye Gönder, Onayla (dialog), Düzenle |
| Under Review | Onayla (dialog), Düzenle |
| Approved | Üretime Al, Revizyon (dialog), Deaktive Et |
| In Production | Deaktive Et |
| Closed | Arşivle, Revizyon (dialog) |
| Archived | Read-only |

## Domain Guarantees

- Transition guard: `isProductCardTransitionAllowed`
- Optimistic lock: `expectedVersion` on all writes
- Revision immutability: `revisionHistory` append-only
- Single active revision via `currentRevision`
- Audit + timeline + outbox on every persist

## Dialogs

- **Approval:** `ProductApprovalDialog` → `executeApproveProductCard`
- **Revision:** `ProductRevisionDialog` → `executeCreateRevision`
