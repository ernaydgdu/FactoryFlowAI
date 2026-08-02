import type { CurrencySettings, FormatCurrencyOptions } from '../types'

export function mergeCurrencySettings(
  base: CurrencySettings,
  overrides?: Partial<CurrencySettings>,
): CurrencySettings {
  if (!overrides) return { ...base }
  return { ...base, ...overrides }
}

export function convertFromBaseCurrency(
  amountInBase: number,
  target: CurrencySettings,
): number {
  if (target.exchangeRateToBase <= 0) return amountInBase
  return amountInBase * target.exchangeRateToBase
}

export function convertToBaseCurrency(
  amount: number,
  source: CurrencySettings,
): number {
  if (source.exchangeRateToBase <= 0) return amount
  return amount / source.exchangeRateToBase
}

export function formatCurrencyAmount(
  amount: number,
  settings: CurrencySettings,
  _options?: FormatCurrencyOptions,
): string {
  const decimalPlaces = settings.decimalPlaces
  const formatted = amount.toFixed(decimalPlaces)

  switch (settings.displayMode) {
    case 'CODE':
      return `${formatted} ${settings.code}`
    case 'NAME':
      return `${formatted} ${settings.code}`
    case 'SYMBOL':
    default:
      return `${settings.symbol}${formatted}`
  }
}

export function resolveDisplayAmount(
  amountInBase: number,
  settings: CurrencySettings,
  options?: FormatCurrencyOptions,
): number {
  if (options?.convertFromBase === false) return amountInBase
  return convertFromBaseCurrency(amountInBase, settings)
}
