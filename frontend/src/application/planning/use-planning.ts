import { useQuery } from '@tanstack/react-query'

import { planningApplicationService } from './planning.application-service'

const planningKeys = {
  sizeSets: ['planning', 'size-sets'] as const,
}

export function useSizeSetList() {
  return useQuery({
    queryKey: planningKeys.sizeSets,
    queryFn: () => planningApplicationService.getSizeSetList(),
  })
}
