import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  MrpDomainError,
  persistApproveMrp,
  persistRegenerateMrp,
  persistReleaseProductionSuggestions,
  persistReleasePurchaseSuggestions,
  persistRunMrp,
} from '@/domain/mrp/mrp-crud.service'
import { queryMrpRunVersion } from '@/domain/mrp/mrp-query.service'
import type { MrpRun, MrpRunStatus } from '@/domain/mrp/mrp.types'

export { MrpDomainError }

export type MrpCommandResult = {
  mrpRunId: string
  runNo: string
  status: MrpRunStatus
  version: number
}

export type MrpLifecycleCommand = {
  mrpRunId: string
  expectedVersion: number
  actorUserId: string
}

export type MrpReleaseCommand = MrpLifecycleCommand & {
  suggestionIds?: string[]
}

export type RunMrpCommand = {
  actorUserId: string
}

function toResult(run: MrpRun): MrpCommandResult {
  return {
    mrpRunId: run.id,
    runNo: run.runNo,
    status: run.status,
    version: queryMrpRunVersion(run.id),
  }
}

export function executeRunMrp(command: RunMrpCommand): MrpCommandResult {
  return runCommandInTransaction(() => toResult(persistRunMrp(command.actorUserId)))
}

export function executeRegenerateMrp(command: MrpLifecycleCommand): MrpCommandResult {
  return runCommandInTransaction(() =>
    toResult(persistRegenerateMrp(command.mrpRunId, command.expectedVersion, command.actorUserId)),
  )
}

export function executeApproveMrp(command: MrpLifecycleCommand): MrpCommandResult {
  return runCommandInTransaction(() =>
    toResult(persistApproveMrp(command.mrpRunId, command.expectedVersion, command.actorUserId)),
  )
}

export function executeReleasePurchaseSuggestions(command: MrpReleaseCommand): MrpCommandResult {
  return runCommandInTransaction(() =>
    toResult(
      persistReleasePurchaseSuggestions(
        command.mrpRunId,
        command.expectedVersion,
        command.actorUserId,
        command.suggestionIds,
      ),
    ),
  )
}

export function executeReleaseProductionSuggestions(command: MrpReleaseCommand): MrpCommandResult {
  return runCommandInTransaction(() =>
    toResult(
      persistReleaseProductionSuggestions(
        command.mrpRunId,
        command.expectedVersion,
        command.actorUserId,
        command.suggestionIds,
      ),
    ),
  )
}
