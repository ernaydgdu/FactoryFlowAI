import type { KeplerRole, UserAccount, UserAccountStatus } from '@/domain/platform/iam/types'

export type IamUserDto = UserAccount

export type LoginDto = {
  email: string
  password: string
}

export type LoginResultDto = {
  accessToken: string
  user: IamUserDto
}

export type CreateUserDto = {
  email: string
  password: string
  fullName: string
  role: KeplerRole
  factoryId: string
}

export type UpdateUserDto = {
  fullName?: string
  role?: KeplerRole
  factoryId?: string
  status?: UserAccountStatus
  password?: string
}

export type PlatformCommandDto = {
  commandKey: string
  payload?: Record<string, unknown>
}
