import type { Language, LanguageCode } from '../types'

export const LANGUAGES: Language[] = [
  {
    id: 'lang-tr',
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    direction: 'ltr',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'lang-en',
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'lang-de',
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'lang-fr',
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    status: 'Inactive',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

export function getLanguageByCode(code: LanguageCode): Language | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

export function getActiveLanguages(): Language[] {
  return LANGUAGES.filter((l) => l.status === 'Active')
}
