/**
 * Goal Engine — hedef takibi ve sapma raporlama.
 */
import type { BrainGoal, GoalTrackingSnapshot } from '../types/knowledge-reasoning'

const GOALS: BrainGoal[] = [
  {
    id: 'goal-waste-rate',
    companyId: 'company-kepler-001',
    metric: 'wasteRate',
    label: 'Fire Oranı',
    targetValue: 3,
    unit: '%',
    direction: 'BELOW',
    active: true,
  },
  {
    id: 'goal-termin-risk',
    companyId: 'company-kepler-001',
    metric: 'terminRiskCount',
    label: 'Termin Riski Sipariş Sayısı',
    targetValue: 3,
    unit: 'adet',
    direction: 'BELOW',
    active: true,
  },
  {
    id: 'goal-capacity',
    companyId: 'company-kepler-001',
    metric: 'capacityUtilization',
    label: 'Kapasite Kullanımı',
    targetValue: 85,
    unit: '%',
    direction: 'BELOW',
    active: true,
  },
]

export function getActiveGoals(companyId: string): BrainGoal[] {
  return GOALS.filter((g) => g.companyId === companyId && g.active)
}

export function trackGoal(goal: BrainGoal, currentValue: number): GoalTrackingSnapshot {
  const deviation = currentValue - goal.targetValue
  let onTrack = false

  switch (goal.direction) {
    case 'BELOW':
      onTrack = currentValue <= goal.targetValue
      break
    case 'ABOVE':
      onTrack = currentValue >= goal.targetValue
      break
    case 'EQUAL':
      onTrack = Math.abs(deviation) < 0.01
      break
  }

  return {
    goalId: goal.id,
    currentValue,
    targetValue: goal.targetValue,
    deviation,
    onTrack,
    trackedAt: new Date().toISOString(),
    suggestedActions: onTrack
      ? ['Hedef dahilinde — rutin takip devam']
      : buildDeviationActions(goal, deviation),
  }
}

export function trackAllGoals(
  companyId: string,
  metrics: Record<string, number>,
): GoalTrackingSnapshot[] {
  return getActiveGoals(companyId).map((goal) => {
    const current = metrics[goal.metric] ?? 0
    return trackGoal(goal, current)
  })
}

function buildDeviationActions(goal: BrainGoal, deviation: number): string[] {
  if (goal.metric === 'wasteRate') {
    return [
      'Fire neden analizi başlat',
      'Kesim verimliliği raporunu incele',
      'BOM tüketim sapmasını kontrol et',
    ]
  }
  if (goal.metric === 'terminRiskCount') {
    return [
      'Termin riski siparişlerini önceliklendir',
      'Planlama ekibi ile kapasite toplantısı',
    ]
  }
  if (goal.metric === 'capacityUtilization') {
    return [
      'Fason atölye alternatiflerini değerlendir',
      deviation > 0 ? 'Yük dengeleme planı oluştur' : 'Boş kapasite değerlendir',
    ]
  }
  return ['Sapma analizi gerekli']
}
