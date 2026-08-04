import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { logCreate, logUpdate } from '@/domain/platform/services/audit-service'
import { hashPassword, verifyPassword } from './password-hash'
import type {
  AuthSession,
  CreateUserAccountInput,
  KeplerRole,
  UpdateUserAccountInput,
  UserAccount,
} from './types'
import { KEPLER_ROLES } from './types'

export class UserAccountDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserAccountDomainError'
  }
}

function toPublicUser(record: {
  id: string
  email: string
  fullName: string
  role: KeplerRole
  factoryId: string
  status: 'ACTIVE' | 'DISABLED'
}): UserAccount {
  return {
    id: record.id,
    email: record.email,
    fullName: record.fullName,
    role: record.role,
    factoryId: record.factoryId,
    status: record.status,
  }
}

function assertValidRole(role: string): asserts role is KeplerRole {
  if (!KEPLER_ROLES.includes(role as KeplerRole)) {
    throw new UserAccountDomainError(`Geçersiz rol: ${role}`)
  }
}

function assertValidEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserAccountDomainError('Geçersiz e-posta adresi.')
  }
}

function assertValidPassword(password: string): void {
  if (password.length < 8) {
    throw new UserAccountDomainError('Şifre en az 8 karakter olmalıdır.')
  }
}

export async function authenticateUser(
  tenantId: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const uow = requireUnitOfWork()
  const account = uow.userAccounts.findByEmail(tenantId, email.trim().toLowerCase())

  if (!account || account.status !== 'ACTIVE' || account.deletedAt) {
    throw new UserAccountDomainError('E-posta veya şifre hatalı.')
  }

  const valid = await verifyPassword(password, account.passwordHash, account.passwordSalt)
  if (!valid) {
    throw new UserAccountDomainError('E-posta veya şifre hatalı.')
  }

  const user = toPublicUser(account)
  return {
    accessToken: crypto.randomUUID(),
    user,
    issuedAt: new Date().toISOString(),
  }
}

export async function createUserAccount(
  tenantId: string,
  input: CreateUserAccountInput,
  actorUserId: string,
): Promise<UserAccount> {
  assertValidEmail(input.email)
  assertValidPassword(input.password)
  assertValidRole(input.role)

  const { hash, salt } = await hashPassword(input.password)
  return persistCreateUserAccount(tenantId, input, hash, salt, actorUserId)
}

export function persistCreateUserAccount(
  tenantId: string,
  input: CreateUserAccountInput,
  passwordHash: string,
  passwordSalt: string,
  actorUserId: string,
): UserAccount {
  const uow = requireUnitOfWork()
  const normalizedEmail = input.email.trim().toLowerCase()

  if (uow.userAccounts.findByEmail(tenantId, normalizedEmail)) {
    throw new UserAccountDomainError('Bu e-posta adresi zaten kayıtlı.')
  }

  const now = new Date().toISOString()
  const id = `user-${crypto.randomUUID()}`

  const saved = uow.userAccounts.save(tenantId, {
    id,
    tenantId,
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    role: input.role,
    factoryId: input.factoryId,
    status: 'ACTIVE',
    passwordHash,
    passwordSalt,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })

  logCreate(
    'UserAccount',
    id,
    { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' },
    { email: saved.email, role: saved.role, factoryId: saved.factoryId },
  )

  return toPublicUser(saved)
}

export async function updateUserAccount(
  tenantId: string,
  userId: string,
  input: UpdateUserAccountInput,
  actorUserId: string,
): Promise<UserAccount> {
  if (input.password) {
    assertValidPassword(input.password)
  }
  if (input.role) {
    assertValidRole(input.role)
  }

  let passwordHash: string | undefined
  let passwordSalt: string | undefined

  if (input.password) {
    const hashed = await hashPassword(input.password)
    passwordHash = hashed.hash
    passwordSalt = hashed.salt
  }

  return persistUpdateUserAccount(tenantId, userId, input, actorUserId, passwordHash, passwordSalt)
}

export function persistUpdateUserAccount(
  tenantId: string,
  userId: string,
  input: UpdateUserAccountInput,
  actorUserId: string,
  passwordHash?: string,
  passwordSalt?: string,
): UserAccount {
  const uow = requireUnitOfWork()
  const existing = uow.userAccounts.findById(tenantId, userId)

  if (!existing || existing.deletedAt) {
    throw new UserAccountDomainError('Kullanıcı bulunamadı.')
  }

  const saved = uow.userAccounts.save(
    tenantId,
    {
      ...existing,
      fullName: input.fullName?.trim() ?? existing.fullName,
      role: input.role ?? existing.role,
      factoryId: input.factoryId ?? existing.factoryId,
      status: input.status ?? existing.status,
      passwordHash: passwordHash ?? existing.passwordHash,
      passwordSalt: passwordSalt ?? existing.passwordSalt,
    },
    { expectedVersion: existing.version },
  )

  logUpdate(
    'UserAccount',
    userId,
    { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' },
    {
      fullName: existing.fullName,
      role: existing.role,
      factoryId: existing.factoryId,
      status: existing.status,
    },
    {
      fullName: saved.fullName,
      role: saved.role,
      factoryId: saved.factoryId,
      status: saved.status,
      passwordChanged: Boolean(input.password),
    },
  )

  return toPublicUser(saved)
}

export function listUserAccounts(tenantId: string, factoryId?: string): UserAccount[] {
  const uow = requireUnitOfWork()
  const page = { limit: 500 }

  const result = factoryId
    ? uow.userAccounts.cursorByFactory(tenantId, factoryId, page)
    : uow.userAccounts.cursor(tenantId, {}, page)

  return result.items
    .filter((item) => !item.deletedAt && item.status === 'ACTIVE')
    .map(toPublicUser)
}

export function getUserAccountById(tenantId: string, userId: string): UserAccount | null {
  const uow = requireUnitOfWork()
  const record = uow.userAccounts.findById(tenantId, userId)
  if (!record || record.deletedAt) {
    return null
  }
  return toPublicUser(record)
}

export { DEFAULT_TENANT_ID }
