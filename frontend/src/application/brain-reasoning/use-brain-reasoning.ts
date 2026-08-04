import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { brainReasoningApplicationService } from './brain-reasoning.application-service'

export function useManufacturingReasoningRun() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.run(),
    queryFn: () => brainReasoningApplicationService.query.run(),
  })
}

export function useManufacturingReasoningCoverage() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.coverage(),
    queryFn: () => brainReasoningApplicationService.query.coverage(),
  })
}

export function useReasoningFacts() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.facts(),
    queryFn: () => brainReasoningApplicationService.query.facts(),
  })
}

export function useReasoningRules() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.rules(),
    queryFn: () => brainReasoningApplicationService.query.rules(),
  })
}

export function useReasoningConstraints() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.constraints(),
    queryFn: () => brainReasoningApplicationService.query.constraints(),
  })
}

export function useReasoningDecisions() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.decisions(),
    queryFn: () => brainReasoningApplicationService.query.decisions(),
  })
}

export function useReasoningRecommendations() {
  return useQuery({
    queryKey: applicationQueryKeys.brainReasoning.recommendations(),
    queryFn: () => brainReasoningApplicationService.query.recommendations(),
  })
}
