import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  PlanningDomainError,
  persistReschedulePlan,
} from '@/domain/production-planning/planning-crud.service'
import type { ReschedulePlanInput } from '@/domain/production-planning/planning.types'

export { PlanningDomainError }

export type ReschedulePlanCommand = ReschedulePlanInput & { actorUserId: string }

export type ProductionPlanningCommandResult = {
  entityId: string
  entityNo: string
  plannedStart: string
  plannedFinish: string
  lineCode: string
}

export function executeReschedulePlan(command: ReschedulePlanCommand): ProductionPlanningCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const record = persistReschedulePlan(input, actorUserId)
    return {
      entityId: record.id,
      entityNo: record.productionOrderNo,
      plannedStart: record.snapshots.planning.plannedStart,
      plannedFinish: record.plannedFinish,
      lineCode: record.productionLineCode,
    }
  })
}
