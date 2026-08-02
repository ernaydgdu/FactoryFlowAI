import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qualityGateApplicationService } from './quality-gate.application-service'
import type { CompleteReworkCommand, EvaluateQualityGateCommand } from './quality-gate.dto'

const keys = {
  all: ['execution-platform', 'quality-gate'] as const,
  view: (po: string) => [...keys.all, 'view', po] as const,
  evaluations: (po: string) => [...keys.all, 'evaluations', po] as const,
  canProceed: (po: string, op: string) => [...keys.all, 'can-proceed', po, op] as const,
}

export function useQualityGateView(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.view(productionOrderNo),
    queryFn: () => qualityGateApplicationService.query.getView(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useQualityGateEvaluations(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.evaluations(productionOrderNo),
    queryFn: () => qualityGateApplicationService.query.getEvaluations(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useCanProceedToOperation(productionOrderNo: string, targetOperationCode: string) {
  return useQuery({
    queryKey: keys.canProceed(productionOrderNo, targetOperationCode),
    queryFn: () =>
      qualityGateApplicationService.query.canProceed({ productionOrderNo, targetOperationCode }),
    enabled: !!productionOrderNo && !!targetOperationCode,
  })
}

export function useEvaluateQualityGate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EvaluateQualityGateCommand) =>
      qualityGateApplicationService.command.evaluate(input),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: keys.view(vars.productionOrderNo) })
      void qc.invalidateQueries({ queryKey: ['execution-platform'] })
    },
  })
}

export function useCompleteQualityRework() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompleteReworkCommand) =>
      qualityGateApplicationService.command.completeRework(input),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: keys.view(vars.productionOrderNo) })
    },
  })
}

export { keys as qualityGateQueryKeys }
