/**
 * Localization Engine — i18n/l10n orchestrator.
 * UI katmanı yalnızca bu servisi (veya alt servisleri) çağırır.
 * Domain enum/status kodları burada çevrilmez; yalnızca gösterim anında translate edilir.
 */
import { COMMON_TRANSLATION_KEYS } from '../constants'
import {
  formatCurrencyAmount,
  resolveDisplayAmount,
} from './currency-settings-service'
import { formatDate, formatDateTime, formatTime } from './date-time-format-service'
import { formatInteger, formatNumber, formatPercent, parseNumber } from './number-format-service'
import { resolveEffectiveLocalizationContext } from './user-localization-service'
import {
  cmToInch,
  convertUnit,
  inchToCm,
  kgToLbs,
  lbsToKg,
  metersToYards,
  yardsToMeters,
} from './unit-conversion-service'
import { translate, translateStatusCode } from './translation-service'
import type {
  DomainStatusCode,
  EffectiveLocalizationContext,
  FormatCurrencyOptions,
  FormatDateOptions,
  FormatNumberOptions,
  LanguageCode,
  LengthUnitCode,
  TranslationKey,
  TranslationParams,
  UnitConversionRequest,
  WeightUnitCode,
} from '../types'

export type LocalizationEngine = {
  context: EffectiveLocalizationContext
  t: (key: TranslationKey, params?: TranslationParams) => string
  status: (code: DomainStatusCode) => string
  formatDate: (date: Date | string, options?: FormatDateOptions) => string
  formatTime: (date: Date | string) => string
  formatDateTime: (date: Date | string) => string
  formatNumber: (value: number, options?: FormatNumberOptions) => string
  formatInteger: (value: number) => string
  formatPercent: (value: number, fractionDigits?: number) => string
  parseNumber: (value: string) => number | null
  formatCurrency: (amountInBase: number, options?: FormatCurrencyOptions) => string
  formatLength: (value: number, unit: LengthUnitCode) => string
  formatWeight: (value: number, unit: WeightUnitCode) => string
  convertUnit: (request: UnitConversionRequest) => ReturnType<typeof convertUnit>
}

export function createLocalizationEngine(
  userId: string,
  companyId: string,
): LocalizationEngine | undefined {
  const context = resolveEffectiveLocalizationContext(userId, companyId)
  if (!context) return undefined
  return buildEngine(context)
}

export function createLocalizationEngineFromContext(
  context: EffectiveLocalizationContext,
): LocalizationEngine {
  return buildEngine(context)
}

function buildEngine(context: EffectiveLocalizationContext): LocalizationEngine {
  const { languageCode, region, currency } = context
  const fallback: LanguageCode = 'en'

  return {
    context,

    t(key: TranslationKey, params?: TranslationParams) {
      return translate(key, languageCode, params, fallback)
    },

    status(code: DomainStatusCode) {
      return translateStatusCode(code, languageCode, fallback)
    },

    formatDate(date: Date | string, options?: FormatDateOptions) {
      return formatDate(date, region, options)
    },

    formatTime(date: Date | string) {
      return formatTime(date, region)
    },

    formatDateTime(date: Date | string) {
      return formatDateTime(date, region)
    },

    formatNumber(value: number, options?: FormatNumberOptions) {
      return formatNumber(value, region, options)
    },

    formatInteger(value: number) {
      return formatInteger(value, region)
    },

    formatPercent(value: number, fractionDigits = 1) {
      return formatPercent(value, region, fractionDigits)
    },

    parseNumber(value: string) {
      return parseNumber(value, region)
    },

    formatCurrency(amountInBase: number, options?: FormatCurrencyOptions) {
      const displayAmount = resolveDisplayAmount(amountInBase, currency, options)
      return formatCurrencyAmount(displayAmount, currency, options)
    },

    formatLength(value: number, unit: LengthUnitCode) {
      const unitKey = `unit.${unit}` as TranslationKey
      const label = translate(unitKey, languageCode, undefined, fallback)
      return `${formatNumber(value, region, { maximumFractionDigits: 2 })} ${label}`
    },

    formatWeight(value: number, unit: WeightUnitCode) {
      const unitKey = `unit.${unit}` as TranslationKey
      const label = translate(unitKey, languageCode, undefined, fallback)
      return `${formatNumber(value, region, { maximumFractionDigits: 2 })} ${label}`
    },

    convertUnit(request: UnitConversionRequest) {
      return convertUnit(request)
    },
  }
}

/** Demo: farklı kullanıcılar aynı veriyi kendi dillerinde görür */
export function demoMultiUserLocalization(): Array<{
  userId: string
  language: LanguageCode
  saveLabel: string
  orderStatus: string
  formattedDate: string
  formattedAmount: string
  fabricLength: string
}> {
  const users = [
    { userId: 'user-planner-001', companyId: 'company-kepler-001' },
    { userId: 'user-ceo-001', companyId: 'company-kepler-001' },
    { userId: 'user-buyer-001', companyId: 'company-kepler-001' },
  ]

  const sampleDate = '2026-03-15'
  const sampleAmount = 12500.5
  const sampleMeters = 1395

  return users
    .map(({ userId, companyId }) => {
      const engine = createLocalizationEngine(userId, companyId)
      if (!engine) return null
      return {
        userId,
        language: engine.context.languageCode,
        saveLabel: engine.t(COMMON_TRANSLATION_KEYS.SAVE),
        orderStatus: engine.status('PRODUCTION_STARTED'),
        formattedDate: engine.formatDate(sampleDate),
        formattedAmount: engine.formatCurrency(sampleAmount),
        fabricLength: engine.formatLength(sampleMeters, engine.context.region.defaultLengthUnit),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
}

export {
  metersToYards,
  yardsToMeters,
  kgToLbs,
  lbsToKg,
  cmToInch,
  inchToCm,
}
