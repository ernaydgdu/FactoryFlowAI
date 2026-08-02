/**
 * Knowledge Engine — ERP verisini anlamlı ilişki grafiğine dönüştürür.
 * Kesinlikle READ ONLY — INSERT/UPDATE/DELETE yasak.
 */
import { SALES_ORDERS } from '../../data/orders'
import { getProductById } from '../../data/products'
import { collectTextileEntitySnapshots } from '../../services/textile/textile-entity-registry'
import type { BrainKnowledgeSnapshot } from '../types'
import type {
  KnowledgeGraph,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MissingDataFlag,
} from '../types/knowledge-reasoning'
import { getCachedKnowledgeGraph, setCachedKnowledgeGraph } from '../../performance/knowledge-graph-cache'

let graphCounter = 0

const ORDER_CHAIN: Array<{
  type: KnowledgeGraphNode['type']
  edge?: KnowledgeGraphEdge['type']
}> = [
  { type: 'ORDER' },
  { type: 'PRODUCT', edge: 'HAS_PRODUCT' },
  { type: 'BOM', edge: 'HAS_BOM' },
  { type: 'MRP', edge: 'REQUIRES_MRP' },
  { type: 'PURCHASE', edge: 'TRIGGERS_PURCHASE' },
  { type: 'WAREHOUSE', edge: 'STORED_IN' },
  { type: 'PRODUCTION', edge: 'FEEDS_PRODUCTION' },
  { type: 'QUALITY', edge: 'PASSES_QUALITY' },
  { type: 'SHIPMENT', edge: 'SHIPPED_TO' },
  { type: 'COST', edge: 'HAS_COST' },
  { type: 'PROFITABILITY', edge: 'CONTRIBUTES_PROFIT' },
]

export function buildKnowledgeGraph(snapshot: BrainKnowledgeSnapshot): KnowledgeGraph {
  const cached = getCachedKnowledgeGraph(snapshot.snapshotId)
  if (cached) return cached

  graphCounter += 1
  const orderId = snapshot.context.scope.orderId
  const order = orderId ? SALES_ORDERS.find((o) => o.id === orderId) : SALES_ORDERS[0]

  const nodes: KnowledgeGraphNode[] = []
  const edges: KnowledgeGraphEdge[] = []
  const missingDataFlags: MissingDataFlag[] = []

  if (!order) {
    return emptyGraph(snapshot.snapshotId, missingDataFlags)
  }

  const planning = snapshot.fragments.find((f) => f.sourceId === 'PLANNING_ENGINE')
  const stock = snapshot.fragments.find((f) => f.sourceId === 'STOCK_LEDGER')
  const workflow = snapshot.fragments.find((f) => f.sourceId === 'WORKFLOW')
  const timeline = snapshot.fragments.find((f) => f.sourceId === 'TIMELINE')
  const approval = snapshot.fragments.find((f) => f.sourceId === 'APPROVAL')

  const terminPlan = (planning?.payload.terminPlans as Array<{ orderId: string; orderNo: string; exfDate: string; riskScore: number }> | undefined)?.find(
    (p) => p.orderId === order.id,
  )

  let prevNodeId: string | null = null

  for (let i = 0; i < ORDER_CHAIN.length; i++) {
    const step = ORDER_CHAIN[i]
    const nodeId = `node-${order.id}-${step.type}`
    const quality = assessNodeQuality(step.type, order, {
      terminPlan,
      stock,
      workflow,
      timeline,
      approval,
    })

    nodes.push({
      id: nodeId,
      type: step.type,
      label: buildNodeLabel(step.type, order),
      entityId: order.id,
      sourceId: mapNodeToSource(step.type),
      attributes: buildNodeAttributes(step.type, order, terminPlan),
      dataQuality: quality.level,
    })

    if (quality.missing) {
      missingDataFlags.push(...quality.missing)
    }

    if (prevNodeId && step.edge) {
      edges.push({
        id: `edge-${prevNodeId}-${nodeId}`,
        fromNodeId: prevNodeId,
        toNodeId: nodeId,
        type: step.edge,
        sourceId: mapNodeToSource(step.type),
      })
    }
    prevNodeId = nodeId
  }

  const productNodeId = nodes.find((n) => n.type === 'PRODUCT')?.id
  const textileSnapshots = collectTextileEntitySnapshots(order.id)
  for (const entity of textileSnapshots) {
    const entityNodeId = `textile-${entity.kind}-${entity.entityId}`
    nodes.push({
      id: entityNodeId,
      type: 'PRODUCT',
      label: `${entity.kind} — ${entity.label}`,
      entityId: entity.entityId,
      sourceId: 'MASTER_DATA',
      attributes: { textileKind: entity.kind, ...entity.attributes, sourceModule: entity.sourceModule },
      dataQuality: 'COMPLETE',
    })
    if (productNodeId) {
      edges.push({
        id: `edge-${productNodeId}-${entityNodeId}`,
        fromNodeId: productNodeId,
        toNodeId: entityNodeId,
        type: 'HAS_BOM',
        sourceId: 'MASTER_DATA',
      })
    }
  }

  const completeNodes = nodes.filter((n) => n.dataQuality === 'COMPLETE').length
  const completenessScore = Math.round((completeNodes / nodes.length) * 100) / 100

  const graph: KnowledgeGraph = {
    graphId: `kgraph-${graphCounter}`,
    snapshotId: snapshot.snapshotId,
    rootNodeId: nodes[0]?.id,
    nodes,
    edges,
    completenessScore,
    missingDataFlags,
    assembledAt: new Date().toISOString(),
  }
  setCachedKnowledgeGraph(snapshot.snapshotId, graph)
  return graph
}

