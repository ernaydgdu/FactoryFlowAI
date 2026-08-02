/**
 * Twin Orchestrator — Digital Factory Twin & Decision Intelligence pipeline.
 * sideEffects = NONE — ERP verisini değiştirmez, karar kullanıcıya aittir.
 */
import type { BrainContext, BrainKnowledgeSnapshot } from '../../types'
import { BRAIN_TWIN_VERSION, TWIN_FINAL_DECISION_OWNER, TWIN_SIDE_EFFECTS } from '../constants'
import { buildFactoryGraph } from './factory-graph-engine'
import { buildResourceGraph } from './resource-graph-engine'
import { resolveOrderFlow } from './flow-engine'
import { detectBottlenecks } from './bottleneck-engine'
import { buildRootCauseTree } from './root-cause-engine'
import { buildDependencyGraph } from './dependency-engine'
import { generatePredictions } from './prediction-engine'
import { generateEarlyWarnings } from './early-warning-engine'
import { assessDigitalTwinHealth } from './digital-twin-health-engine'
import { suggestFromDecisionMemory } from './decision-memory-engine'
import { matchPlaybook } from './playbook-engine'
import type { DigitalTwinIntelligenceOutput } from '../types'

let twinCounter = 0

export function runDigitalTwinIntelligence(
  context: BrainContext,
  snapshot: BrainKnowledgeSnapshot,
): DigitalTwinIntelligenceOutput {
  twinCounter += 1
  const orderId = context.scope.orderId

  const factoryGraph = buildFactoryGraph(context, snapshot)
  const resourceGraph = buildResourceGraph(factoryGraph, orderId)
  const orderFlow = orderId ? resolveOrderFlow(orderId) : undefined
  const bottlenecks = detectBottlenecks(factoryGraph)

  const orderNo =
    context.scope.orderNo ??
    factoryGraph.nodes.find((n) => n.type === 'ORDER' && n.entityId === orderId)?.label

  const rootCause =
    orderNo != null ? buildRootCauseTree(orderNo, bottlenecks) : undefined

  const orderIds = factoryGraph.nodes.filter((n) => n.type === 'ORDER').map((n) => n.entityId)
  const dependencies = buildDependencyGraph(orderIds)
  const predictions = generatePredictions(factoryGraph)
  const earlyWarnings = generateEarlyWarnings(predictions)
  const twinHealth = assessDigitalTwinHealth(factoryGraph)

  void suggestFromDecisionMemory(context.companyId, 'TERMIN_MITIGATION')
  void matchPlaybook(context.companyId, 'FABRIC_DELAY')

  return {
    twinId: `twin-${twinCounter}`,
    companyId: context.companyId,
    factoryGraph,
    resourceGraph,
    orderFlow,
    bottlenecks,
    rootCause,
    dependencies,
    predictions,
    earlyWarnings,
    twinHealth,
    brainVersion: BRAIN_TWIN_VERSION,
    generatedAt: new Date().toISOString(),
    sideEffects: TWIN_SIDE_EFFECTS,
    finalDecisionOwner: TWIN_FINAL_DECISION_OWNER,
  }
}

export function assertTwinReadOnly(): void {
  if (TWIN_SIDE_EFFECTS !== 'NONE') {
    throw new Error('DIGITAL_TWIN: sideEffects must be NONE')
  }
}
