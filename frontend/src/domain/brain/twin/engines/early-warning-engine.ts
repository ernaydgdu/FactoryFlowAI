/**
 * Early Warning Engine — risk oluşmadan uyarı.
 */
import { STOCK_CARDS } from '../../../data/stock-cards'
import type { EarlyWarning, Prediction } from '../types'

let warningCounter = 0

export function generateEarlyWarnings(predictions: Prediction[]): EarlyWarning[] {
  const warnings: EarlyWarning[] = []

  for (const pred of predictions) {
    if (pred.metric === 'stockLevel' && pred.horizonDays <= 6) {
      warningCounter += 1
      warnings.push({
        id: `warn-${warningCounter}`,
        severity: pred.horizonDays <= 3 ? 'CRITICAL' : 'WARNING',
        title: 'Stok tükenme uyarısı',
        message: `Kumaş mevcut hızla tüketilirse ${pred.horizonDays} gün sonra stok bitecek.`,
        triggerMetric: 'stockConsumptionRate',
        thresholdValue: 0,
        projectedDaysUntil: pred.horizonDays,
        recommendedActions: [
          'Acil PO oluşturmayı değerlendir',
          'Alternatif stok kartı kontrol et',
          'Satın alma ekibini bilgilendir',
        ],
        generatedAt: new Date().toISOString(),
      })
    }

    if (pred.metric === 'capacityUtilization') {
      warningCounter += 1
      warnings.push({
        id: `warn-${warningCounter}`,
        severity: 'WARNING',
        title: 'Kapasite aşımı erken uyarı',
        message: pred.predictedEvent,
        triggerMetric: 'capacityUtilization',
        thresholdValue: 90,
        projectedDaysUntil: pred.horizonDays,
        recommendedActions: [
          'Fason atölye alternatiflerini değerlendir',
          'Sipariş önceliklendirme toplantısı planla',
        ],
        generatedAt: new Date().toISOString(),
      })
    }
  }

  for (const card of STOCK_CARDS.filter((c) => c.availableQty < c.minOrderQty * 2)) {
    warningCounter += 1
    warnings.push({
      id: `warn-${warningCounter}`,
      severity: 'WARNING',
      title: `Minimum stok uyarısı — ${card.code}`,
      message: `${card.name}: mevcut ${card.availableQty} ${card.unit}, minimum seviyeye yaklaşıyor`,
      triggerMetric: 'minStockLevel',
      thresholdValue: card.minOrderQty,
      projectedDaysUntil: 5,
      recommendedActions: ['Stok ikmal planı oluştur'],
      generatedAt: new Date().toISOString(),
    })
  }

  return warnings
}
