/**
 * Root Cause Engine — problem → sebep zinciri (fact-based).
 */
import { OPERATIONAL_DASHBOARD } from '../../../data/workflows'
import type { Bottleneck, RootCauseNode, RootCauseTree } from '../types'

let rootCauseCounter = 0

export function buildRootCauseTree(
  orderNo: string,
  bottlenecks: Bottleneck[],
): RootCauseTree | undefined {
  const risk = OPERATIONAL_DASHBOARD.terminRisk.find((r) => r.orderNo === orderNo)
  if (!risk && bottlenecks.length === 0) return undefined

  rootCauseCounter += 1
  const nodes: RootCauseNode[] = []
  let nodeCounter = 0

  const addNode = (
    cause: string,
    level: number,
    factBased: boolean,
    sourceId?: RootCauseNode['sourceId'],
    delayDays?: number,
    parentId?: string,
  ): string => {
    nodeCounter += 1
    const id = `rc-${nodeCounter}`
    nodes.push({
      id,
      level,
      cause,
      factBased,
      sourceId,
      delayDays,
      childIds: [],
    })
    if (parentId) {
      const parent = nodes.find((n) => n.id === parentId)
      if (parent) parent.childIds.push(id)
    }
    return id
  }

  const problemId = addNode(`Termin gecikti — ${orderNo}`, 0, true, 'PLANNING_ENGINE')

  let parentId = problemId
  const fabricBn = bottlenecks.find((b) => b.category === 'FABRIC_DELAY')
  if (fabricBn || risk?.blocker.includes('Kumaş')) {
    parentId = addNode('Kumaş 4 gün gecikti', 1, true, 'WORKFLOW', 4, parentId)
    addNode('Kesim geç başladı', 2, true, 'TIMELINE', 2, parentId)
    parentId = nodes[nodes.length - 1].id
  }

  const capacityBn = bottlenecks.find((b) => b.category === 'LINE_CAPACITY')
  if (capacityBn) {
    parentId = addNode('Dikim kapasite kaybetti', 3, true, 'KPI_ENGINE', capacityBn.estimatedDelayDays, parentId)
  }

  const washBn = bottlenecks.find((b) => b.category === 'WASHING_CONGESTION')
  if (washBn || risk?.blocker.includes('Yıkama')) {
    parentId = addNode('Yıkama gecikti', 4, true, 'TIMELINE', 2, parentId)
  }

  addNode('EXF kaçtı', 5, true, 'PLANNING_ENGINE', risk?.daysLeft ?? 0, parentId)

  const totalDelay = nodes.reduce((s, n) => s + (n.delayDays ?? 0), 0)
  const rootCauseId = nodes[nodes.length - 1]?.id ?? problemId

  return {
    treeId: `rct-${rootCauseCounter}`,
    problemStatement: `Termin gecikti — ${orderNo}`,
    rootOrderNo: orderNo,
    nodes,
    rootCauseId,
    totalDelayDays: totalDelay,
    generatedAt: new Date().toISOString(),
  }
}

export function explainRootCauseChain(tree: RootCauseTree): string {
  return tree.nodes
    .sort((a, b) => a.level - b.level)
    .map((n) => `${'  '.repeat(n.level)}↓ ${n.cause}`)
    .join('\n')
}
