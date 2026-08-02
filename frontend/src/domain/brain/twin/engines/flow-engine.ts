/**
 * Flow Engine — siparişin hangi aşamada olduğunu takip eder.
 */
import { SALES_ORDERS } from '../../../data/orders'
import { getOrderTimeline } from '../../../platform/services/timeline-service'
import { ORDER_STATUS_TO_FLOW, PRODUCTION_FLOW_STAGES } from '../constants'
import type { OrderFlowState, ProductionFlowStage } from '../types'

export function resolveOrderFlow(orderId: string): OrderFlowState | undefined {
  const order = SALES_ORDERS.find((o) => o.id === orderId)
  if (!order) return undefined

  const currentStage = mapOrderToFlowStage(order)
  const currentIndex = PRODUCTION_FLOW_STAGES.indexOf(currentStage)
  const completedStages = PRODUCTION_FLOW_STAGES.slice(0, currentIndex)
  const pendingStages = PRODUCTION_FLOW_STAGES.slice(currentIndex + 1)

  const timeline = getOrderTimeline(orderId)
  const lastEvent = timeline[timeline.length - 1]

  let blockedAt: ProductionFlowStage | undefined
  let blockerReason: string | undefined

  if (order.fabricStatus === 'Eksik' || order.fabricStatus === 'Bekliyor') {
    blockedAt = 'CUTTING'
    blockerReason = 'Kumaş teslimatı bekleniyor'
  } else if (order.accessoryStatus === 'Eksik') {
    blockedAt = 'SEWING'
    blockerReason = 'Aksesuar eksik'
  } else if (order.terminRisk && order.productionStatus === 'Üretimde') {
    blockedAt = currentStage
    blockerReason = 'Termin riski — kapasite veya malzeme'
  }

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    currentStage,
    completedStages,
    pendingStages,
    blockedAt,
    blockerReason,
    lastTimelineEventId: lastEvent?.id,
    progressPercent: order.progress,
  }
}

function mapOrderToFlowStage(order: (typeof SALES_ORDERS)[0]): ProductionFlowStage {
  const base = ORDER_STATUS_TO_FLOW[order.productionStatus] ?? 'ORDER_RECEIVED'
  if (order.production.wasteQty > 0 && order.production.secondQualityQty > 0) return 'QUALITY'
  if (order.fabricStatus === 'Hazır' && order.productionStatus === 'Üretimde') return 'SEWING'
  return base
}

export function getOrdersAtStage(stage: ProductionFlowStage): OrderFlowState[] {
  return SALES_ORDERS.map((o) => resolveOrderFlow(o.id)).filter(
    (f): f is OrderFlowState => f !== undefined && f.currentStage === stage,
  )
}

export function getBlockedOrders(): OrderFlowState[] {
  return SALES_ORDERS.map((o) => resolveOrderFlow(o.id)).filter(
    (f): f is OrderFlowState => f !== undefined && f.blockedAt !== undefined,
  )
}
