# Purchasing Report — Phase 3 Module 3

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

## Chain

```
MRP Purchase Proposal (release)
  → Purchase Request (SAT)
  → RFQ
  → Supplier Quotation
  → Purchase Order (lifecycle)
  → Goods Receipt
  → PO line delivery update
```

## Aggregates

| Aggregate | Repository | CRUD Service |
|-----------|------------|--------------|
| PurchaseRequest | `PurchaseRequestInMemoryRepository` | `purchase-request-crud.service.ts` |
| RequestForQuotation | `RfqInMemoryRepository` | `rfq-crud.service.ts` |
| SupplierQuotation | `SupplierQuotationInMemoryRepository` | `rfq-crud.service.ts` |
| PurchaseOrder | `PurchaseOrderInMemoryRepository` | `purchase-order-crud.service.ts` |
| GoodsReceipt | `GoodsReceiptInMemoryRepository` | `goods-receipt-crud.service.ts` |

## Domain Write Path

| Operation | Service | Side Effects |
|-----------|---------|--------------|
| Create PR | `persistCreatePurchaseRequest` | audit, timeline, outbox |
| MRP Release | `persistCreatePurchaseRequestFromMrpProposal` | via MRP release command |
| Create RFQ | `persistCreateRfq` | audit, timeline, outbox, quotation stubs |
| Select Quotation | `persistSelectQuotation` | audit, RFQ awarded |
| Create PO | `persistCreatePurchaseOrder` | audit, timeline, outbox, PR→PO Created |
| Approve PO | `persistApprovePurchaseOrder` | audit, timeline, outbox, Approved→Open |
| Close PO | `persistClosePurchaseOrder` | audit, timeline, outbox |
| Cancel PO | `persistCancelPurchaseOrder` | audit, timeline, outbox |
| Archive PO | `persistArchivePurchaseOrder` | audit, timeline, outbox |
| PO Revision | `persistCreatePurchaseOrderRevision` | entity revision immutable |
| Post GR | `persistPostGoodsReceipt` | audit, timeline, outbox, PO qty update |

## Application Layer

| Execute Command | Hook |
|-----------------|------|
| `executeCreatePurchaseRequest` | `useCreatePurchaseRequestMutation` |
| `executeCreateRFQ` | `useCreateRfqMutation` |
| `executeCreatePurchaseOrder` | `useCreatePurchaseOrderMutation` |
| `executeApprovePurchaseOrder` | `useApprovePurchaseOrderMutation` |
| `executeClosePurchaseOrder` | `useClosePurchaseOrderMutation` |
| `executeCancelPurchaseOrder` | `useCancelPurchaseOrderMutation` |
| `executeArchivePurchaseOrder` | `useArchivePurchaseOrderMutation` |
| `executeCreatePurchaseOrderRevision` | `useCreatePurchaseOrderRevisionMutation` |
| `executeSelectQuotation` | `useSelectQuotationMutation` |

## Integration

```
MRP release → Purchase Request (not direct PO)
Supplier master data → RFQ / PO supplier selector
PO Open → Goods Receipt → line deliveredQty / remainingQty
MRP engine → open PO qty via purchasing aggregate (Open, Partially Received, Approved)
```

## UI — `/purchasing`

- Dashboard KPIs (SAT, PO, RFQ)
- Purchase Request list + RFQ oluştur (supplier selector)
- RFQ list
- Quotation compare + select + PO create
- PO list + detail with lifecycle panel (approve, cancel, close, archive, revision)

## Mock Removal

- `PurchasingPages.tsx`: no `PURCHASE_REQUISITIONS` / `PURCHASE_ORDERS` hardcoded data
- All reads via React Query → application mapper → repository query services
