import { runDigitalTwinIntelligence } from '../twin/engines/twin-orchestrator'
import { BRAIN_DISCLAIMERS, BRAIN_VERSION, KEPLER_BRAIN_COMPANY_ID } from '../constants'
import { getCompanyConfiguration } from '../data/brain-config'
import { decisionLayer } from './decision-layer'
import { knowledgeLayer } from './knowledge-layer'
import { memoryLayer } from './memory-layer'
import { reasoningLayer } from './reasoning-layer'
import { recommendationLayer } from './recommendation-layer'
import { securityLayer } from './security-layer'
import { simulationLayer } from './simulation-layer'
import type {
  BrainContext,
  BrainPipelineResult,
  BrainPipelineStage,
  SimulationScenario,
} from '../types'
import type { BrainKernelContract, BrainPipelineResultLite } from '../contracts'

let requestCounter = 0

function createRequestId(): string {
  requestCounter += 1
  return `brain-req-${requestCounter}`
}

function buildContext(
  partial: Omit<BrainContext, 'requestedAt' | 'tenantId'> & { tenantId?: string },
): BrainContext {
  return {
    ...partial,
    tenantId: partial.tenantId ?? partial.companyId,
    requestedAt: new Date().toISOString(),
  }
}

function runPipeline(
  context: BrainContext,
  stages: BrainPipelineStage[],
  simulationScenario?: SimulationScenario,
): BrainPipelineResult {
  const requestId = createRequestId()
  const completedStages: BrainPipelineStage[] = []
  const result: BrainPipelineResult = {
    requestId,
    context,
    security: { allowed: false, operationMode: context.operationMode, violations: [], tenantScoped: true, offlineCapable: true },
    configuration: getCompanyConfiguration(context.companyId),
    completedStages,
    generatedAt: new Date().toISOString(),
    offline: true,
  }

  // 1. Security
  result.security = securityLayer.authorize(context)
  completedStages.push('SECURITY')
  if (!result.security.allowed) return result

  // 2. Configuration
  result.configuration = getCompanyConfiguration(context.companyId)
  completedStages.push('CONFIGURATION')
  if (!result.configuration.enabled) return result

  // 3. Knowledge
  if (stages.includes('KNOWLEDGE') || stages.includes('REASONING')) {
    result.knowledge = knowledgeLayer.assembleSnapshot(context)
    completedStages.push('KNOWLEDGE')
  }

  // 4. Memory
  memoryLayer.getOrCreateSession(context)
  memoryLayer.recordEntry(context, {
    category: 'context',
    summary: `Brain ${context.operationMode} pipeline başlatıldı`,
    importance: 'low',
    tags: [context.operationMode, context.scope.focusArea ?? 'GENERAL'],
  })
  completedStages.push('MEMORY')

  // 5. Reasoning (Chapter 2: Knowledge Graph + Reasoning Engine)
  if (stages.includes('REASONING') && result.knowledge) {
    result.analysis = reasoningLayer.analyze(context, result.knowledge)
    if (result.analysis.reasoningOutput) {
      completedStages.push('KNOWLEDGE_GRAPH')
      completedStages.push('FACTS')
      if (result.analysis.reasoningOutput.reasoningTree.alternatives.length > 0) {
        completedStages.push('ALTERNATIVES')
      }
      completedStages.push('BRAIN_HEALTH')
    }
    memoryLayer.recordEntry(context, {
      category: 'analysis',
      summary: `${result.analysis.insights.length} insight, confidence ${result.analysis.reasoningOutput?.reasoningTree.confidence.score ?? '—'}/100`,
      importance: result.analysis.insights.some((i) => i.severity === 'CRITICAL') ? 'critical' : 'medium',
      tags: result.analysis.insights.map((i) => i.code),
    })
    completedStages.push('REASONING')
  }

  // 5b. Digital Factory Twin (Chapter 3)
  if (stages.includes('REASONING') && result.knowledge) {
    result.twinIntelligence = runDigitalTwinIntelligence(context, result.knowledge)
    completedStages.push('DIGITAL_TWIN')
  }

  // 6. Decision
  if (stages.includes('DECISION') && result.analysis) {
    result.decisionFrames = decisionLayer.buildFrames(context, result.analysis)
    completedStages.push('DECISION')
  }

  // 7. Recommendation
  if (stages.includes('RECOMMENDATION') && result.analysis) {
    const frames = result.decisionFrames ?? decisionLayer.buildFrames(context, result.analysis)
    result.decisionFrames = frames
    result.recommendations = recommendationLayer.generate(context, result.analysis, frames)
    memoryLayer.recordEntry(context, {
      category: 'recommendation',
      summary: `${result.recommendations.length} öneri üretildi`,
      importance: result.recommendations.some((r) => r.priority === 'CRITICAL') ? 'critical' : 'medium',
      tags: result.recommendations.map((r) => r.type),
    })
    completedStages.push('RECOMMENDATION')
  }

  // 8. Simulation
  if (stages.includes('SIMULATION') && result.knowledge && simulationScenario) {
    result.simulation = simulationLayer.runScenario(context, simulationScenario, result.knowledge)
    memoryLayer.recordEntry(context, {
      category: 'simulation',
      summary: `Simülasyon: ${simulationScenario.name}`,
      importance: 'medium',
      tags: ['simulation', simulationScenario.focusArea],
    })
    completedStages.push('SIMULATION')
  }

  return result
}

