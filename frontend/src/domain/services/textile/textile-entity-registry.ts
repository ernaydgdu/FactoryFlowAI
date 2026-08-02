/**
 * Textile Entity Registry — Brain Knowledge Graph besleme kaynağı.
 * Yeni entity'ler otomatik snapshot üretir.
 */
import { PRODUCT_CARDS } from '../../data/products'
import { SALES_ORDERS } from '../../data/orders'
import { getAllAccessoryCards } from './accessory-management-service'
import { getAllColorCards } from './color-management-service'
import { getAllFabricCards } from './fabric-management-service'
import { getAllSizeSets } from './size-matrix-service'
import { buildWarehouseHierarchy } from './warehouse-hierarchy-service'
import { calculateTextileCostBreakdown } from './textile-costing-service'
import { buildProductionTracking } from './production-tracking-service'
import { traceAllMaterialChains } from './purchase-chain-service'
import type { TextileEntitySnapshot } from '../../types/textile-erp'
import { DEMO_STOCK_LEDGER } from '../../data/stock-ledger-demo'

export function collectTextileEntitySnapshots(orderId?: string): TextileEntitySnapshot[] {
  const snapshots: TextileEntitySnapshot[] = []
  const order = orderId
    ? SALES_ORDERS.find((o) => o.id === orderId)
    : SALES_ORDERS[0]

  for (const card of PRODUCT_CARDS.slice(0, 5)) {
    snapshots.push({
      kind: 'PRODUCT_CARD',
      entityId: card.id,
      label: card.productCode,
      attributes: {
        productName: card.productName,
        brand: card.brand,
        season: card.season,
        status: card.status,
        bomLineCount: card.bom.length,
        colorCount: card.colors.length,
      },
      sourceModule: 'product-card-service',
    })
  }

  for (const color of getAllColorCards()) {
    snapshots.push({
      kind: 'COLOR_CARD',
      entityId: color.id,
      label: color.code,
      attributes: { pantone: color.pantone, hex: color.hex, rgb: color.rgb },
      sourceModule: 'color-management-service',
    })
  }

  for (const ss of getAllSizeSets()) {
    snapshots.push({
      kind: 'SIZE_SET',
      entityId: ss.id,
      label: ss.code,
      attributes: { productType: ss.productType, category: ss.category, sizeCount: ss.sizes.length },
      sourceModule: 'size-matrix-service',
    })
  }

  for (const fabric of getAllFabricCards()) {
    snapshots.push({
      kind: 'FABRIC_CARD',
      entityId: fabric.id,
      label: fabric.code,
      attributes: {
        weightGsm: fabric.weightGsm,
        widthCm: fabric.widthCm,
        qualityGrade: fabric.qualityGrade,
      },
      sourceModule: 'fabric-management-service',
    })
  }

  for (const acc of getAllAccessoryCards().slice(0, 8)) {
    snapshots.push({
      kind: 'ACCESSORY_CARD',
      entityId: acc.id,
      label: acc.code,
      attributes: { categoryCode: acc.categoryCode, attributes: acc.attributes },
      sourceModule: 'accessory-management-service',
    })
  }

  for (const node of buildWarehouseHierarchy().filter((n) => n.type === 'WAREHOUSE')) {
    snapshots.push({
      kind: 'WAREHOUSE_NODE',
      entityId: node.id,
      label: node.code,
      attributes: { warehouseType: node.warehouseType, parentId: node.parentId },
      sourceModule: 'warehouse-hierarchy-service',
    })
  }

  if (order) {
    const cost = calculateTextileCostBreakdown(order)
    snapshots.push({
      kind: 'COST_BREAKDOWN',
      entityId: order.id,
      label: order.orderNo,
      attributes: {
        fob: cost.fob,
        cm: cost.cm,
        netMargin: cost.netMarginPercent,
        grossMargin: cost.grossMarginPercent,
      },
      sourceModule: 'textile-costing-service',
    })

    const tracking = buildProductionTracking(order)
    snapshots.push({
      kind: 'PRODUCTION_TRACKING',
      entityId: order.production.workOrderNo,
      label: order.orderNo,
      attributes: {
        oee: tracking.oee,
        efficiency: tracking.efficiency,
        progress: tracking.progressPercent,
        operationCount: tracking.operations.length,
      },
      sourceModule: 'production-tracking-service',
    })

    const chains = traceAllMaterialChains(order, DEMO_STOCK_LEDGER)
    for (const chain of chains.slice(0, 3)) {
      snapshots.push({
        kind: 'PURCHASE_CHAIN',
        entityId: `${order.id}-${chain.stockCardId}`,
        label: `${order.orderNo} / ${chain.stockCardId}`,
        attributes: {
          stages: chain.links.map((l) => l.stage),
          complete: chain.complete,
          remainingQty: chain.remainingQty,
        },
        sourceModule: 'purchase-chain-service',
      })
    }
  }

  return snapshots
}

export function getTextileEntityCount(): number {
  return collectTextileEntitySnapshots().length
}

export function getTextileEntitiesByKind(kind: TextileEntitySnapshot['kind']): TextileEntitySnapshot[] {
  return collectTextileEntitySnapshots().filter((s) => s.kind === kind)
}