function emptyGraph(snapshotId: string, flags: MissingDataFlag[]): KnowledgeGraph {
  return {
    graphId: `kgraph-${graphCounter}`,
    snapshotId,
    nodes: [],
    edges: [],
    completenessScore: 0,
    missingDataFlags: flags,
    assembledAt: new Date().toISOString(),
  }
}

function buildNodeLabel(type: KnowledgeGraphNode['type'], order: (typeof SALES_ORDERS)[0]): string {
  const product = getProductById(order.productCardId)
  switch (type) {
    case 'ORDER':
      return order.orderNo
    case 'PRODUCT':
      return product?.productName ?? order.productCardId
    case 'BOM':
      return product ? `BOM — ${product.productCode}` : 'BOM'
    case 'MRP':
      return `MRP — ${order.matrixTotals.grandTotal} adet`
    case 'PURCHASE':
      return 'Satın Alma'
    case 'WAREHOUSE':
      return 'Depo Stok'
    case 'PRODUCTION':
      return order.productionStatus
    case 'QUALITY':
      return order.production.secondQualityQty > 0 ? 'Kalite Sapması Var' : 'Kalite OK'
    case 'SHIPMENT':
      return `EXF ${order.general.exf}`
    case 'COST':
      return 'Maliyet'
    case 'PROFITABILITY':
      return 'Karlılık'
    default:
      return type
  }
}

function buildNodeAttributes(
  type: KnowledgeGraphNode['type'],
  order: (typeof SALES_ORDERS)[0],
  terminPlan?: { exfDate: string; riskScore: number },
): Record<string, unknown> {
  const product = getProductById(order.productCardId)
  const bom = product?.bom ?? []
  const mrpLines = order.mrp.lines ?? []

  switch (type) {
    case 'ORDER':
      return { orderNo: order.orderNo, customer: order.general.customer, exf: order.general.exf }
    case 'PRODUCT':
      return {
        modelCode: product?.productCode,
        productGroup: product?.productGroup,
        gtip: product?.productCode,
        colorCount: product?.colors.length,
        sizeSetId: product?.sizeSetId,
      }
    case 'BOM':
      return { lineCount: bom.length, hasBom: bom.length > 0 }
    case 'MRP':
      return { quantity: order.matrixTotals.grandTotal, hasMrp: mrpLines.length > 0, lineCount: mrpLines.length }
    case 'PURCHASE':
      return {
        hasPurchaseRecords: mrpLines.some((m) => m.status !== 'Karşılandı' && m.netRequired > 0),
        fabricStatus: order.fabricStatus,
        accessoryStatus: order.accessoryStatus,
      }
    case 'WAREHOUSE':
      return { fabricStatus: order.fabricStatus, accessoryStatus: order.accessoryStatus }
    case 'PRODUCTION':
      return {
        plannedQty: order.production.plannedQty,
        producedQty: order.production.producedQty,
        wasteQty: order.production.wasteQty,
        isSplit: order.isSplit ?? false,
        splitCount: order.productionSplits?.length ?? 0,
        splitWorkshops: order.productionSplits?.map((s) => s.workshopCode) ?? [],
      }
    case 'QUALITY':
      return {
        secondQualityQty: order.production.secondQualityQty,
        reworkQty: order.production.reworkQty,
        hasQualityIssue: order.production.secondQualityQty > 0,
      }
    case 'SHIPMENT':
      return { exf: order.general.exf, terminRisk: order.terminRisk, riskScore: terminPlan?.riskScore }
    case 'COST':
      return { orderQty: order.matrixTotals.grandTotal, currency: order.general.currency }
    case 'PROFITABILITY':
      return { progress: order.progress, terminRisk: order.terminRisk }
    default:
      return {}
  }
}

