/**
 * IAM seed bootstrap — default pilot users (hashed credentials).
 */
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { hashPassword } from '@/domain/platform/iam/password-hash'
import { DEFAULT_FACTORY_ID } from '@/domain/platform/iam/types'
import type { PersistedUserAccount } from '@/domain/ports/persistence/persistence-aggregates'

import { userAccountInMemory } from './aggregates/user-account.in-memory.repository'

const SEED_USERS: {
  id: string
  email: string
  password: string
  fullName: string
  role: PersistedUserAccount['role']
}[] = [
  {
    id: 'user-admin-001',
    email: 'admin@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Sistem Yöneticisi',
    role: 'ADMIN',
  },
  {
    id: 'user-manager-001',
    email: 'manager@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Fabrika Müdürü',
    role: 'MANAGER',
  },
  {
    id: 'user-planner-001',
    email: 'planner@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Planlama Uzmanı',
    role: 'PLANNER',
  },
  {
    id: 'user-operator-001',
    email: 'operator@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Atölye Operatörü',
    role: 'SHOP_FLOOR_OPERATOR',
  },
  {
    id: 'user-viewer-001',
    email: 'viewer@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Rapor İzleyici',
    role: 'VIEWER',
  },
]

let seeded = false

export async function ensureUserAccountsSeeded(): Promise<void> {
  if (seeded) return

  const uow = requireUnitOfWork()
  const tenantId = DEFAULT_TENANT_ID
  const existing = uow.userAccounts.cursor(tenantId, {}, { limit: 1 })

  if (existing.items.length > 0) {
    seeded = true
    return
  }

  const now = new Date().toISOString()
  const accounts: PersistedUserAccount[] = []

  for (const seed of SEED_USERS) {
    const { hash, salt } = await hashPassword(seed.password)
    accounts.push({
      id: seed.id,
      tenantId,
      email: seed.email,
      fullName: seed.fullName,
      role: seed.role,
      factoryId: DEFAULT_FACTORY_ID,
      status: 'ACTIVE',
      passwordHash: hash,
      passwordSalt: salt,
      version: 1,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  userAccountInMemory.seedAccounts(accounts)
  seeded = true
}

export function resetUserAccountSeedForTests(): void {
  seeded = false
}
