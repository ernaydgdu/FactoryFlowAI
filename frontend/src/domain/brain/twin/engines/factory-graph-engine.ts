/**
 * Factory Graph Engine — fabrikanın dijital modeli (read-only).
 * ERP verisini değiştirmez. sideEffects = NONE.
 */
import { SALES_ORDERS } from '../../../data/orders'
import { getProductById } from '../../../data/products'
import { STOCK_CARDS } from '../../../data/stock-cards'
import {
  customerRepository,
  employeeRepository,
  machineRepository,
  operationRepository,
  productionLineRepository,
  supplierRepository,
  warehouseRepository,
  workshopRepository,
} from '../../../master-data'
import { getAllTimelineEntries } from '../../../platform/services/timeline-service'
import { buildEnterpriseRelationGraph } from '../../../enterprise/relation-graph-service'
import { queryPackingListsBySalesOrderId } from '../../../packaging/packing-list-query.service'
import { queryAllExportDocumentSets } from '../../../commercial-documents/commercial-documents-query.service'
import { queryAllExportShipments } from '../../../export-logistics/export-logistics-query.service'
import { queryAllAccountingIntegrations } from '../../../finance-integration/finance-integration-query.service'
import type { BrainContext, BrainKnowledgeSnapshot } from '../../types'
import type {
  FactoryGraph,
  FactoryGraphEdge,
  FactoryGraphNode,
  FactoryGraphRelationshipType,
} from '../types'

let factoryGraphCounter = 0

