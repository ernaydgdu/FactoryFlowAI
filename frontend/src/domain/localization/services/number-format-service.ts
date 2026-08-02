import type { FormatNumberOptions, RegionSettings } from '../types'

function splitNumberParts(value: number, fractionDigits: number): { intPart: string; decPart: string } {
  const fixed = value.toFixed(fractionDigits)
  const [intPart, decPart = ''] = fixed.split('.')
  return { intPart, decPart }
}

function applyThousandsSeparator(intPart: string, separator: string): string {
  if (!separator) return intPart
  const negative = intPart.startsWith('-')
  const digits = negative ? intPart.slice(1) : intPart
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return negative ? `-${grouped}` : grouped
}

export function formatNumber(
  value: number,
  region: RegionSettings,
  options?: FormatNumberOptions,
): string {
  const minFrac = options?.minimumFractionDigits ?? 0
  const maxFrac = options?.maximumFractionDigits ?? 2
  const useGrouping = options?.useGrouping ?? true

  const { intPart, decPart } = splitNumberParts(value, maxFrac)
  const groupedInt = useGrouping
    ? applyThousandsSeparator(intPart, region.thousandsSeparator)
    : intPart

  if (maxFrac === 0 || (decPart === '00' && minFrac === 0)) {
    return groupedInt
  }

  const trimmedDec = decPart.padEnd(maxFrac, '0').slice(0, maxFrac)
  return `${groupedInt}${region.decimalSeparator}${trimmedDec}`
}

export function formatPercent(
  value: number,
  region: RegionSettings,
  fractionDigits = 1,
): string {
  return `${formatNumber(value, region, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`
}

export function parseNumber(value: string, region: RegionSettings): number | null {
  const normalized = value
    .replace(new RegExp(`\\${region.thousandsSeparator}`, 'g'), '')
    .replace(region.decimalSeparator, '.')

  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

export function formatInteger(value: number, region: RegionSettings): string {
  return formatNumber(Math.round(value), region, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
