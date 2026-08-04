import type { CursorPage, PageResult, SaveOptions } from '@/domain/ports/persistence/persistence.types'
import type { PersistedUserAccount } from '@/domain/ports/persistence/persistence-aggregates'
import type { IUserAccountRepository } from '@/domain/ports/persistence/aggregates/user-account.repository'

import { conflictError } from '../in-memory-helpers'

type UserAccountSnapshot = PersistedUserAccount[]

export class UserAccountInMemoryRepository implements IUserAccountRepository {
  private records: PersistedUserAccount[] = []

  captureSnapshot(): UserAccountSnapshot {
    return structuredClone(this.records)
  }

  restoreSnapshot(snapshot: UserAccountSnapshot): void {
    this.records = structuredClone(snapshot)
  }

  findById(tenantId: string, id: string): PersistedUserAccount | null {
    return this.records.find((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedUserAccount | null {
    return this.findById(tenantId, id)
  }

  findByEmail(tenantId: string, email: string): PersistedUserAccount | null {
    return (
      this.records.find(
        (r) => r.tenantId === tenantId && r.email === email && !r.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedUserAccount,
    options?: SaveOptions,
  ): PersistedUserAccount {
    const idx = this.records.findIndex((r) => r.tenantId === tenantId && r.id === aggregate.id)

    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.records[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('UserAccount', aggregate.id, options.expectedVersion, current.version)
      }
    }

    const next: PersistedUserAccount = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.records[idx]!.version + 1 : aggregate.version,
      updatedAt: new Date().toISOString(),
    }

    if (idx >= 0) {
      this.records[idx] = next
    } else {
      this.records.push(next)
    }

    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.records.findIndex((r) => r.tenantId === tenantId && r.id === id)
    if (idx >= 0) {
      this.records[idx] = {
        ...this.records[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.records.some((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedUserAccount> {
    const items = this.records.filter((r) => r.tenantId === tenantId && !r.deletedAt)
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: Boolean(next) }
  }

  cursorByFactory(
    tenantId: string,
    factoryId: string,
    page: CursorPage,
  ): PageResult<PersistedUserAccount> {
    const items = this.records.filter(
      (r) => r.tenantId === tenantId && r.factoryId === factoryId && !r.deletedAt,
    )
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: Boolean(next) }
  }

  seedAccounts(accounts: PersistedUserAccount[]): void {
    this.records = [...accounts]
  }
}

export const userAccountInMemory = new UserAccountInMemoryRepository()
