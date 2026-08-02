import {
  COMPANY_LOCALIZATION_SETTINGS,
  getCompanySettings,
} from '../data/localization-demo'
import { mergeCurrencySettings } from './currency-settings-service'
import { mergeRegionSettings } from './region-settings-service'
import type { CompanyLocalizationSettings, CurrencySettings, LanguageCode } from '../types'

export function getCompanyLocalizationSettings(
  companyId: string,
): CompanyLocalizationSettings | undefined {
  return getCompanySettings(companyId)
}

export function getAllCompanyLocalizationSettings(): CompanyLocalizationSettings[] {
  return [...COMPANY_LOCALIZATION_SETTINGS]
}

export function getCompanyDefaultLanguage(companyId: string): LanguageCode | undefined {
  return getCompanySettings(companyId)?.defaultLanguageCode
}

export function getCompanySupportedLanguages(companyId: string): LanguageCode[] {
  return getCompanySettings(companyId)?.supportedLanguageCodes ?? []
}

export function getCompanyRegion(companyId: string) {
  const settings = getCompanySettings(companyId)
  if (!settings) return undefined
  return settings.region
}

export function getCompanyCurrency(companyId: string): CurrencySettings | undefined {
  const settings = getCompanySettings(companyId)
  if (!settings) return undefined
  return settings.currency
}

export function updateCompanyLocalizationSettings(
  companyId: string,
  patch: Partial<Omit<CompanyLocalizationSettings, 'companyId'>>,
): CompanyLocalizationSettings | undefined {
  const index = COMPANY_LOCALIZATION_SETTINGS.findIndex((s) => s.companyId === companyId)
  if (index < 0) return undefined

  const current = COMPANY_LOCALIZATION_SETTINGS[index]
  const updated: CompanyLocalizationSettings = {
    ...current,
    ...patch,
    region: patch.region ? mergeRegionSettings(current.region, patch.region) : current.region,
    currency: patch.currency
      ? mergeCurrencySettings(current.currency, patch.currency)
      : current.currency,
  }

  COMPANY_LOCALIZATION_SETTINGS[index] = updated
  return updated
}
