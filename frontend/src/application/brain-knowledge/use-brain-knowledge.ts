import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { brainKnowledgeApplicationService } from './brain-knowledge.application-service'

export function useManufacturingKnowledgeCoverage() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.coverage(),
    queryFn: () => brainKnowledgeApplicationService.query.coverage(),
  })
}

export function useManufacturingKnowledgeSnapshot() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.snapshot(),
    queryFn: () => brainKnowledgeApplicationService.query.snapshot(),
  })
}

export function useKnowledgeDictionary(search?: string) {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.dictionary(search ?? ''),
    queryFn: () => brainKnowledgeApplicationService.query.dictionary(search),
  })
}

export function useKnowledgeFormulae() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.formulae(),
    queryFn: () => brainKnowledgeApplicationService.query.formulae(),
  })
}

export function useKnowledgeRules() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.rules(),
    queryFn: () => brainKnowledgeApplicationService.query.rules(),
  })
}

export function useKnowledgeFlows() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.flows(),
    queryFn: () => brainKnowledgeApplicationService.query.flows(),
  })
}

export function useKnowledgeDecisions() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.decisions(),
    queryFn: () => brainKnowledgeApplicationService.query.decisions(),
  })
}

export function useKnowledgeMachines() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.machines(),
    queryFn: () => brainKnowledgeApplicationService.query.machines(),
  })
}

export function useKnowledgeKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.kpis(),
    queryFn: () => brainKnowledgeApplicationService.query.kpis(),
  })
}

export function useKnowledgeConceptNeighbors(conceptId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.brainKnowledge.neighbors(conceptId),
    queryFn: () => brainKnowledgeApplicationService.query.neighbors(conceptId),
    enabled: !!conceptId,
  })
}
