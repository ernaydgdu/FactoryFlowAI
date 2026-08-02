import { useQuery } from '@tanstack/react-query'

import { executionCalendarApplicationService } from './execution-calendar.application-service'

const keys = {
  all: ['execution-platform', 'calendar'] as const,
  calendar: (po?: string) => [...keys.all, po ?? 'global'] as const,
}

export function useExecutionCalendar(productionOrderNo?: string) {
  return useQuery({
    queryKey: keys.calendar(productionOrderNo),
    queryFn: () => executionCalendarApplicationService.query.getCalendar(productionOrderNo),
  })
}

export { keys as executionCalendarQueryKeys }
