/**
 * Impact Engine — olayın etki analizi. sideEffects = NONE.
 */
import { SALES_ORDERS } from '../../../data/orders'
import { getProductById } from '../../../data/products'
import type { TwinImpactAnalysis, TwinScopeImpact } from '../types'

let impactCounter = 0

export function analyzeMaterialDelayImpact(
  materialLotId: string,
  delayDays: number,
): TwinImpactAnalysis {
  impactCounter += 1
  const affectedOrders: TwinScopeImpact[] = []
  const affectedProductions: TwinScopeImpact[] = []
  const affectedWarehouses: TwinScopeImpact[] = []
  const affectedCosts: TwinScopeImpact[] = []
  const affectedTermins: TwinScopeImpact[] = []

  for (const order of SALES_ORDERS) {
    const product = getProductById(order.productCardId)
    if (!product) continue

    const usesMaterial = product.bom.some((b) => b.stockCardId === materialLotId)
    if (!usesMaterial) continue

    affectedOrders.push({
      scope: 'ORDER',
      entityId: order.id,
      entityLabel: order.orderNo,
      impactLevel: delayDays > 5 ? 'CRITICAL' : delayDays > 2 ? 'HIGH' : 'MEDIUM',
      description: `${materialLotId} gecikmesi siparişi etkiler`,
      estimatedDelayDays: delayDays,
    })

    affectedProductions.push({
      scope: 'PRODUCTION',
      entityId: order.production.workOrderNo,
      entityLabel: order.production.workOrderNo,
      impactLevel: 'HIGH',
      description: 'Üretim başlangıcı kayabilir',
      estimatedDelayDays: delayDays,
    })

    if (order.terminRisk) {
      affectedTermins.push({
        scope: 'TERMIN',
        entityId: order.id,
        entityLabel: order.orderNo,
        impactLevel: 'CRITICAL',
        description: `EXF ${order.general.exf} risk altında`,
        estimatedDelayDays: delayDays,
      })
    }

    affectedCosts.push({
      scope: 'COST',
      entityId: order.id,
      entityLabel: order.orderNo,
      impactLevel: 'MEDIUM',
      description: 'Acil tedarik / mesai maliyeti artışı',
      estimatedCostDelta: delayDays * 2500,
    })
  }

  return {
    analysisId: `impact-${impactCounter}`,
    triggerEvent: `${materialLotId} gecikmesi`,
    triggerResourceId: materialLotId,
    affectedOrders,
    affectedProductions,
    affectedWarehouses,
    affectedCosts,
    affectedTermins,
    summary: `${affectedOrders.length} sipariş, ${affectedTermins.length} termin etkilenecek`,
    generatedAt: new Date().toISOString(),
    sideEffects: 'NONE',
  }
}

export function analyzeWorkshopClosureImpact(workshopCode: string): TwinImpactAnalysis {
  return analyzeMaterialDelayImpact(`workshop-${workshopCode}`, 7)
}
