import {
  coerceKeplerRole,
  DEFAULT_FACTORY_ID,
  normalizeKeplerRole,
  type KeplerRole,
} from '@/domain/platform/iam/types'

export const AUTH_TOKEN_KEY = 'kepler_token'
export const AUTH_USER_KEY = 'kepler_user'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: KeplerRole
  factoryId: string
}

export type LoginResponse = {
  access_token: string
  user: AuthUser
}

export type LoginCredentials = {
  email: string
  password: string
}

export class LoginFailedError extends Error {
  constructor(message = 'E-posta veya şifre hatalı.') {
    super(message)
    this.name = 'LoginFailedError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeStoredUser(raw: unknown): AuthUser | null {
  if (!isRecord(raw)) {
    return null
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  const fullName = typeof raw.fullName === 'string' ? raw.fullName.trim() : ''

  if (!id || !email || !fullName) {
    return null
  }

  const role = coerceKeplerRole(raw.role)
  const factoryId =
    typeof raw.factoryId === 'string' && raw.factoryId.trim()
      ? raw.factoryId.trim()
      : DEFAULT_FACTORY_ID

  return { id, email, fullName, role, factoryId }
}

function persistStoredUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function saveAuthSession(response: LoginResponse): void {
  localStorage.setItem(AUTH_TOKEN_KEY, response.access_token)
  persistStoredUser(response.user)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    const normalized = normalizeStoredUser(parsed)

    if (!normalized) {
      clearAuthSession()
      return null
    }

    if (isRecord(parsed)) {
      const mappedRole = normalizeKeplerRole(parsed.role)
      const rawFactoryId =
        typeof parsed.factoryId === 'string' ? parsed.factoryId.trim() : undefined
      const needsMigration =
        parsed.role !== normalized.role ||
        rawFactoryId !== normalized.factoryId ||
        mappedRole === null

      if (needsMigration) {
        persistStoredUser(normalized)
      }
    }

    return normalized
  } catch {
    clearAuthSession()
    return null
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}
