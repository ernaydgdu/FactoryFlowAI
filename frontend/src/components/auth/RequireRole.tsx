import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '@/application/platform/iam/auth-context'
import type { KeplerRole } from '@/domain/platform/iam/types'

type RequireRoleProps = {
  children: ReactNode
  roles?: KeplerRole[]
  permission?: 'users.manage'
  fallback?: string
}

export function RequireRole({
  children,
  roles,
  permission,
  fallback = '/dashboard',
}: RequireRoleProps) {
  const { user, canAccess, canManageUsers } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (permission === 'users.manage' && !canManageUsers) {
    return <Navigate to={fallback} replace />
  }

  if (roles && !roles.includes(user.role as KeplerRole)) {
    return <Navigate to={fallback} replace />
  }

  if (!canAccess(location.pathname)) {
    return <Navigate to={fallback} replace />
  }

  return children
}
