import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

import { useAuth } from '@/application/platform/iam/auth-context'
import { canAccessRoute } from '@/domain/platform/iam/permission-policy'
import type { KeplerRole } from '@/domain/platform/iam/types'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, canAccess } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
      return
    }

    const role = (user?.role ?? 'VIEWER') as KeplerRole
    if (!canAccessRoute(role, location.pathname)) {
      navigate('/dashboard', { replace: true })
    }
  }, [location.pathname, navigate, location, isAuthenticated, user?.role, canAccess])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && !canAccess(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
