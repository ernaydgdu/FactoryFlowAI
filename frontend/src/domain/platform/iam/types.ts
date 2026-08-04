/** Kepler IAM — platform identity & access types (Phase 1). */

export const KEPLER_ROLES = [
  'ADMIN',
  'MANAGER',
  'PLANNER',
  'SHOP_FLOOR_OPERATOR',
  'VIEWER',
] as const

export type KeplerRole = (typeof KEPLER_ROLES)[number]

export type UserAccountStatus = 'ACTIVE' | 'DISABLED'

export type UserAccount = {
  id: string
  email: string
  fullName: string
  role: KeplerRole
  factoryId: string
  status: UserAccountStatus
}

export type AuthSession = {
  accessToken: string
  user: UserAccount
  issuedAt: string
}

export type CreateUserAccountInput = {
  email: string
  password: string
  fullName: string
  role: KeplerRole
  factoryId: string
}

export type UpdateUserAccountInput = {
  fullName?: string
  role?: KeplerRole
  factoryId?: string
  status?: UserAccountStatus
  password?: string
}

export const DEFAULT_FACTORY_ID = 'factory-ist-001'

export const KEPLER_ROLE_LABELS: Record<KeplerRole, string> = {
  ADMIN: 'Sistem Yöneticisi',
  MANAGER: 'Fabrika Müdürü',
  PLANNER: 'Planlama',
  SHOP_FLOOR_OPERATOR: 'Atölye Operatörü',
  VIEWER: 'İzleyici',
}

/** Legacy localStorage / backend role aliases → canonical KeplerRole. */
const LEGACY_ROLE_ALIASES: Record<string, KeplerRole> = {
  admin: 'ADMIN',
  manager: 'MANAGER',
  planner: 'PLANNER',
  viewer: 'VIEWER',
  user: 'SHOP_FLOOR_OPERATOR',
  operator: 'SHOP_FLOOR_OPERATOR',
  shop_floor_operator: 'SHOP_FLOOR_OPERATOR',
}

export function isKeplerRole(value: unknown): value is KeplerRole {
  return typeof value === 'string' && (KEPLER_ROLES as readonly string[]).includes(value)
}

export function normalizeKeplerRole(raw: unknown): KeplerRole | null {
  if (typeof raw !== 'string') {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  if (isKeplerRole(trimmed)) {
    return trimmed
  }

  return LEGACY_ROLE_ALIASES[trimmed.toLowerCase()] ?? null
}

export function coerceKeplerRole(raw: unknown): KeplerRole {
  return normalizeKeplerRole(raw) ?? 'VIEWER'
}