export function buildFactoryGraph(
  context: BrainContext,
  _snapshot: BrainKnowledgeSnapshot,
): FactoryGraph {
  factoryGraphCounter += 1
  const nodes: FactoryGraphNode[] = []
  const edges: FactoryGraphEdge[] = []
  let edgeCounter = 0

  const addNode = (node: FactoryGraphNode) => {
    if (!nodes.find((n) => n.id === node.id)) nodes.push(node)
    return node.id
  }

  const addEdge = (
    fromId: string,
    toId: string,
    relationship: FactoryGraphRelationshipType,
    sourceId: FactoryGraphNode['sourceId'],
    label?: string,
  ) => {
    edgeCounter += 1
    edges.push({
      id: `fge-${edgeCounter}`,
      fromNodeId: fromId,
      toNodeId: toId,
      relationship,
      sourceId,
      label,
    })
  }

  addNode({
    id: 'factory-kepler',
    type: 'FACTORY',
    label: 'Kepler Tekstil Fabrikası',
    entityId: context.companyId,
    sourceId: 'MASTER_DATA',
    attributes: { location: 'İstanbul' },
    dataQuality: 'COMPLETE',
  })

  for (const w of workshopRepository.getActive()) {
    const wh = warehouseRepository.getById(w.warehouseId)
    const nodeId = addNode({
      id: `workshop-${w.id}`,
      type: 'WORKSHOP',
      label: w.name,
      entityId: w.id,
      sourceId: 'MASTER_DATA',
      attributes: { code: w.code, capacity: w.monthlyCapacity, load: w.currentLoad },
      dataQuality: 'COMPLETE',
    })
    addEdge('factory-kepler', nodeId, 'CONTAINS', 'MASTER_DATA')
    if (wh) {
      const whId = addNode({
        id: `warehouse-${wh.id}`,
        type: 'WAREHOUSE',
        label: wh.name,
        entityId: wh.id,
        sourceId: 'MASTER_DATA',
        attributes: { code: wh.code, type: wh.type },
        dataQuality: 'COMPLETE',
      })
      addEdge(whId, nodeId, 'SUPPLIES', 'MASTER_DATA')
    }
  }

  for (const line of productionLineRepository.getActive()) {
    const lineId = addNode({
      id: `line-${line.id}`,
      type: 'PRODUCTION_LINE',
      label: line.name,
      entityId: line.id,
      sourceId: 'MASTER_DATA',
      attributes: { capacityPerDay: line.capacityPerDay },
      dataQuality: 'COMPLETE',
    })
    const workshopNodeId = `workshop-${line.workshopId}`
    if (nodes.find((n) => n.id === workshopNodeId)) {
      addEdge(workshopNodeId, lineId, 'RUNS', 'MASTER_DATA')
    }
  }

  for (const machine of machineRepository.getActive()) {
    const machineId = addNode({
      id: `machine-${machine.id}`,
      type: 'MACHINE',
      label: machine.name,
      entityId: machine.id,
      sourceId: 'MASTER_DATA',
      attributes: { type: machine.machineType },
      dataQuality: 'COMPLETE',
    })
    const lineNodeId = `line-${machine.productionLineId}`
    if (nodes.find((n) => n.id === lineNodeId)) {
      addEdge(lineNodeId, machineId, 'CONTAINS', 'MASTER_DATA')
    }
  }

  for (const emp of employeeRepository.find((e) => e.role === 'Operatör')) {
    const opId = addNode({
      id: `operator-${emp.id}`,
      type: 'OPERATOR',
      label: emp.name,
      entityId: emp.id,
      sourceId: 'MASTER_DATA',
      attributes: { department: emp.department },
      dataQuality: emp.workshopId ? 'COMPLETE' : 'PARTIAL',
    })
    if (emp.workshopId) {
      const wNodeId = `workshop-${emp.workshopId}`
      if (nodes.find((n) => n.id === wNodeId)) {
        addEdge(opId, wNodeId, 'ASSIGNED_TO', 'MASTER_DATA')
      }
    }
  }

  const orderFilter = context.scope.orderId
    ? SALES_ORDERS.filter((o) => o.id === context.scope.orderId)
    : SALES_ORDERS.slice(0, 10)

  for (const order of orderFilter) {
    const product = getProductById(order.productCardId)
    const orderId = addNode({
      id: `order-${order.id}`,
      type: 'ORDER',
      label: order.orderNo,
      entityId: order.id,
      sourceId: 'EVENT_BUS',
      attributes: { exf: order.general.exf, status: order.productionStatus, customer: order.general.customer },
      dataQuality: 'COMPLETE',
    })

    if (product) {
      const productId = addNode({
        id: `product-${product.id}`,
        type: 'PRODUCT',
        label: product.productName,
        entityId: product.id,
        sourceId: 'MASTER_DATA',
        attributes: { code: product.productCode },
        dataQuality: 'COMPLETE',
      })
      addEdge(orderId, productId, 'USES', 'MASTER_DATA')

      const bomId = addNode({
        id: `bom-${order.id}`,
        type: 'BOM',
        label: `BOM — ${product.productCode}`,
        entityId: `${order.id}-bom`,
        sourceId: 'VERSIONING',
        attributes: { lineCount: product.bom.length },
        dataQuality: product.bom.length > 0 ? 'COMPLETE' : 'MISSING',
      })
      addEdge(productId, bomId, 'USES', 'VERSIONING')

      for (const bomLine of product.bom.slice(0, 3)) {
        const materialId = addNode({
          id: `material-${bomLine.stockCardId}`,
          type: 'MATERIAL',
          label: bomLine.stockCardId,
          entityId: bomLine.stockCardId,
          sourceId: 'STOCK_LEDGER',
          attributes: { consumption: bomLine.consumption },
          dataQuality: 'COMPLETE',
        })
        addEdge(bomId, materialId, 'CONSUMES', 'STOCK_LEDGER')
      }
    }

    const prodOrderId = addNode({
      id: `prod-order-${order.id}`,
      type: 'PRODUCTION_ORDER',
      label: order.production.workOrderNo,
      entityId: order.production.workOrderNo,
      sourceId: 'TIMELINE',
      attributes: { planned: order.production.plannedQty, produced: order.production.producedQty, isParent: true },
      dataQuality: 'COMPLETE',
    })
    addEdge(orderId, prodOrderId, 'TRIGGERS', 'TIMELINE')

    if (order.productionSplits && order.productionSplits.length > 0) {
      for (const split of order.productionSplits) {
        const splitProdId = addNode({
          id: `prod-split-${split.id}`,
          type: 'PRODUCTION_ORDER',
          label: split.workOrderNo,
          entityId: split.workOrderNo,
          sourceId: 'TIMELINE',
          attributes: {
            splitIndex: split.splitIndex,
            splitOfTotal: split.splitOfTotal,
            workshopCode: split.workshopCode,
            planned: split.plannedQty,
            produced: split.producedQty,
          },
          dataQuality: 'COMPLETE',
        })
        addEdge(prodOrderId, splitProdId, 'SPLIT_FROM', 'TIMELINE', `${split.workshopCode} (${split.plannedQty})`)

        const wsNode = nodes.find(
          (n) => n.type === 'WORKSHOP' && n.attributes.code === split.workshopCode,
        )
        if (wsNode) {
          addEdge(splitProdId, wsNode.id, 'ASSIGNED_TO', 'MASTER_DATA')
        }
      }
    }

    for (const op of operationRepository.getActive().slice(0, 4)) {
      const opId = addNode({
        id: `operation-${op.id}-${order.id}`,
        type: 'OPERATION',
        label: op.name,
        entityId: op.id,
        sourceId: 'MASTER_DATA',
        attributes: { code: op.code, department: op.department },
        dataQuality: 'COMPLETE',
      })
      addEdge(prodOrderId, opId, 'FOLLOWS', 'MASTER_DATA')
    }

    const customer = customerRepository.find((c) => c.name === order.general.customer)[0]
    if (customer) {
      const custId = addNode({
        id: `customer-${customer.id}`,
        type: 'CUSTOMER',
        label: customer.name,
        entityId: customer.id,
        sourceId: 'MASTER_DATA',
        attributes: {},
        dataQuality: 'COMPLETE',
      })
      addEdge(orderId, custId, 'ORDERED_BY', 'MASTER_DATA')
    }

    const packingLists = queryPackingListsBySalesOrderId(order.id)
    for (const pl of packingLists.slice(0, 5)) {
      const packingId = addNode({
        id: `packing-${pl.id}`,
        type: 'PACKING_LIST',
        label: `${pl.packingListNo} r${pl.revision}`,
        entityId: pl.id,
        sourceId: 'WORKFLOW',
        attributes: {
          status: pl.status,
          approvalStatus: pl.approvalStatus,
          packageCount: pl.totals.packageCount,
          containerCode: pl.containerCode,
          shipmentReferenceNo: pl.shipmentReferenceNo,
        },
        dataQuality: pl.packages.length > 0 ? 'COMPLETE' : 'PARTIAL',
      })
      addEdge(orderId, packingId, 'CONTAINS', 'WORKFLOW')
    }

    const shipmentId = addNode({
      id: `shipment-${order.id}`,
      type: 'SHIPMENT',
      label: `Sevkiyat — ${order.orderNo}`,
      entityId: `ship-${order.id}`,
      sourceId: 'WORKFLOW',
      attributes: { exf: order.general.exf, terminRisk: order.terminRisk },
      dataQuality: order.general.exf ? 'COMPLETE' : 'MISSING',
    })
    addEdge(orderId, shipmentId, 'SHIPS_TO', 'WORKFLOW')
    for (const pl of packingLists.slice(0, 5)) {
      if (pl.shipmentReferenceNo || pl.status === 'Shipped') {
        addEdge(`packing-${pl.id}`, shipmentId, 'SHIPS_TO', 'WORKFLOW')
      }
    }

    const docSets = queryAllExportDocumentSets()
      .filter((d) => d.salesOrderId === order.id)
      .slice(0, 5)
    for (const eds of docSets) {
      const edsId = addNode({
        id: `export-docs-${eds.id}`,
        type: 'EXPORT_DOCUMENT_SET',
        label: `${eds.documentSetNo} / ${eds.commercialInvoice.invoiceNo}`,
        entityId: eds.id,
        sourceId: 'WORKFLOW',
        attributes: {
          status: eds.status,
          shipmentNo: eds.shipmentNo,
          totalQty: eds.commercialInvoice.totalQty,
          totalAmount: eds.commercialInvoice.totalAmount,
        },
        dataQuality: eds.status === 'Issued' ? 'COMPLETE' : 'PARTIAL',
      })
      addEdge(orderId, edsId, 'CONTAINS', 'WORKFLOW')
      addEdge(`shipment-${order.id}`, edsId, 'SHIPS_TO', 'WORKFLOW')
    }

    const exportOrch = queryAllExportShipments()
      .filter((e) => e.salesOrderId === order.id)
      .slice(0, 5)
    for (const exs of exportOrch) {
      const exsId = addNode({
        id: `export-shipment-${exs.id}`,
        type: 'EXPORT_SHIPMENT',
        label: `${exs.exportShipmentNo} · ${exs.status}`,
        entityId: exs.id,
        sourceId: 'WORKFLOW',
        attributes: {
          status: exs.status,
          customsStatus: exs.customsStatus,
          delayRiskScore: exs.delayRiskScore,
          predictedDelayDays: exs.predictedDelayDays,
          riskFlags: exs.riskFlags,
        },
        dataQuality: exs.status === 'Closed' ? 'COMPLETE' : 'PARTIAL',
      })
      addEdge(orderId, exsId, 'CONTAINS', 'WORKFLOW')
      addEdge(`shipment-${order.id}`, exsId, 'SHIPS_TO', 'WORKFLOW')
    }

    const financeBatches = queryAllAccountingIntegrations()
      .filter(
        (b) =>
          b.sourceReferenceId === order.id ||
          b.sourceEventType === 'CommercialInvoiceIssued' ||
          b.sourceEventType === 'ShipmentDeparted',
      )
      .slice(0, 5)
    for (const batch of financeBatches) {
      const finId = addNode({
        id: `accounting-${batch.id}`,
        type: 'ACCOUNTING_INTEGRATION',
        label: `${batch.batchNo} · ${batch.status}`,
        entityId: batch.id,
        sourceId: 'WORKFLOW',
        attributes: {
          status: batch.status,
          sourceEventType: batch.sourceEventType,
          debitTotal: batch.journalEntry.debitTotal,
          creditTotal: batch.journalEntry.creditTotal,
          costAnomalyScore: batch.costAnomalyScore,
          profitabilityHint: batch.profitabilityHint,
        },
        dataQuality: batch.status === 'Posted' ? 'COMPLETE' : 'PARTIAL',
      })
      addEdge(orderId, finId, 'TRIGGERS', 'WORKFLOW')
    }
  }

  for (const card of STOCK_CARDS.slice(0, 5)) {
    addNode({
      id: `stock-${card.id}`,
      type: 'STOCK_CARD',
      label: card.name,
      entityId: card.id,
      sourceId: 'STOCK_LEDGER',
      attributes: { code: card.code, available: card.availableQty },
      dataQuality: 'COMPLETE',
    })
  }

  for (const supplier of supplierRepository.getActive().slice(0, 3)) {
    addNode({
      id: `supplier-${supplier.id}`,
      type: 'SUPPLIER',
      label: supplier.name,
      entityId: supplier.id,
      sourceId: 'MASTER_DATA',
      attributes: { category: supplier.category },
      dataQuality: 'COMPLETE',
    })
  }

  for (const event of getAllTimelineEntries().slice(0, 5)) {
    addNode({
      id: `timeline-${event.id}`,
      type: 'TIMELINE_EVENT',
      label: event.title,
      entityId: event.id,
      sourceId: 'TIMELINE',
      attributes: { eventType: event.eventType, orderNo: event.orderNo },
      dataQuality: 'COMPLETE',
    })
  }

  const enterpriseGraph = buildEnterpriseRelationGraph()
  for (const node of enterpriseGraph.nodes.slice(0, 80)) {
    const nodeId = addNode({
      id: `ent-${node.id}`,
      type: mapEnterpriseTypeToFactory(node.entityType),
      label: node.label,
      entityId: node.entityId,
      sourceId: 'ENTERPRISE_RELATIONS',
      attributes: { entityType: node.entityType, code: node.code },
      dataQuality: 'COMPLETE',
    })
    void nodeId
  }
  for (const edge of enterpriseGraph.edges.slice(0, 120)) {
    const fromEnt = `ent-${edge.fromNodeId}`
    const toEnt = `ent-${edge.toNodeId}`
    if (nodes.find((n) => n.id === fromEnt) && nodes.find((n) => n.id === toEnt)) {
      addEdge(fromEnt, toEnt, 'DEPENDS_ON', 'ENTERPRISE_RELATIONS', edge.label)
    }
  }

  return {
    graphId: `fgraph-${factoryGraphCounter}`,
    companyId: context.companyId,
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    assembledAt: new Date().toISOString(),
    sideEffects: 'NONE',
  }
}

