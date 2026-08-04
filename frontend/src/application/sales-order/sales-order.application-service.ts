import {
  executeApproveSalesOrder,
  executeArchiveSalesOrder,
  executeCancelSalesOrder,
  executeCloseSalesOrder,
  executeCreateRevision,
  executeCreateSalesOrder,
  executeUpdateSalesOrder,
} from './sales-order-command.mapper'
import { mapListOrdersForTable, mapSalesOrderDetail, mapSalesOrderKpis, mapSalesOrderList } from './sales-order.mapper'

export const salesOrderApplicationService = {
  query: {
    list: mapSalesOrderList,
    kpis: mapSalesOrderKpis,
    detail: mapSalesOrderDetail,
    listOrders: mapListOrdersForTable,
  },
  command: {
    create: executeCreateSalesOrder,
    update: executeUpdateSalesOrder,
    approve: executeApproveSalesOrder,
    cancel: executeCancelSalesOrder,
    close: executeCloseSalesOrder,
    archive: executeArchiveSalesOrder,
    createRevision: executeCreateRevision,
  },
}
