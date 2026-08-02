import { LANGUAGES, getActiveLanguages, getLanguageByCode } from '../data/languages'
import type { Language, LanguageCode } from '../types'

export type LanguageRepository = {
  getAll(): Language[]
  getById(id: string): Language | undefined
  getByCode(code: LanguageCode): Language | undefined
  getActive(): Language[]
  isSupported(code: LanguageCode): boolean
}

export const languageRepository: LanguageRepository = {
  getAll: () => [...LANGUAGES],
  getById: (id) => LANGUAGES.find((l) => l.id === id),
  getByCode: (code) => getLanguageByCode(code),
  getActive: () => getActiveLanguages(),
  isSupported: (code) => getActiveLanguages().some((l) => l.code === code),
}

export function resolveLanguageCode(
  requested: LanguageCode | undefined,
  companyDefault: LanguageCode,
  fallback: LanguageCode,
): LanguageCode {
  if (requested && languageRepository.isSupported(requested)) return requested
  if (languageRepository.isSupported(companyDefault)) return companyDefault
  return fallback
}
