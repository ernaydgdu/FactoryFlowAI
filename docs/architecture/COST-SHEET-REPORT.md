# Cost Sheet Report — Phase 2 Module 3

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Aggregate Boundary

Planned Cost Sheet is a **child entity** of the Product Card aggregate. All writes persist through `ProductCardInMemoryRepository.save()` — no separate Cost Sheet repository.

## Domain Write Path

| Operation | Service | Side Effects |
|-----------|---------|--------------|
| Create | `persistCreateCostSheet` | audit, timeline, outbox |
| Update lines | `persistUpdateCostSheet` | audit, timeline, outbox |
| Submit | `persistSubmitCostSheetForReview` | audit, timeline, outbox |
| Approve | `persistApproveCostSheet` | audit, timeline, outbox |
| Create revision | `persistCreateCostSheetRevision` | entity revision + snapshot |
| Activate revision | `persistActivateCostSheetRevision` | optimistic lock, immutable prior |
| Archive | `persistArchiveCostSheet` | audit, timeline, outbox |
| BOM recalc | `syncCostSheetAfterBomChange` | triggered on BOM writes |

## Cost Items (14)

Kumaş, Aksesuar, İplik, Baskı, Nakış, Yıkama, Kesim, Dikim, Ütü, Paketleme, Fire, Lojistik, Genel Gider, Kar Marjı

BOM-derived: fabric, accessory, thread, packaging, waste — calculated from Stock Card `attributes.unitPrice`.

## Application Layer

| Execute Command | Hook |
|-----------------|------|
| `executeCreateCostSheet` | `useCreateCostSheetMutation` |
| `executeUpdateCostSheet` | `useUpdateCostSheetMutation` |
| `executeApproveCostSheet` | `useApproveCostSheetMutation` |
| `executeCreateRevision` | `useCreateCostSheetRevisionMutation` |
| `executeArchiveCostSheet` | `useArchiveCostSheetMutation` |
| `executeActivateCostSheetRevision` | `useActivateCostSheetRevisionMutation` |
| `executeRecalculatePlannedCost` | `useRecalculatePlannedCostMutation` |

## UI — `/products/:id/cost-sheet`

Planned Cost tab, Maliyet Kırılımı, Versiyon Geçmişi, Variance Preview, Approval & Revision dialogs.

## Integration Chain

```
Product Card (repository)
  └── bom → Stock Card unit prices → costSheet planned amounts
```

BOM CRUD calls `syncCostSheetAfterBomChange` on every persist when cost sheet is editable.

## Data Flow

```
UI → use-cost-sheet-designer → cost-sheet-command.mapper → runCommandInTransaction
  → cost-sheet-crud.service → productCardRepo.save + audit + timeline + outbox
BOM change → bom-crud.service → syncCostSheetAfterBomChange
Stock prices → stock-card-query.service → getStockUnitPrice
```