export function getFactoryGraphNodesByType(
  graph: FactoryGraph,
  type: FactoryGraphNode['type'],
): FactoryGraphNode[] {
  return graph.nodes.filter((n) => n.type === type)
}

function mapEnterpriseTypeToFactory(entityType: string): FactoryGraphNode['type'] {
  const map: Record<string, FactoryGraphNode['type']> = {
    SALES_ORDER: 'ORDER',
    PRODUCT_CARD: 'PRODUCT',
    FABRIC_CARD: 'STOCK_CARD',
    ACCESSORY_CARD: 'MATERIAL',
    WAREHOUSE: 'WAREHOUSE',
    PRODUCTION_ORDER: 'PRODUCTION_ORDER',
    PURCHASE_ORDER: 'PURCHASE_ORDER',
    PACKING_LIST: 'PACKING_LIST',
    EXPORT_DOCUMENT_SET: 'EXPORT_DOCUMENT_SET',
    EXPORT_SHIPMENT: 'EXPORT_SHIPMENT',
    ACCOUNTING_INTEGRATION: 'ACCOUNTING_INTEGRATION',
    INVOICE: 'ACCOUNTING_INTEGRATION',
    CUSTOMER: 'CUSTOMER',
    SUPPLIER: 'SUPPLIER',
    BOM: 'BOM',
    SHIPMENT: 'SHIPMENT',
    QUALITY_PLAN: 'QUALITY_INSPECTION',
    WORKSHOP: 'WORKSHOP',
    PRODUCTION_LINE: 'PRODUCTION_LINE',
    MACHINE: 'MACHINE',
    OPERATOR: 'OPERATOR',
  }
  return map[entityType] ?? 'MATERIAL'
}
