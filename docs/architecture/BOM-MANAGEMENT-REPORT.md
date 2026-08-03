# BOM Management Report — Phase 2 Module 2

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Aggregate Boundary

BOM is a **child entity** of the Product Card aggregate. All writes persist through `ProductCardInMemoryRepository.save()` — no separate BOM repository.

## Domain Write Path

| Operation | Service | Side Effects |
|-----------|---------|--------------|
| Create | `persistCreateBom` | audit, timeline, outbox |
| Update lines | `persistUpdateBom` | audit, timeline, outbox |
| Delete line | `persistDeleteBomLine` | audit, timeline, outbox |
| Submit | `persistSubmitBomForReview` | audit, timeline, outbox |
| Approve | `persistApproveBom` | audit, timeline, outbox |
| Create revision | `persistCreateBomRevision` | entity revision + snapshot |
| Activate revision | `persistActivateBomRevision` | optimistic lock, immutable prior |
| Archive | `persistArchiveBom` | audit, timeline, outbox |

All commands run inside `runCommandInTransaction` with `expectedVersion` optimistic locking.

## Application Layer

| Execute Command | Hook |
|-----------------|------|
| `executeCreateBom` | `useCreateBomMutation` |
| `executeUpdateBom` | `useUpdateBomMutation` |
| `executeApproveBom` | `useApproveBomMutation` |
| `executeCreateBomRevision` | `useCreateBomRevisionMutation` |
| `executeArchiveBom` | `useArchiveBomMutation` |
| `executeDeleteBomLine` | `useDeleteBomLineMutation` |
| `executeSubmitBomForReview` | `useSubmitBomForReviewMutation` |
| `executeActivateBomRevision` | `useActivateBomRevisionMutation` |

React Query invalidates `applicationQueryKeys.bomDesigner.*` and product card detail on every mutation success.

## UI — `/products/:id/bom`

| Feature | Component |
|---------|-----------|
| Line CRUD | `BomDesignerPage` + `BomLineDialog` |
| Material select | Stock Card repository (`queryAllStockCards`) |
| UOM / Fire % / Alternative / Notes | `BomLineDialog` |
| Version history | Versiyon Geçmişi tab |
| Approval | `BomApprovalDialog` |
| Revision | `BomRevisionDialog` |
| Compare | `BomRevisionCompare` |

## Master Data

Runtime material reads via `stock-card-query.service` → `StockCardInMemoryRepository`. `domain/data/stock-cards.ts` is seed-only proxy — no hardcoded runtime data.

## Data Flow

```
UI → use-bom-designer hooks → bom-command.mapper → runCommandInTransaction
  → bom-crud.service → productCardRepo.save + audit + timeline + outbox
Stock reads → stock-card-query.service → stockCards repo
```
