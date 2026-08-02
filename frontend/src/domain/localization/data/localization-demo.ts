import { LOCALE_CODES } from '../constants'
import type {
  CompanyLocalizationSettings,
  CurrencySettings,
  LanguageCode,
  RegionSettings,
  UserLocalizationSettings,
} from '../types'

const DEFAULT_REGION_TR: RegionSettings = {
  locale: LOCALE_CODES.TR_TR,
  timezone: 'Europe/Istanbul',
  firstDayOfWeek: 1,
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'H24',
  decimalSeparator: ',',
  thousandsSeparator: '.',
  unitSystem: 'METRIC',
  defaultLengthUnit: 'M',
  defaultWeightUnit: 'KG',
}

const DEFAULT_REGION_EN: RegionSettings = {
  locale: LOCALE_CODES.EN_US,
  timezone: 'America/New_York',
  firstDayOfWeek: 0,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'H12',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  unitSystem: 'IMPERIAL',
  defaultLengthUnit: 'YARD',
  defaultWeightUnit: 'LB',
}

const USD_CURRENCY: CurrencySettings = {
  code: 'USD',
  symbol: '$',
  decimalPlaces: 2,
  displayMode: 'SYMBOL',
  exchangeRateToBase: 1,
}

const TRY_CURRENCY: CurrencySettings = {
  code: 'TRY',
  symbol: '₺',
  decimalPlaces: 2,
  displayMode: 'SYMBOL',
  exchangeRateToBase: 34.5,
}

export const KEPLER_COMPANY_ID = 'company-kepler-001'

export const COMPANY_LOCALIZATION_SETTINGS: CompanyLocalizationSettings[] = [
  {
    companyId: KEPLER_COMPANY_ID,
    defaultLanguageCode: 'tr',
    fallbackLanguageCode: 'en',
    supportedLanguageCodes: ['tr', 'en', 'de'],
    region: DEFAULT_REGION_TR,
    currency: USD_CURRENCY,
    baseCurrencyCode: 'USD',
  },
]

/** Kullanıcı bazlı dil tercihleri — aynı şirkette farklı diller */
export const USER_LOCALIZATION_SETTINGS: UserLocalizationSettings[] = [
  {
    userId: 'user-planner-001',
    companyId: KEPLER_COMPANY_ID,
    languageCode: 'tr',
  },
  {
    userId: 'user-ceo-001',
    companyId: KEPLER_COMPANY_ID,
    languageCode: 'en',
    regionOverrides: {
      locale: LOCALE_CODES.EN_GB,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'H24',
    },
  },
  {
    userId: 'user-buyer-001',
    companyId: KEPLER_COMPANY_ID,
    languageCode: 'en',
    currencyOverrides: {
      code: 'USD',
      symbol: '$',
      displayMode: 'CODE',
      exchangeRateToBase: 1,
    },
  },
]

export function getCompanySettings(companyId: string): CompanyLocalizationSettings | undefined {
  return COMPANY_LOCALIZATION_SETTINGS.find((s) => s.companyId === companyId)
}

export function getUserSettings(userId: string): UserLocalizationSettings | undefined {
  return USER_LOCALIZATION_SETTINGS.find((s) => s.userId === userId)
}

export function getRegionPresetForLanguage(languageCode: LanguageCode): RegionSettings {
  return languageCode === 'tr' ? DEFAULT_REGION_TR : DEFAULT_REGION_EN
}

export { DEFAULT_REGION_TR, DEFAULT_REGION_EN, USD_CURRENCY, TRY_CURRENCY }
