import { useQuery } from '@tanstack/react-query'
import { Bell, LogOut, Search, User } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appConfig, getRouteTitle } from '@/config/navigation'
import { KEPLER_ROLE_LABELS } from '@/domain/platform/iam/types'
import { useAuth } from '@/application/platform/iam/auth-context'
import { fetchDashboardAlerts } from '@/infrastructure/api/dashboard-api.repository'

export function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const title = getRouteTitle(pathname)
  const [searchValue, setSearchValue] = useState('')

  const alertsQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.alerts(),
    queryFn: fetchDashboardAlerts,
  })
  const actionableAlertCount = (alertsQuery.data ?? []).filter(
    (a) => a.severity === 'HIGH' || a.severity === 'MEDIUM',
  ).length

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const trimmed = searchValue.trim()
    navigate(trimmed ? `/orders?search=${encodeURIComponent(trimmed)}` : '/orders')
  }

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'KU'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {appConfig.product}
        </p>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Sipariş, model, müşteri ara..."
            className="flex h-9 w-64 rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/dashboard')}
          title="Akıllı Uyarılar"
        >
          <Bell className="size-4" />
          {actionableAlertCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {actionableAlertCount}
            </span>
          ) : null}
          <span className="sr-only">Bildirimler</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 gap-2 rounded-full px-2"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">
                {user?.fullName ?? 'Kullanıcı'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.fullName ?? 'Kullanıcı'}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? '—'}
                </p>
                {user?.role ? (
                  <p className="text-xs text-muted-foreground">
                    {KEPLER_ROLE_LABELS[user.role]}
                  </p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
