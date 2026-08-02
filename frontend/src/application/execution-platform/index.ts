/**
 * Execution Platform — root application facade
 * UI yalnızca bu servis ve modül hook'larını çağırır.
 */
import { bundleManagementApplicationService } from './bundle-management/bundle-management.application-service'
import { dailyProductionEntryApplicationService } from './daily-production-entry/daily-production-entry.application-service'
import { executionBrainApplicationService } from './execution-brain/execution-brain.application-service'
import { executionCalendarApplicationService } from './execution-calendar/execution-calendar.application-service'
import { executionDashboardApplicationService } from './dashboard/dashboard.application-service'
import { executionTimelineApplicationService } from './execution-timeline/execution-timeline.application-service'
import { operationExecutionApplicationService } from './operation-execution/operation-execution.application-service'
import { qualityGateApplicationService } from './quality-gate/quality-gate.application-service'
import { splitProductionApplicationService } from './split-production/split-production.application-service'
import { wipMonitoringApplicationService } from './wip-monitoring/wip-monitoring.application-service'
import { workSessionApplicationService } from './work-session/work-session.application-service'
import { getFullExecutionState } from '@/domain/execution-platform/execution-platform-service'

export const executionPlatformApplicationService = {
  dashboard: executionDashboardApplicationService,
  bundleManagement: bundleManagementApplicationService,
  operationExecution: operationExecutionApplicationService,
  workSession: workSessionApplicationService,
  dailyProductionEntry: dailyProductionEntryApplicationService,
  wipMonitoring: wipMonitoringApplicationService,
  qualityGate: qualityGateApplicationService,
  timeline: executionTimelineApplicationService,
  splitProduction: splitProductionApplicationService,
  calendar: executionCalendarApplicationService,
  brain: executionBrainApplicationService,
  queryFullState: getFullExecutionState,
}

export * from './dashboard/dashboard.dto'
export * from './dashboard/use-dashboard'
export * from './bundle-management/bundle-management.dto'
export * from './bundle-management/use-bundle-management'
export * from './operation-execution/operation-execution.dto'
export * from './operation-execution/use-operation-execution'
export * from './work-session/work-session.dto'
export * from './work-session/use-work-session'
export * from './daily-production-entry/daily-production-entry.dto'
export * from './daily-production-entry/use-daily-production-entry'
export * from './wip-monitoring/wip-monitoring.dto'
export * from './wip-monitoring/use-wip-monitoring'
export * from './quality-gate/quality-gate.dto'
export * from './quality-gate/use-quality-gate'
export * from './execution-timeline/execution-timeline.dto'
export * from './execution-timeline/use-execution-timeline'
export * from './split-production/split-production.dto'
export * from './split-production/use-split-production'
export * from './execution-calendar/execution-calendar.dto'
export * from './execution-calendar/use-execution-calendar'
export * from './execution-brain/execution-brain.dto'
export * from './execution-brain/use-execution-brain'
export * from './shared/execution-permission.guard'
