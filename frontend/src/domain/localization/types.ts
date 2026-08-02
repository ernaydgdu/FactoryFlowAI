/** Localization & Regionalization — domain types (language-independent codes) */

// --- Language ---

export type LanguageCode = 'tr' | 'en' | 'de' | 'fr'

export type LocaleCode = `${LanguageCode}-${string}`

export type TextDirection = 'ltr' | 'rtl'

export type Language = {
  id: string
  code: LanguageCode
  name: string
  nativeName: string
  direction: TextDirection
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

export type TranslationKey = string

export type TranslationParams = Record<string, string | number>

export type TranslationNamespace =
  | 'common'
  | 'order'
  | 'production'
  | 'stock'
  | 'status'
  | 'validation'
  | 'navigation'

export type TranslationBundle = Record<TranslationKey, string>

// --- Region ---

export type UnitSystem = 'METRIC' | 'IMPERIAL'

export type LengthUnitCode = 'M' | 'CM' | 'MM' | 'YARD' | 'INCH' | 'FT'

export type WeightUnitCode = 'KG' | 'G' | 'LB' | 'OZ'

export type AreaUnitCode = 'M2' | 'YARD2'

export type DateFormatPattern = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

export type TimeFormatPattern = 'H24' | 'H12'

export type RegionSettings = {
  locale: LocaleCode
  timezone: string
  firstDayOfWeek: 0 | 1 | 6
  dateFormat: DateFormatPattern
  timeFormat: TimeFormatPattern
  decimalSeparator: '.' | ','
  thousandsSeparator: '.' | ',' | ' ' | ''
  unitSystem: UnitSystem
  defaultLengthUnit: LengthUnitCode
  defaultWeightUnit: WeightUnitCode
}

// --- Currency ---

export type CurrencyDisplayMode = 'SYMBOL' | 'CODE' | 'NAME'

export type CurrencySettings = {
  code: string
  symbol: string
  decimalPlaces: number
  displayMode: CurrencyDisplayMode
  /** Şirket baz para birimine göre kur — yalnızca gösterim dönüşümü */
  exchangeRateToBase: number
}

// --- Company & User ---

export type CompanyLocalizationSettings = {
  companyId: string
  defaultLanguageCode: LanguageCode
  fallbackLanguageCode: LanguageCode
  supportedLanguageCodes: LanguageCode[]
  region: RegionSettings
  currency: CurrencySettings
  baseCurrencyCode: string
}

export type UserLocalizationSettings = {
  userId: string
  companyId: string
  /** Boş = şirket varsayılanı */
  languageCode?: LanguageCode
  regionOverrides?: Partial<RegionSettings>
  currencyOverrides?: Partial<CurrencySettings>
}

export type EffectiveLocalizationContext = {
  userId: string
  companyId: string
  languageCode: LanguageCode
  locale: LocaleCode
  region: RegionSettings
  currency: CurrencySettings
  baseCurrencyCode: string
}

// --- Domain status codes (never translated in domain layer) ---

export type DomainStatusCode =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'PRODUCTION_PLANNED'
  | 'PRODUCTION_STARTED'
  | 'CUTTING_STARTED'
  | 'SEWING_STARTED'
  | 'WASHING_STARTED'
  | 'QUALITY_CHECK'
  | 'PACKAGING_STARTED'
  | 'SHIPPED'
  | 'INVOICED'
  | 'CANCELLED'
  | 'DRAFT'
  | 'ACTIVE'
  | 'OBSOLETE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

export type UnitConversionRequest = {
  value: number
  fromUnit: LengthUnitCode | WeightUnitCode | AreaUnitCode
  toUnit: LengthUnitCode | WeightUnitCode | AreaUnitCode
}

export type UnitConversionResult = {
  value: number
  fromUnit: string
  toUnit: string
  factor: number
}

export type FormatNumberOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}

export type FormatCurrencyOptions = {
  /** Gösterim para birimi — boş = context currency */
  currencyCode?: string
  /** Baz para biriminden dönüştür */
  convertFromBase?: boolean
}

export type FormatDateOptions = {
  includeTime?: boolean
  pattern?: DateFormatPattern
}
