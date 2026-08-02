import { LOCALE_CODES } from '../constants'
import { getRegionPresetForLanguage } from '../data/localization-demo'
import type { LanguageCode, LocaleCode, RegionSettings } from '../types'

export function createDefaultRegionSettings(languageCode: LanguageCode): RegionSettings {
  return getRegionPresetForLanguage(languageCode)
}

export function mergeRegionSettings(
  base: RegionSettings,
  overrides?: Partial<RegionSettings>,
): RegionSettings {
  if (!overrides) return { ...base }
  return { ...base, ...overrides }
}

export function getLocaleFromLanguage(languageCode: LanguageCode): LocaleCode {
  const map: Record<LanguageCode, LocaleCode> = {
    tr: LOCALE_CODES.TR_TR,
    en: LOCALE_CODES.EN_US,
    de: LOCALE_CODES.DE_DE,
    fr: LOCALE_CODES.FR_FR,
  }
  return map[languageCode]
}

export function isMetricSystem(region: RegionSettings): boolean {
  return region.unitSystem === 'METRIC'
}

export function getTimezone(region: RegionSettings): string {
  return region.timezone
}

export function getDateFormatPattern(region: RegionSettings): string {
  return region.dateFormat
}

export function getFirstDayOfWeek(region: RegionSettings): number {
  return region.firstDayOfWeek
}
