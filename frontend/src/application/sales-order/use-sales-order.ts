import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { salesOrderApplicationService } from './sales-order.application-service'

export function useSalesOrderList() {
  return useQuery({
    queryKey: applicationQueryKeys.salesOrder.list(),
    queryFn: () => salesOrderApplicationService.getList(),
  })
}

export function useSalesOrderKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.salesOrder.kpis(),
    queryFn: () => salesOrderApplicationService.getKpis(),
  })
}
