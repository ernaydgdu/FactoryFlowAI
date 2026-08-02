import type {
  BrainAnalysisResult,
  BrainConfiguration,
  BrainContext,
  BrainKnowledgeFragment,
  BrainKnowledgeSnapshot,
  BrainMemoryEntry,
  BrainRecommendation,
  BrainSecurityVerdict,
  BrainSessionMemory,
  DecisionFrame,
  SimulationResult,
  SimulationScenario,
} from '../types'

/** Knowledge Layer — ERP kaynaklarından read-only veri toplama kontratı */
export type KnowledgeLayerContract = {
  assembleSnapshot(context: BrainContext): BrainKnowledgeSnapshot
  fetchFromSource(sourceId: string, context: BrainContext): BrainKnowledgeFragment | undefined
}

/** Memory Layer — oturum ve analiz hafızası kontratı */
export type MemoryLayerContract = {
  getOrCreateSession(context: BrainContext): BrainSessionMemory
  recordEntry(context: BrainContext, entry: Omit<BrainMemoryEntry, 'id' | 'sessionId' | 'companyId' | 'timestamp'>): BrainMemoryEntry
  getSessionHistory(sessionId: string): BrainMemoryEntry[]
}

/** Reasoning Layer — deterministik analiz kontratı (LLM yok) */
export type ReasoningLayerContract = {
  analyze(context: BrainContext, snapshot: BrainKnowledgeSnapshot): BrainAnalysisResult
}

/** Decision Layer — karar çerçevesi üretimi (karar vermez) */
export type DecisionLayerContract = {
  buildFrames(context: BrainContext, analysis: BrainAnalysisResult): DecisionFrame[]
}

/** Recommendation Layer — öneri üretimi */
export type RecommendationLayerContract = {
  generate(context: BrainContext, analysis: BrainAnalysisResult, frames: DecisionFrame[]): BrainRecommendation[]
}

/** Simulation Layer — what-if projeksiyon */
export type SimulationLayerContract = {
  runScenario(context: BrainContext, scenario: SimulationScenario, snapshot: BrainKnowledgeSnapshot): SimulationResult
  createScenario(input: Omit<SimulationScenario, 'id' | 'createdAt'>): SimulationScenario
}

/** Security Layer — erişim ve operasyon doğrulama */
export type SecurityLayerContract = {
  authorize(context: BrainContext): BrainSecurityVerdict
  assertReadOnly(operation: string): void
}

/** Configuration Layer — şirket/kullanıcı Brain ayarları */
export type ConfigurationLayerContract = {
  getCompanyConfiguration(companyId: string): BrainConfiguration
  isSourceEnabled(companyId: string, sourceId: string): boolean
  isOperationAllowed(companyId: string, operation: string): boolean
}

/** Brain Kernel — pipeline orchestrator kontratı */
export type BrainKernelContract = {
  analyze(context: BrainContext): BrainPipelineResultLite
  recommend(context: BrainContext): BrainPipelineResultLite
  simulate(context: BrainContext, scenario: SimulationScenario): BrainPipelineResultLite
}

export type BrainPipelineResultLite = {
  requestId: string
  context: BrainContext
  security: BrainSecurityVerdict
  configuration: BrainConfiguration
  knowledge?: BrainKnowledgeSnapshot
  analysis?: BrainAnalysisResult
  decisionFrames?: DecisionFrame[]
  recommendations?: BrainRecommendation[]
  simulation?: SimulationResult
  completedStages: string[]
  generatedAt: string
  offline: boolean
}

/** ERP kaynak adapter kontratı — yalnızca READ_ONLY */
export type BrainKnowledgeSourceAdapter = {
  readonly sourceId: import('../types').BrainKnowledgeSourceId
  readonly mode: 'READ_ONLY'
  isAvailable(context: BrainContext): boolean
  fetch(context: BrainContext): BrainKnowledgeFragment
}
