import {
  commandCompleteRework,
  commandEvaluateQualityGate,
  queryCanProceed,
  queryGateEvaluations,
  queryGateForOperation,
  queryLatestGateEvaluation,
  queryQualityGateView,
} from './quality-gate.mapper'

export const qualityGateApplicationService = {
  query: {
    getView: queryQualityGateView,
    getEvaluations: queryGateEvaluations,
    getLatest: queryLatestGateEvaluation,
    getGateForOperation: queryGateForOperation,
    canProceed: queryCanProceed,
  },
  command: {
    evaluate: commandEvaluateQualityGate,
    completeRework: commandCompleteRework,
  },
}
