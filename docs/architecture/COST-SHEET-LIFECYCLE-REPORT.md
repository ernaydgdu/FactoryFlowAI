# Cost Sheet Lifecycle Report — Phase 2 Module 3

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
| Draft | Kalem düzenle, BOM'dan Hesapla, İncelemeye Gönder |
| Under Review | Kalem düzenle, Onayla (dialog), Taslak'a döndür |
| Approved | Revizyon oluştur (dialog), Revizyonu aktive et |
| Active | Revizyon oluştur (dialog), Arşivle |
| Archived | Read-only |

Editable statuses: `Draft`, `Under Review` (`isCostSheetEditable`).

## Revision Model

- **Snapshot:** `costSheet.revisionHistory[]` — append-only `CostSheetRevisionSnapshot`
- **Platform revision:** `entityRevisions` with `entityType: 'CostSheet'`
- **Immutable rule:** prior revision records cannot be mutated after activation
- **Single active:** `activeRevisionRecordId` tracks current active revision

## BOM Integration

When BOM lines change and cost sheet is editable, `syncCostSheetAfterBomChange` recalculates BOM-derived lines (non-manual-override). Manual overrides preserved.

## Domain Guarantees

- Transition guard: `isCostSheetTransitionAllowed` (`CS-01` … `CS-04`)
- Optimistic lock: `expectedVersion` on all Product Card writes
- Audit + timeline + outbox on every persist
- Outbox event: `scheduleCostSheetChange`

## Dialogs

- **Approval:** `CostSheetApprovalDialog` → `executeApproveCostSheet`
- **Revision:** `CostSheetRevisionDialog` → `executeCreateRevision`

## Seed Data Note

Seeded product cards ship with cost sheet status `Active`. To edit amounts in UI, create a new revision from Active state.
