import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { workSessionApplicationService } from './work-session.application-service'
import type {
  CompleteWorkSessionCommand,
  PauseWorkSessionCommand,
  ResumeWorkSessionCommand,
  StartWorkSessionCommand,
} from './work-session.dto'

const keys = {
  all: ['execution-platform', 'work-session'] as const,
  view: (po: string, op?: string) => [...keys.all, 'view', po, op ?? ''] as const,
  list: (po: string, op?: string) => [...keys.all, 'list', po, op ?? ''] as const,
}

export function useWorkSessionView(productionOrderNo: string, operationCode?: string) {
  return useQuery({
    queryKey: keys.view(productionOrderNo, operationCode),
    queryFn: () => workSessionApplicationService.query.getView(productionOrderNo, operationCode),
    enabled: !!productionOrderNo,
  })
}

export function useWorkSessionList(productionOrderNo: string, operationCode?: string) {
  return useQuery({
    queryKey: keys.list(productionOrderNo, operationCode),
    queryFn: () => workSessionApplicationService.query.getList(productionOrderNo, operationCode),
    enabled: !!productionOrderNo,
  })
}

function useSessionMutation<TInput, TResult>(fn: (input: TInput) => TResult) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => fn(input),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: keys.all })
      void qc.invalidateQueries({ queryKey: ['execution-platform', 'operation'] })
      const po = (vars as { productionOrderNo?: string }).productionOrderNo
      if (po) {
        void qc.invalidateQueries({ queryKey: keys.view(po) })
        void qc.invalidateQueries({ queryKey: keys.list(po) })
      }
    },
  })
}

export function useStartWorkSession() {
  return useSessionMutation((input: StartWorkSessionCommand) =>
    workSessionApplicationService.command.start(input),
  )
}

export function usePauseWorkSession() {
  return useSessionMutation((input: PauseWorkSessionCommand) =>
    workSessionApplicationService.command.pause(input),
  )
}

export function useResumeWorkSession() {
  return useSessionMutation((input: ResumeWorkSessionCommand) =>
    workSessionApplicationService.command.resume(input),
  )
}

export function useCompleteWorkSession() {
  return useSessionMutation((input: CompleteWorkSessionCommand) =>
    workSessionApplicationService.command.complete(input),
  )
}

export { keys as workSessionQueryKeys }
