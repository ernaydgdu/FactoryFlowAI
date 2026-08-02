import {
  DEFAULT_FALLBACK_LANGUAGE,
  STATUS_TRANSLATION_KEYS,
} from '../constants'
import { DE_TRANSLATIONS, EN_TRANSLATIONS, TR_TRANSLATIONS } from '../data/translations'
import { languageRepository } from '../repositories/language-repository'
import type {
  DomainStatusCode,
  LanguageCode,
  TranslationBundle,
  TranslationKey,
  TranslationParams,
} from '../types'

const BUNDLES: Record<LanguageCode, TranslationBundle> = {
  tr: TR_TRANSLATIONS,
  en: EN_TRANSLATIONS,
  de: DE_TRANSLATIONS,
  fr: EN_TRANSLATIONS,
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  )
}

export function getTranslationBundle(languageCode: LanguageCode): TranslationBundle {
  return BUNDLES[languageCode] ?? BUNDLES[DEFAULT_FALLBACK_LANGUAGE]
}

export function translate(
  key: TranslationKey,
  languageCode: LanguageCode,
  params?: TranslationParams,
  fallbackLanguageCode: LanguageCode = DEFAULT_FALLBACK_LANGUAGE,
): string {
  const primary = getTranslationBundle(languageCode)[key]
  if (primary) return interpolate(primary, params)

  const fallback = getTranslationBundle(fallbackLanguageCode)[key]
  if (fallback) return interpolate(fallback, params)

  return key
}

/** Domain status kodunu ekranda göstermek için çevirir — domain katmanında kod değişmez */
export function translateStatusCode(
  statusCode: DomainStatusCode,
  languageCode: LanguageCode,
  fallbackLanguageCode?: LanguageCode,
): string {
  const key = STATUS_TRANSLATION_KEYS[statusCode]
  return translate(key, languageCode, undefined, fallbackLanguageCode)
}

export function hasTranslation(key: TranslationKey, languageCode: LanguageCode): boolean {
  return key in getTranslationBundle(languageCode)
}

export function getSupportedTranslationLanguages(): LanguageCode[] {
  return languageRepository.getActive().map((l) => l.code)
}

export function registerTranslationBundle(
  languageCode: LanguageCode,
  bundle: TranslationBundle,
): void {
  BUNDLES[languageCode] = { ...BUNDLES[languageCode], ...bundle }
}
