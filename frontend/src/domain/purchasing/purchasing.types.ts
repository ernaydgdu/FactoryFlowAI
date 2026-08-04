/** Purchasing aggregate types — PR → RFQ → Quotation → PO → GR */

export type PurchaseRequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'RFQ Issued'
  | 'Quoted'
  | 'PO Created'
  | 'Cancelled'

export type PurchaseRequest = {
  id: string
  prNo: string
  mrpRunId?: string
  mrpProposalId?: string
  sourceOrderId: string
  sourceOrderNo: string
  stockCardId: string
  materialCode: string
  materialName: string
  category: string
  quantity: number
  unit: string
  requiredDate: string
  suggestedSupplier: string
  status: PurchaseRequestStatus
  createdAt: string
  createdBy: string
}

export type RfqStatus = 'Draft' | 'Sent' | 'Quoted' | 'Awarded' | 'Cancelled'

export type RequestForQuotation = {
  id: string
  rfqNo: string
  purchaseRequestIds: string[]
  supplierCodes: string[]
  dueDate: string
  status: RfqStatus
  notes: string
  createdAt: string
  createdBy: string
}

export type SupplierQuotationLine = {
  id: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  unitPrice: number
  leadTimeDays: number
}

export type SupplierQuotationStatus = 'Pending' | 'Selected' | 'Rejected'

export type SupplierQuotation = {
  id: string
  quotationNo: string
  rfqId: string
  rfqNo: string
  supplierCode: string
  supplierName: string
  quotedDate: string
  currency: string
  lines: SupplierQuotationLine[]
  totalAmount: number
  status: SupplierQuotationStatus
  createdAt: string
}

export type PurchaseOrderLifecycleStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Open'
  | 'Partially Received'
  | 'Completed'
  | 'Closed'
  | 'Cancelled'
  | 'Archived'

export type PurchaseOrderLine = {
  id: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  lot?: string
  deliveredQty: number
  remainingQty: number
}

export type PurchaseOrderRevision = {
  revisionNo: number
  status: PurchaseOrderLifecycleStatus
  changedAt: string
  changedById: string
  changeNote: string
}

export type PurchaseOrderAggregate = {
  id: string
  poNo: string
  purchaseRequestId: string
  rfqId?: string
  quotationId?: string
  sourceOrderId: string
  sourceOrderNo: string
  supplier: string
  supplierCode: string
  termin: string
  deliveryWarehouse: string
  currency: string
  lines: PurchaseOrderLine[]
  totalAmount: number
  status: PurchaseOrderLifecycleStatus
  currentRevision: PurchaseOrderRevision
  revisionHistory: PurchaseOrderRevision[]
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  createdBy: string
}

export type GoodsReceiptStatus = 'Draft' | 'Posted' | 'Cancelled'

export type GoodsReceiptLine = {
  id: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  lot?: string
}

export type GoodsReceipt = {
  id: string
  grNo: string
  purchaseOrderId: string
  poNo: string
  warehouseCode: string
  receivedAt: string
  lines: GoodsReceiptLine[]
  status: GoodsReceiptStatus
  createdAt: string
  createdBy: string
}
