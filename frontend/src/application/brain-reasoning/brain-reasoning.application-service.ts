import {
  queryManufacturingReasoningCoverage,
  queryReasoningConstraints,
  queryReasoningDecisions,
  queryReasoningFacts,
  queryReasoningRecommendations,
  queryReasoningRuleEvaluations,
  runManufacturingReasoning,
} from '@/domain/brain/manufacturing-reasoning'

export const brainReasoningApplicationService = {
  query: {
    run: runManufacturingReasoning,
    coverage: queryManufacturingReasoningCoverage,
    facts: queryReasoningFacts,
    rules: queryReasoningRuleEvaluations,
    constraints: queryReasoningConstraints,
    decisions: queryReasoningDecisions,
    recommendations: queryReasoningRecommendations,
  },
}
