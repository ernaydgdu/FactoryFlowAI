import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { bomDesignerApplicationService } from './bom-designer.application-service'

export function useBomDesigner(productId: string, orderQty?: number) {
  return useQuery({
    queryKey: [...applicationQueryKeys.bomDesigner.byProduct(productId), orderQty ?? 1000],
    queryFn: () => bomDesignerApplicationService.getByProduct(productId, orderQty),
    enabled: !!productId,
  })
}