export const brainKernel: BrainKernelContract = {
  analyze(contextInput: BrainContext): BrainPipelineResultLite {
    const context = buildContext({ ...contextInput, operationMode: 'ANALYZE' })
    return runPipeline(context, [
      'SECURITY',
      'CONFIGURATION',
      'KNOWLEDGE',
      'MEMORY',
      'REASONING',
      'DECISION',
    ])
  },

  recommend(contextInput: BrainContext): BrainPipelineResultLite {
    const context = buildContext({ ...contextInput, operationMode: 'RECOMMEND' })
    return runPipeline(context, [
      'SECURITY',
      'CONFIGURATION',
      'KNOWLEDGE',
      'MEMORY',
      'REASONING',
      'DECISION',
      'RECOMMENDATION',
    ])
  },

  simulate(contextInput: BrainContext, scenario: SimulationScenario): BrainPipelineResultLite {
    const context = buildContext({ ...contextInput, operationMode: 'SIMULATE' })
    return runPipeline(
      context,
      ['SECURITY', 'CONFIGURATION', 'KNOWLEDGE', 'MEMORY', 'REASONING', 'SIMULATION'],
      scenario,
    )
  },
}

export function createBrainContext(input: {
  userId: string
  companyId?: string
  sessionId: string
  operationMode: BrainContext['operationMode']
  scope?: BrainContext['scope']
}): BrainContext {
  return buildContext({
    userId: input.userId,
    companyId: input.companyId ?? KEPLER_BRAIN_COMPANY_ID,
    sessionId: input.sessionId,
    operationMode: input.operationMode,
    scope: input.scope ?? { focusArea: 'GENERAL' },
  })
}

export function runBrainAnalysis(input: {
  userId: string
  companyId?: string
  sessionId: string
  orderId?: string
  focusArea?: BrainContext['scope']['focusArea']
}): BrainPipelineResult {
  const context = createBrainContext({
    ...input,
    operationMode: 'ANALYZE',
    scope: {
      orderId: input.orderId,
      focusArea: input.focusArea ?? 'ORDER_RISK',
    },
  })
  return brainKernel.analyze(context) as BrainPipelineResult
}

export function runBrainRecommendation(input: {
  userId: string
  companyId?: string
  sessionId: string
  orderId?: string
  focusArea?: BrainContext['scope']['focusArea']
}): BrainPipelineResult {
  const context = createBrainContext({
    ...input,
    operationMode: 'RECOMMEND',
    scope: {
      orderId: input.orderId,
      focusArea: input.focusArea ?? 'TERMIN',
    },
  })
  return brainKernel.recommend(context) as BrainPipelineResult
}

export { BRAIN_VERSION, BRAIN_DISCLAIMERS, KEPLER_BRAIN_COMPANY_ID }
