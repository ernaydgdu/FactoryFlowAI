import { runDigitalTwinIntelligence } from '../twin/engines/twin-orchestrator'
import { createTwinScenario, runTwinScenario } from '../twin/engines/scenario-engine'
import { analyzeMaterialDelayImpact } from '../twin/engines/impact-engine'
import { knowledgeLayer } from '../services/knowledge-layer'
import { createBrainContext } from '../services/brain-kernel'
import { KEPLER_BRAIN_COMPANY_ID } from '../constants'

export function runBrainChapter3Demo() {
  const context = createBrainContext({
    userId: 'user-planner-001',
    companyId: KEPLER_BRAIN_COMPANY_ID,
    sessionId: 'brain-ch3-demo',
    operationMode: 'ANALYZE',
    scope: { orderId: '1', focusArea: 'TERMIN' },
  })

  const snapshot = knowledgeLayer.assembleSnapshot(context)
  const twin = runDigitalTwinIntelligence(context, snapshot)

  const fabricScenario = createTwinScenario('FABRIC_REJECTED', { lotId: 'LOT-2026-15' })
  const scenarioResult = runTwinScenario(fabricScenario, twin.factoryGraph)
  const impact = analyzeMaterialDelayImpact('LOT-2026-15', 4)

  return {
    twinVersion: twin.brainVersion,
    factoryGraphNodes: twin.factoryGraph.nodeCount,
    factoryGraphEdges: twin.factoryGraph.edgeCount,
    resourceGraphChain: twin.resourceGraph.chain.length,
    currentFlowStage: twin.orderFlow?.currentStage,
    bottleneckCount: twin.bottlenecks.length,
    primaryBottleneck: twin.bottlenecks[0]?.title,
    rootCauseDepth: twin.rootCause?.nodes.length,
    dependencyCount: twin.dependencies.edges.length,
    predictionCount: twin.predictions.length,
    earlyWarningCount: twin.earlyWarnings.length,
    twinHealthScore: twin.twinHealth.twinHealthScore,
    scenarioName: scenarioResult.scenarioName,
    impactSummary: impact.summary,
    sideEffects: twin.sideEffects,
    finalDecisionOwner: twin.finalDecisionOwner,
  }
}

export const BRAIN_CHAPTER3_DEMO = (() => {
  let cached: ReturnType<typeof runBrainChapter3Demo> | null = null
  return (): ReturnType<typeof runBrainChapter3Demo> => {
    if (!cached) cached = runBrainChapter3Demo()
    return cached
  }
})()
