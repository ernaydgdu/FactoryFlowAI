# BOM Lifecycle Report — Phase 2 Module 2

**Date:** 2026-08-03  
**Status:** COMPLETE

## State Machine

```
Draft → Under Review → Approved → Active → Archived
         ↓ (reject)
        Draft
```

## UI Actions by Status

| Status | Actions |
|--------|---------|
| Draft | Satır ekle/düzenle/sil, İncelemeye Gönder |
| Under Review | Satır düzenle, Onayla (dialog), Taslak'a döndür |
| Approved | Revizyon oluştur (dialog), Revizyonu aktive et |
| Active | Revizyon oluştur (dialog), Arşivle |
| Archived | Read-only |

Editable statuses: `Draft`, `Under Review` (`isBomEditable`).

## Revision Model

- **Snapshot:** `bom.revisionHistory[]` — append-only `BomRevisionSnapshot`
- **Platform revision:** `entityRevisions` with `entityType: 'BOM'`
- **Immutable rule:** prior revision records cannot be mutated after activation
- **Active pointer:** `bom.activeRevisionRecordId` tracks current active revision

## Domain Guarantees

- Transition guard: `isBomTransitionAllowed` (`BOM-01` … `BOM-04`)
- Optimistic lock: `expectedVersion` on all Product Card writes
- Audit + timeline + outbox on every persist
- Outbox event: `scheduleBomChange`

## Dialogs

- **Approval:** `BomApprovalDialog` → `executeApproveBom`
- **Revision:** `BomRevisionDialog` → `executeCreateBomRevision`
- **Compare:** `BomRevisionCompare` — side-by-side line diff between revisions

## Seed Data Note

Seeded product cards ship with BOM status `Active`. To edit lines in UI, create a new revision from Active state or use a Draft card created via Product Card CRUD.
