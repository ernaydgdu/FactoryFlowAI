import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { canAccessRoute, canManageUsers } from '@/domain/platform/iam/permission-policy'
import { coerceKeplerRole, type UserAccount } from '@/domain/platform/iam/types'
import {
  clearRuntimeTenantContext,
  setRuntimeTenantContext,
} from '@/domain/platform/tenant/tenant-context.runtime'
import { DEFAULT_TENANT_ID } from '@/domain/platform/tenant/types'
import {
  AUTH_TOKEN_KEY,
  clearAuthSession,
  getStoredUser,
  saveAuthSession,
  type AuthUser,
} from '@/services/auth'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  canAccess: (pathname: string) => boolean
  canManageUsers: boolean
  login: (accessToken: string, user: UserAccount) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthUser(user: UserAccount): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    factoryId: user.factoryId,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setRuntimeTenantContext({
        tenantId: DEFAULT_TENANT_ID,
        factoryId: stored.factoryId,
        userId: stored.id,
        userEmail: stored.email,
        role: stored.role,
      })
    }
  }, [])

  const login = useCallback((accessToken: string, account: UserAccount) => {
    const authUser = toAuthUser(account)
    saveAuthSession({ access_token: accessToken, user: authUser })
    setRuntimeTenantContext({
      tenantId: DEFAULT_TENANT_ID,
      factoryId: account.factoryId,
      userId: account.id,
      userEmail: account.email,
      role: account.role,
    })
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    clearRuntimeTenantContext()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const role = coerceKeplerRole(user?.role)
    return {
      user,
      isAuthenticated: Boolean(user && localStorage.getItem(AUTH_TOKEN_KEY)),
      canAccess: (pathname: string) => canAccessRoute(role, pathname),
      canManageUsers: canManageUsers(role),
      login,
      logout,
    }
  }, [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
