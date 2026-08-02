import {
  USER_LOCALIZATION_SETTINGS,
  getUserSettings,
} from '../data/localization-demo'
import { resolveLanguageCode, languageRepository } from '../repositories/language-repository'
import {
  getCompanyLocalizationSettings,
  getCompanyDefaultLanguage,
} from './company-localization-service'
import { mergeCurrencySettings } from './currency-settings-service'
import { getLocaleFromLanguage, mergeRegionSettings } from './region-settings-service'
import type {
  EffectiveLocalizationContext,
  LanguageCode,
  UserLocalizationSettings,
} from '../types'

export function getUserLocalizationSettings(
  userId: string,
): UserLocalizationSettings | undefined {
  return getUserSettings(userId)
}

export function getAllUserLocalizationSettings(): UserLocalizationSettings[] {
  return [...USER_LOCALIZATION_SETTINGS]
}

export function updateUserLocalizationSettings(
  userId: string,
  patch: Partial<Omit<UserLocalizationSettings, 'userId'>>,
): UserLocalizationSettings | undefined {
  const index = USER_LOCALIZATION_SETTINGS.findIndex((s) => s.userId === userId)
  if (index < 0) return undefined

  const current = USER_LOCALIZATION_SETTINGS[index]
  const updated: UserLocalizationSettings = {
    ...current,
    ...patch,
    regionOverrides: patch.regionOverrides
      ? { ...current.regionOverrides, ...patch.regionOverrides }
      : current.regionOverrides,
    currencyOverrides: patch.currencyOverrides
      ? { ...current.currencyOverrides, ...patch.currencyOverrides }
      : current.currencyOverrides,
  }

  USER_LOCALIZATION_SETTINGS[index] = updated
  return updated
}

export function resolveEffectiveLocalizationContext(
  userId: string,
  companyId: string,
): EffectiveLocalizationContext | undefined {
  const company = getCompanyLocalizationSettings(companyId)
  if (!company) return undefined

  const user = getUserSettings(userId)
  const languageCode = resolveLanguageCode(
    user?.languageCode,
    company.defaultLanguageCode,
    company.fallbackLanguageCode,
  )

  const region = mergeRegionSettings(company.region, user?.regionOverrides)
  const locale = region.locale ?? getLocaleFromLanguage(languageCode)
  const currency = mergeCurrencySettings(company.currency, user?.currencyOverrides)

  return {
    userId,
    companyId,
    languageCode,
    locale,
    region: { ...region, locale },
    currency,
    baseCurrencyCode: company.baseCurrencyCode,
  }
}

export function getEffectiveLanguageForUser(userId: string, companyId: string): LanguageCode {
  const companyDefault = getCompanyDefaultLanguage(companyId) ?? 'en'
  const user = getUserSettings(userId)
  return resolveLanguageCode(user?.languageCode, companyDefault, 'en')
}

export function isLanguageAvailableForUser(
  _userId: string,
  companyId: string,
  languageCode: LanguageCode,
): boolean {
  const company = getCompanyLocalizationSettings(companyId)
  if (!company) return false
  if (!company.supportedLanguageCodes.includes(languageCode)) return false
  return languageRepository.isSupported(languageCode)
}
