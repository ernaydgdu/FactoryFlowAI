import type {
  IIamRepository,
  IamCreateUserInput,
  IamLoginCredentials,
  IamLoginResult,
  IamUpdateUserInput,
} from '@/domain/ports/platform/iam.repository.port'
import type { UserAccount } from '@/domain/platform/iam/types'
import { UserAccountDomainError } from '@/domain/platform/iam/user-account.service'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runDomainCommandInTransaction } from '@/domain/ports/persistence/command-transaction.port'
import { hashPassword } from '@/domain/platform/iam/password-hash'
import {
  authenticateUser,
  getUserAccountById,
  listUserAccounts,
  persistCreateUserAccount,
  persistUpdateUserAccount,
} from '@/domain/platform/iam/user-account.service'

function tenantId(): string {
  return getRuntimeTenantContext().tenantId
}

export class IamInMemoryRepository implements IIamRepository {
  async login(credentials: IamLoginCredentials): Promise<IamLoginResult> {
    const session = await authenticateUser(tenantId(), credentials.email, credentials.password)
    return { accessToken: session.accessToken, user: session.user }
  }

  getCurrentUser(userId: string): Promise<UserAccount | null> {
    return Promise.resolve(getUserAccountById(tenantId(), userId))
  }

  listUsers(factoryId?: string): Promise<UserAccount[]> {
    return Promise.resolve(listUserAccounts(tenantId(), factoryId))
  }

  async createUser(input: IamCreateUserInput, actorUserId: string): Promise<UserAccount> {
    const { hash, salt } = await hashPassword(input.password)
    return runDomainCommandInTransaction(() =>
      persistCreateUserAccount(tenantId(), input, hash, salt, actorUserId),
    )
  }

  async updateUser(
    userId: string,
    input: IamUpdateUserInput,
    actorUserId: string,
  ): Promise<UserAccount> {
    let passwordHash: string | undefined
    let passwordSalt: string | undefined
    if (input.password) {
      const hashed = await hashPassword(input.password)
      passwordHash = hashed.hash
      passwordSalt = hashed.salt
    }
    return runDomainCommandInTransaction(() =>
      persistUpdateUserAccount(
        tenantId(),
        userId,
        input,
        actorUserId,
        passwordHash,
        passwordSalt,
      ),
    )
  }
}

export const iamInMemoryRepository = new IamInMemoryRepository()

export { UserAccountDomainError }
