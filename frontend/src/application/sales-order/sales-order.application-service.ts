import { mapSalesOrderKpis, mapSalesOrderList } from './sales-order.mapper'
import type { SalesOrderKpisDto, SalesOrderListItemDto } from './sales-order.dto'

export const salesOrderApplicationService = {
  getList(): SalesOrderListItemDto[] {
    return mapSalesOrderList()
  },
  getKpis(): SalesOrderKpisDto {
    return mapSalesOrderKpis()
  },
}
