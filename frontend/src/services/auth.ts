import { api } from '@/services/api'

export const AUTH_TOKEN_KEY = 'kepler_token'
export const AUTH_USER_KEY = 'kepler_user'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: string
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

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials)

  if (!data?.access_token || !data?.user) {
    throw new LoginFailedError()
  }

  return data
}

export function saveAuthSession(response: LoginResponse): void {
  localStorage.setItem(AUTH_TOKEN_KEY, response.access_token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user))
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}
