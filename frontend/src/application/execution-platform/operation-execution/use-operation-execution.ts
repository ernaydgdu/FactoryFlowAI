import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { operationExecutionApplicationService } from './operation-execution.application-service'
import type {
  CompleteOperationCommand,
  PauseOperationCommand,
  StartOperationCommand,
} from './operation-execution.dto'
import type { OperationActorCommand } from './operation-execution.dto'

const keys = {
  all: ['execution-platform', 'operation'] as const,
  view: (po: string, op?: string) => [...keys.all, 'view', po, op ?? ''] as const,
  list: (po: string) => [...keys.all, 'list', po] as const,
}

export function useOperationExecutionView(productionOrderNo: string, focusOperationCode?: string) {
  return useQuery({
    queryKey: keys.view(productionOrderNo, focusOperationCode),
    queryFn: () => operationExecutionApplicationService.query.getView(productionOrderNo, focusOperationCode),
    enabled: !!productionOrderNo,
  })
}

export function useOperationExecutionList(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.list(productionOrderNo),
    queryFn: () => operationExecutionApplicationService.query.getList(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

function useOpMutation<TInput, TResult>(fn: (input: TInput) => TResult) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => fn(input),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: keys.all })
      void qc.invalidateQueries({ queryKey: ['execution-platform', 'work-session'] })
      const po = (vars as { productionOrderNo?: string }).productionOrderNo
      if (po) void qc.invalidateQueries({ queryKey: keys.list(po) })
    },
  })
}

export function useStartOperation() {
  return useOpMutation((input: StartOperationCommand) =>
    operationExecutionApplicationService.command.start(input),
  )
}

export function usePauseOperation() {
  return useOpMutation((input: PauseOperationCommand) =>
    operationExecutionApplicationService.command.pause(input),
  )
}

export function useResumeOperation() {
  return useOpMutation((input: OperationActorCommand) =>
    operationExecutionApplicationService.command.resume(input),
  )
}

export function useCompleteOperation() {
  return useOpMutation((input: CompleteOperationCommand) =>
    operationExecutionApplicationService.command.complete(input),
  )
}

export { keys as operationExecutionQueryKeys }
