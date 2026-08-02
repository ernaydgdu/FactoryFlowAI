/**
 * Fact Engine — Brain varsayım üretmez, yalnızca doğrulanmış Fact kullanır.
 */
import type { BrainKnowledgeSnapshot } from '../types'
import type { BrainFact, KnowledgeGraph } from '../types/knowledge-reasoning'

let factCounter = 0

export function extractFacts(
  snapshot: BrainKnowledgeSnapshot,
  graph: KnowledgeGraph,
): BrainFact[] {
  const facts: BrainFact[] = []
  const now = new Date().toISOString()

  for (const node of graph.nodes) {
    if (node.dataQuality === 'MISSING') continue

    const factStatements = nodeToFacts(node)
    for (const statement of factStatements) {
      factCounter += 1
      facts.push({
        id: `fact-${factCounter}`,
        kind: 'FACT',
        statement,
        sourceId: node.sourceId,
        reference: node.id,
        entityId: node.entityId,
        verified: true,
        timestamp: now,
      })
    }
  }

  extractWorkflowFacts(snapshot, facts, now)
  extractPlanningFacts(snapshot, facts, now)
  extractStockFacts(snapshot, facts, now)

  return facts
}

export function rejectAssumptions(candidates: BrainFact[]): BrainFact[] {
  return candidates.filter((f) => f.kind === 'FACT' && f.verified)
}

export function isFact(statement: string): boolean {
  const assumptionPatterns = [
    /olabilir/i,
    /muhtemelen/i,
    /tahmin/i,
    /sanırım/i,
    /might/i,
    /could/i,
    /perhaps/i,
  ]
  return !assumptionPatterns.some((p) => p.test(statement))
}

function nodeToFacts(node: KnowledgeGraph['nodes'][0]): string[] {
  switch (node.type) {
    case 'ORDER':
      return [`Sipariş ${node.label} sistemde kayıtlı`]
    case 'BOM':
      return node.attributes.hasBom
        ? [`BOM tanımlı — ${node.attributes.lineCount} satır`]
        : []
    case 'MRP':
      return node.attributes.hasMrp
        ? [`MRP hesaplanmış — ${node.attributes.quantity} adet`]
        : []
    case 'PRODUCTION':
      return [
        `Üretim planlanan: ${node.attributes.plannedQty}, gerçekleşen: ${node.attributes.producedQty}`,
      ]
    case 'SHIPMENT':
      return node.attributes.exf ? [`EXF tarihi: ${node.attributes.exf}`] : []
    default:
      return node.dataQuality === 'COMPLETE' ? [`${node.type} verisi mevcut`] : []
  }
}

function extractWorkflowFacts(snapshot: BrainKnowledgeSnapshot, facts: BrainFact[], now: string): void {
  const workflow = snapshot.fragments.find((f) => f.sourceId === 'WORKFLOW')
  const terminRisk = workflow?.payload.terminRisk as Array<{ orderNo: string; blocker: string; daysLeft: number }> | undefined
  if (!terminRisk) return

  for (const risk of terminRisk) {
    if (risk.daysLeft <= 7) {
      factCounter += 1
      facts.push({
        id: `fact-${factCounter}`,
        kind: 'FACT',
        statement: `${risk.orderNo} siparişinde blocker: ${risk.blocker} (${risk.daysLeft} gün kaldı)`,
        sourceId: 'WORKFLOW',
        reference: risk.orderNo,
        entityNo: risk.orderNo,
        verified: true,
        timestamp: now,
      })
    }
  }
}

function extractPlanningFacts(snapshot: BrainKnowledgeSnapshot, facts: BrainFact[], now: string): void {
  const planning = snapshot.fragments.find((f) => f.sourceId === 'PLANNING_ENGINE')
  const plans = planning?.payload.terminPlans as Array<{ orderNo: string; riskLevel: string; riskScore: number }> | undefined
  if (!plans) return

  for (const plan of plans.filter((p) => p.riskLevel !== 'Düşük')) {
    factCounter += 1
    facts.push({
      id: `fact-${factCounter}`,
      kind: 'FACT',
      statement: `${plan.orderNo} termin risk seviyesi ${plan.riskLevel} (skor: ${plan.riskScore})`,
      sourceId: 'PLANNING_ENGINE',
      reference: plan.orderNo,
      entityNo: plan.orderNo,
      verified: true,
      timestamp: now,
    })
  }
}

function extractStockFacts(snapshot: BrainKnowledgeSnapshot, facts: BrainFact[], now: string): void {
  const stock = snapshot.fragments.find((f) => f.sourceId === 'STOCK_LEDGER')
  const lowItems = stock?.payload.lowStockItems as unknown[] | undefined
  if (!lowItems?.length) return

  factCounter += 1
  facts.push({
    id: `fact-${factCounter}`,
    kind: 'FACT',
    statement: `${lowItems.length} stok kalemi minimum seviyenin altında`,
    sourceId: 'STOCK_LEDGER',
    reference: 'stock-ledger',
    verified: true,
    timestamp: now,
  })
}

export function formatIncompleteDueToMissingData(reasons: string[]): string {
  return [
    'Bu analiz tamamlanamadı.',
    'Çünkü;',
    ...reasons.map((r) => `• ${r}`),
    'Bu nedenle güven seviyesi düşüktür.',
  ].join('\n')
}
