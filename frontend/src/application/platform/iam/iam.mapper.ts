import { resolveIamRepository } from '@/infrastructure/api/iam-repository.factory'
import { UserAccountDomainError } from '@/domain/platform/iam/user-account.service'
import { runIamAdminWriteCommand } from './iam-permission.guard'
import type { CreateUserDto, LoginDto, LoginResultDto, UpdateUserDto } from './iam.dto'

export { UserAccountDomainError }

function iamRepo() {
  return resolveIamRepository()
}

export async function commandLogin(credentials: LoginDto): Promise<LoginResultDto> {
  return iamRepo().login(credentials)
}

export function queryCurrentUser(userId: string) {
  return iamRepo().getCurrentUser(userId)
}

export function queryUserList(factoryId?: string) {
  return iamRepo().listUsers(factoryId)
}

export function commandCreateUser(input: CreateUserDto, actorUserId: string) {
  return runIamAdminWriteCommand(() => iamRepo().createUser(input, actorUserId))
}

export function commandUpdateUser(userId: string, input: UpdateUserDto, actorUserId: string) {
  return runIamAdminWriteCommand(() => iamRepo().updateUser(userId, input, actorUserId))
}
