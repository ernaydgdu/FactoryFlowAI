export type QualityRateTone = 'success' | 'warning' | 'danger'

// Kabul edilebilir 2. kalite / fire oranı aralığı genellikle %2-5'tir
// (bkz. backend/src/knowledge/textile-library.ts — "ikinci-kalite-nedir", "fire-orani-hesaplama").
export function getQualityRateTone(percent: number): QualityRateTone {
  if (percent <= 2) return 'success'
  if (percent <= 5) return 'warning'
  return 'danger'
}

export const QUALITY_RATE_TONE_CLASS: Record<QualityRateTone, string> = {
  success: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
  warning: 'border-amber-500/40 text-amber-700 dark:text-amber-400',
  danger: 'border-destructive/40 text-destructive',
}
