import type {
  DateFormatPattern,
  DomainStatusCode,
  LanguageCode,
  LengthUnitCode,
  LocaleCode,
  TranslationKey,
  WeightUnitCode,
} from './types'

export const LANGUAGE_CODES = {
  TR: 'tr',
  EN: 'en',
  DE: 'de',
  FR: 'fr',
} as const satisfies Record<string, LanguageCode>

export const LOCALE_CODES = {
  TR_TR: 'tr-TR',
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  DE_DE: 'de-DE',
  FR_FR: 'fr-FR',
} as const satisfies Record<string, LocaleCode>

export const DEFAULT_FALLBACK_LANGUAGE: LanguageCode = LANGUAGE_CODES.EN

export const STATUS_TRANSLATION_KEY_PREFIX = 'status.'

/** Domain status → translation key (status codes are never translated in domain) */
export const STATUS_TRANSLATION_KEYS: Record<DomainStatusCode, TranslationKey> = {
  ORDER_CREATED: 'status.ORDER_CREATED',
  ORDER_CONFIRMED: 'status.ORDER_CONFIRMED',
  ORDER_CANCELLED: 'status.ORDER_CANCELLED',
  PRODUCTION_PLANNED: 'status.PRODUCTION_PLANNED',
  PRODUCTION_STARTED: 'status.PRODUCTION_STARTED',
  CUTTING_STARTED: 'status.CUTTING_STARTED',
  SEWING_STARTED: 'status.SEWING_STARTED',
  WASHING_STARTED: 'status.WASHING_STARTED',
  QUALITY_CHECK: 'status.QUALITY_CHECK',
  PACKAGING_STARTED: 'status.PACKAGING_STARTED',
  SHIPPED: 'status.SHIPPED',
  INVOICED: 'status.INVOICED',
  CANCELLED: 'status.CANCELLED',
  DRAFT: 'status.DRAFT',
  ACTIVE: 'status.ACTIVE',
  OBSOLETE: 'status.OBSOLETE',
  PENDING: 'status.PENDING',
  APPROVED: 'status.APPROVED',
  REJECTED: 'status.REJECTED',
}

export const COMMON_TRANSLATION_KEYS = {
  SAVE: 'common.save',
  DELETE: 'common.delete',
  CANCEL: 'common.cancel',
  EDIT: 'common.edit',
  CREATE: 'common.create',
  SEARCH: 'common.search',
  FILTER: 'common.filter',
  EXPORT: 'common.export',
  ORDER: 'common.order',
  ORDERS: 'common.orders',
  PRODUCT: 'common.product',
  CUSTOMER: 'common.customer',
  QUANTITY: 'common.quantity',
  DATE: 'common.date',
  STATUS: 'common.status',
  YES: 'common.yes',
  NO: 'common.no',
} as const satisfies Record<string, TranslationKey>

export const DATE_FORMAT_PATTERNS: DateFormatPattern[] = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
]

/** Metre cinsinden dönüşüm faktörleri */
export const LENGTH_TO_METERS: Record<LengthUnitCode, number> = {
  M: 1,
  CM: 0.01,
  MM: 0.001,
  YARD: 0.9144,
  INCH: 0.0254,
  FT: 0.3048,
}

/** Kilogram cinsinden dönüşüm faktörleri */
export const WEIGHT_TO_KG: Record<WeightUnitCode, number> = {
  KG: 1,
  G: 0.001,
  LB: 0.453592,
  OZ: 0.0283495,
}

export const METRIC_LENGTH_UNITS: LengthUnitCode[] = ['M', 'CM', 'MM']
export const IMPERIAL_LENGTH_UNITS: LengthUnitCode[] = ['YARD', 'INCH', 'FT']
export const METRIC_WEIGHT_UNITS: WeightUnitCode[] = ['KG', 'G']
export const IMPERIAL_WEIGHT_UNITS: WeightUnitCode[] = ['LB', 'OZ']
