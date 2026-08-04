import {
  executeApprovePurchaseOrder,
  executeArchivePurchaseOrder,
  executeCancelPurchaseOrder,
  executeClosePurchaseOrder,
  executeCreatePurchaseOrder,
  executeCreatePurchaseOrderRevision,
  executeCreatePurchaseRequest,
  executeCreateRFQ,
  executeSelectQuotation,
} from './purchasing-command.mapper'
import {
  mapPurchaseOrderDetail,
  mapPurchaseOrderList,
  mapPurchaseRequestList,
  mapPurchasingDashboard,
  mapPurchasingKpis,
  mapQuotationCompare,
  mapRfqList,
} from './purchasing.mapper'

export const purchasingApplicationService = {
  query: {
    dashboard: mapPurchasingDashboard,
    kpis: mapPurchasingKpis,
    purchaseRequests: mapPurchaseRequestList,
    purchaseOrders: mapPurchaseOrderList,
    purchaseOrderDetail: mapPurchaseOrderDetail,
    rfqs: mapRfqList,
    quotationCompare: mapQuotationCompare,
  },
  command: {
    createPurchaseRequest: executeCreatePurchaseRequest,
    createRfq: executeCreateRFQ,
    createPurchaseOrder: executeCreatePurchaseOrder,
    approvePurchaseOrder: executeApprovePurchaseOrder,
    closePurchaseOrder: executeClosePurchaseOrder,
    cancelPurchaseOrder: executeCancelPurchaseOrder,
    archivePurchaseOrder: executeArchivePurchaseOrder,
    createPurchaseOrderRevision: executeCreatePurchaseOrderRevision,
    selectQuotation: executeSelectQuotation,
  },
}
