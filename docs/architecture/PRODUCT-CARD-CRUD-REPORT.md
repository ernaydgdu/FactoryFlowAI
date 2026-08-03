# Product Card CRUD Report — Phase 2 Module 1

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Application Layer

| Execute Command | Hook |
|-----------------|------|
| `executeCreateProductCard` | `useCreateProductCardMutation` |
| `executeUpdateProductCard` | `useUpdateProductCardMutation` |
| `executeCreateRevision` | `useCreateProductCardRevisionMutation` |
| `executeApproveProductCard` | `useApproveProductCardMutation` |
| `executeArchiveProductCard` | `useArchiveProductCardMutation` |
| `executeDeactivateProductCard` | `useDeactivateProductCardMutation` |

All commands wrapped in `runCommandInTransaction`. List/detail/KPIs invalidate via `applicationQueryKeys.productCard.all` on every mutation success.

## UI

| Route | Component |
|-------|-----------|
| `/products` | List (repository) + Yeni Ürün Kartı |
| `/products/new` | `ProductCreatePage` |
| `/products/:id` | Detail + lifecycle panel |
| `/products/:id/edit` | `ProductEditPage` |

Dialogs: `ProductApprovalDialog`, `ProductRevisionDialog`

## Data Source

Runtime reads/writes via `ProductCardInMemoryRepository`. `domain/data/products.ts` seed-only proxy.

## Sales Order

`/orders/new` selects **Approved** product cards only — no card creation from order flow.
