import { useQuery } from '@tanstack/react-query'

import { executionTimelineApplicationService } from './execution-timeline.application-service'

const keys = {
  all: ['execution-platform', 'timeline'] as const,
  timeline: (po: string) => [...keys.all, po] as const,
  catalog: () => [...keys.all, 'catalog'] as const,
  allEvents: () => [...keys.all, 'all'] as const,
}

export function useExecutionTimeline(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.timeline(productionOrderNo),
    queryFn: () => executionTimelineApplicationService.query.getTimeline(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useExecutionEventCatalog() {
  return useQuery({
    queryKey: keys.catalog(),
    queryFn: executionTimelineApplicationService.query.getEventCatalog,
    staleTime: Infinity,
  })
}

export function useAllExecutionTimelineEvents() {
  return useQuery({
    queryKey: keys.allEvents(),
    queryFn: executionTimelineApplicationService.query.getAllEvents,
  })
}

export { keys as executionTimelineQueryKeys }
