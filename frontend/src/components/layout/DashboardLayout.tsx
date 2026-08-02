import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { AUTH_TOKEN_KEY } from '@/services/auth'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [location.pathname, navigate, location])

  if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
    return <Navigate to="/login" replace />
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
