import type { KeplerRole, UserAccount, UserAccountStatus } from '@/domain/platform/iam/types'

export type IamLoginCredentials = {
  email: string
  password: string
}

export type IamLoginResult = {
  accessToken: string
  user: UserAccount
}

export type IamCreateUserInput = {
  email: string
  password: string
  fullName: string
  role: KeplerRole
  factoryId: string
}

export type IamUpdateUserInput = {
  fullName?: string
  role?: KeplerRole
  factoryId?: string
  status?: UserAccountStatus
  password?: string
}

export interface IIamRepository {
  login(credentials: IamLoginCredentials): Promise<IamLoginResult>
  getCurrentUser(userId: string): Promise<UserAccount | null>
  listUsers(factoryId?: string): Promise<UserAccount[]>
  createUser(input: IamCreateUserInput, actorUserId: string): Promise<UserAccount>
  updateUser(userId: string, input: IamUpdateUserInput, actorUserId: string): Promise<UserAccount>
}
