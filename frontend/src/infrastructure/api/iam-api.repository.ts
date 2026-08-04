import type {
  IIamRepository,
  IamCreateUserInput,
  IamLoginCredentials,
  IamLoginResult,
  IamUpdateUserInput,
} from '@/domain/ports/platform/iam.repository.port'
import type { KeplerRole, UserAccount } from '@/domain/platform/iam/types'
import { UserAccountDomainError } from '@/domain/platform/iam/user-account.service'
import { api, isAxiosError } from '@/services/api'

type ApiUser = {
  id: string | number
  email: string
  fullName: string
  role: string
  factoryId: string
}

function mapUser(raw: ApiUser): UserAccount {
  return {
    id: String(raw.id),
    email: raw.email,
    fullName: raw.fullName,
    role: raw.role as KeplerRole,
    factoryId: raw.factoryId,
    status: 'ACTIVE',
  }
}

export class IamApiRepository implements IIamRepository {
  async login(credentials: IamLoginCredentials): Promise<IamLoginResult> {
    try {
      const { data } = await api.post<{ access_token: string; user: ApiUser }>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      if (!data?.access_token || !data?.user) {
        throw new UserAccountDomainError('E-posta veya şifre hatalı.')
      }

      return {
        accessToken: data.access_token,
        user: mapUser(data.user),
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        throw new UserAccountDomainError('E-posta veya şifre hatalı.')
      }
      throw err
    }
  }

  async getCurrentUser(_userId: string): Promise<UserAccount | null> {
    try {
      const { data } = await api.get<ApiUser>('/auth/me')
      return mapUser(data)
    } catch {
      return null
    }
  }

  async listUsers(factoryId?: string): Promise<UserAccount[]> {
    const { data } = await api.get<ApiUser[]>('/users', {
      params: factoryId ? { factoryId } : undefined,
    })
    return data.map(mapUser)
  }

  async createUser(input: IamCreateUserInput, _actorUserId: string): Promise<UserAccount> {
    try {
      const { data } = await api.post<ApiUser>('/users', input)
      return mapUser(data)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        throw new UserAccountDomainError('Bu e-posta adresi zaten kayıtlı.')
      }
      throw err
    }
  }

  async updateUser(userId: string, input: IamUpdateUserInput, _actorUserId: string): Promise<UserAccount> {
    try {
      const { data } = await api.patch<ApiUser>(`/users/${userId}`, input)
      return mapUser(data)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        throw new UserAccountDomainError('Kullanıcı bulunamadı.')
      }
      throw err
    }
  }
}

export const iamApiRepository = new IamApiRepository()
