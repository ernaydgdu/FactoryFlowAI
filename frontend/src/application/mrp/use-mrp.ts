import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { mrpApplicationService } from './mrp.application-service'

export function useMrpList() {
  return useQuery({ queryKey: applicationQueryKeys.mrp.list(), queryFn: mrpApplicationService.getList })
}

export function useMrpKpis() {
  return useQuery({ queryKey: applicationQueryKeys.mrp.kpis(), queryFn: mrpApplicationService.getKpis })
}
