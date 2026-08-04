import {
  mapFinishedGoodsWarehouseOptions,
  mapWarehouseDetail,
  mapWarehouseSummaryList,
} from './warehouse-management.mapper'
import { executeFinishedGoodsReceipt } from './warehouse-management-command.mapper'

export const warehouseManagementApplicationService = {
  query: {
    summaryList: mapWarehouseSummaryList,
    detail: mapWarehouseDetail,
    finishedGoodsWarehouses: mapFinishedGoodsWarehouseOptions,
  },
  command: {
    finishedGoodsReceipt: executeFinishedGoodsReceipt,
  },
}
