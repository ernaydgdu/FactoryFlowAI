/**
 * Prediction Engine — gelecek projeksiyonları (deterministik, LLM yok).
 */
import { STOCK_CARDS } from '../../../data/stock-cards'
import { workshopRepository } from '../../../master-data'
import { SALES_ORDERS } from '../../../data/orders'
import type { FactoryGraph, Prediction } from '../types'

let predictionCounter = 0

export function generatePredictions(factoryGraph: FactoryGraph): Prediction[] {
  const predictions: Prediction[] = []
  const now = new Date()

  for (const card of STOCK_CARDS.filter((c) => c.category === 'Kumaş' && c.availableQty < 2000)) {
    const dailyConsumption = 120
    const daysUntilStockout = Math.floor(card.availableQty / dailyConsumption)
    if (daysUntilStockout <= 10) {
      predictionCounter += 1
      predictions.push({
        id: `pred-${predictionCounter}`,
        horizon: daysUntilStockout <= 6 ? '6_DAYS' : '10_DAYS',
        horizonDays: daysUntilStockout,
        metric: 'stockLevel',
        predictedEvent: `${card.name} stoku ${daysUntilStockout} gün içinde bitecek`,
        confidence: 72,
        basis: `Mevcut tüketim hızı: ${dailyConsumption} ${card.unit}/gün`,
        sourceIds: ['STOCK_LEDGER', 'PLANNING_ENGINE'],
      })
    }
  }

  for (const w of workshopRepository.getActive()) {
    const utilization = (w.currentLoad / w.monthlyCapacity) * 100
    if (utilization > 80) {
      const daysToOverload = Math.max(3, Math.round((100 - utilization) / 2))
      predictionCounter += 1
      predictions.push({
        id: `pred-${predictionCounter}`,
        horizon: daysToOverload <= 8 ? '8_DAYS' : '14_DAYS',
        horizonDays: daysToOverload,
        metric: 'capacityUtilization',
        predictedEvent: `${w.name} ${daysToOverload} gün içinde kapasite aşımına girecek`,
        confidence: 68,
        basis: `Mevcut doluluk %${Math.round(utilization)}`,
        sourceIds: ['KPI_ENGINE', 'MASTER_DATA'],
      })
    }
  }

  const terminRiskOrders = SALES_ORDERS.filter((o) => o.terminRisk)
  if (terminRiskOrders.length > 0) {
    predictionCounter += 1
    predictions.push({
      id: `pred-${predictionCounter}`,
      horizon: '10_DAYS',
      horizonDays: 10,
      metric: 'terminRisk',
      predictedEvent: `${terminRiskOrders.length} sipariş 10 gün içinde EXF riskine girecek`,
      confidence: 75,
      basis: 'Planlama ve workflow termin analizi',
      sourceIds: ['PLANNING_ENGINE', 'WORKFLOW'],
    })
  }

  void factoryGraph
  void now

  return predictions.sort((a, b) => a.horizonDays - b.horizonDays)
}
