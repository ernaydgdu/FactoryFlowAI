import { useQuery } from '@tanstack/react-query'

import { productionPlanningApplicationService } from './production-planning.application-service'

const ppKeys = {
  all: ['production-planning'] as const,
  dashboard: () => [...ppKeys.all, 'dashboard'] as const,
  calendar: () => [...ppKeys.all, 'calendar'] as const,
  orders: () => [...ppKeys.all, 'orders'] as const,
  order: (id: string) => [...ppKeys.all, 'order', id] as const,
  schedule: () => [...ppKeys.all, 'schedule'] as const,
  capacity: () => [...ppKeys.all, 'capacity'] as const,
  workshops: () => [...ppKeys.all, 'workshops'] as const,
  lines: () => [...ppKeys.all, 'lines'] as const,
  daily: () => [...ppKeys.all, 'daily'] as const,
  operations: () => [...ppKeys.all, 'operations'] as const,
  timeline: (orderId?: string) => [...ppKeys.all, 'timeline', orderId ?? 'all'] as const,
}

export function useProductionPlanningDashboard() {
  return useQuery({ queryKey: ppKeys.dashboard(), queryFn: productionPlanningApplicationService.getDashboard, staleTime: 60_000 })
}

export function useProductionCalendar() {
  return useQuery({ queryKey: ppKeys.calendar(), queryFn: productionPlanningApplicationService.getCalendar })
}

export function useProductionPlanningOrders() {
  return useQuery({ queryKey: ppKeys.orders(), queryFn: productionPlanningApplicationService.getOrders })
}

export function useProductionPlanningOrder(id: string) {
  return useQuery({ queryKey: ppKeys.order(id), queryFn: () => productionPlanningApplicationService.getOrderById(id), enabled: !!id })
}

export function useProductionSchedule() {
  return useQuery({ queryKey: ppKeys.schedule(), queryFn: productionPlanningApplicationService.getSchedule })
}

export function useCapacityPlanning() {
  return useQuery({
    queryKey: ppKeys.capacity(),
    queryFn: () => ({
      workshops: productionPlanningApplicationService.getCapacityWorkshops(),
      lines: productionPlanningApplicationService.getCapacityLines(),
      machines: productionPlanningApplicationService.getCapacityMachines(),
      operators: productionPlanningApplicationService.getCapacityOperators(),
    }),
  })
}

export function useWorkshopPlanning() {
  return useQuery({ queryKey: ppKeys.workshops(), queryFn: productionPlanningApplicationService.getWorkshopPlans })
}

export function useLinePlanning() {
  return useQuery({ queryKey: ppKeys.lines(), queryFn: productionPlanningApplicationService.getLinePlans })
}

export function useDailyProductionEntry() {
  return useQuery({ queryKey: ppKeys.daily(), queryFn: productionPlanningApplicationService.getDailyEntries })
}

export function useProductionOperationTracking() {
  return useQuery({ queryKey: ppKeys.operations(), queryFn: productionPlanningApplicationService.getOperationTracking })
}

export function useProductionPlanningTimeline(orderId?: string) {
  return useQuery({
    queryKey: ppKeys.timeline(orderId),
    queryFn: () => productionPlanningApplicationService.getTimeline(orderId),
  })
}
