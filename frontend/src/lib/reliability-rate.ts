import type { QualityRateTone } from './quality-rate'

// Tedarikçi güvenilirlik skoru renk eşiği: %80+ yeşil, %50-80 turuncu, %50 altı kırmızı.
export function getReliabilityTone(score: number): QualityRateTone {
  if (score >= 80) return 'success'
  if (score >= 50) return 'warning'
  return 'danger'
}