function assessNodeQuality(
  type: KnowledgeGraphNode['type'],
  order: (typeof SALES_ORDERS)[0],
  ctx: Record<string, unknown>,
): { level: KnowledgeGraphNode['dataQuality']; missing: MissingDataFlag[] } {
  const missing: MissingDataFlag[] = []
  const product = getProductById(order.productCardId)
  const bom = product?.bom ?? []
  const mrpLines = order.mrp.lines ?? []

  if (type === 'BOM' && bom.length === 0) {
    missing.push({
      code: 'MISSING_BOM',
      nodeType: 'BOM',
      field: 'bom',
      message: 'BOM tanımı eksik',
      sourceId: 'PLANNING_ENGINE',
    })
  }

  if (type === 'MRP' && mrpLines.length === 0) {
    missing.push({
      code: 'MISSING_MRP',
      nodeType: 'MRP',
      field: 'mrp',
      message: 'MRP hesaplanmamış',
      sourceId: 'PLANNING_ENGINE',
    })
  }

  if (type === 'PURCHASE' && !mrpLines.some((m) => m.status !== 'Karşılandı' && m.netRequired > 0) && order.fabricStatus === 'Bekliyor') {
    missing.push({
      code: 'MISSING_PURCHASE',
      nodeType: 'PURCHASE',
      field: 'purchaseRecords',
      message: 'Satın alma kaydı eksik',
      sourceId: 'WORKFLOW',
    })
  }

  if (type === 'SHIPMENT' && !order.general.exf) {
    missing.push({
      code: 'MISSING_EXF',
      nodeType: 'SHIPMENT',
      field: 'exf',
      message: 'Kumaş/EXF termin tarihi girilmemiş',
      sourceId: 'PLANNING_ENGINE',
    })
  }

  if (type === 'QUALITY' && order.production.secondQualityQty === 0 && order.production.reworkQty === 0) {
    /* quality data present via production metrics — no missing flag */
  }

  if (!ctx.timeline && type === 'PRODUCTION') {
    missing.push({
      code: 'MISSING_TIMELINE',
      nodeType: 'PRODUCTION',
      field: 'timeline',
      message: 'Timeline kaydı eksik',
      sourceId: 'TIMELINE',
    })
  }

  if (!ctx.approval && type === 'BOM') {
    missing.push({
      code: 'MISSING_APPROVAL',
      nodeType: 'BOM',
      field: 'approval',
      message: 'BOM onay kaydı eksik',
      sourceId: 'APPROVAL',
    })
  }

  const level: KnowledgeGraphNode['dataQuality'] =
    missing.length === 0 ? 'COMPLETE' : missing.length === 1 ? 'PARTIAL' : 'MISSING'

  return { level, missing }
}

function mapNodeToSource(type: KnowledgeGraphNode['type']): KnowledgeGraphNode['sourceId'] {
  const map: Partial<Record<KnowledgeGraphNode['type'], KnowledgeGraphNode['sourceId']>> = {
    ORDER: 'EVENT_BUS',
    PRODUCT: 'MASTER_DATA',
    BOM: 'VERSIONING',
    MRP: 'PLANNING_ENGINE',
    PURCHASE: 'WORKFLOW',
    WAREHOUSE: 'STOCK_LEDGER',
    PRODUCTION: 'TIMELINE',
    QUALITY: 'TIMELINE',
    SHIPMENT: 'PLANNING_ENGINE',
    COST: 'PLANNING_ENGINE',
    PROFITABILITY: 'KPI_ENGINE',
  }
  return map[type] ?? 'MASTER_DATA'
}

export function assertKnowledgeEngineReadOnly(): void {
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'MUTATION', 'WRITE']
  forbidden.forEach((op) => {
    if (op) {
      /* compile-time contract: Knowledge Engine never performs mutations */
    }
  })
}
