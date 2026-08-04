import { Bell, LogOut, Search, User } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

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
import { ERP_NOTIFICATIONS } from '@/domain/data/workflows'
import { useAuth } from '@/application/platform/iam/auth-context'
import { cn } from '@/lib/utils'

export function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const title = getRouteTitle(pathname)
  const unread = ERP_NOTIFICATIONS.filter((n) => !n.read).length

  function handleLogout() {
    logout()
    navigate('/login')
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
            placeholder="Sipariş, model, müşteri ara..."
            className="flex h-9 w-64 rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                  {unread}
                </span>
              ) : null}
              <span className="sr-only">Bildirimler</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>ERP Bildirimleri ({unread} okunmamış)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ERP_NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  to={n.link ?? '#'}
                  className={cn('flex flex-col items-start gap-0.5 py-2', !n.read && 'bg-muted/50')}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <SeverityDot severity={n.severity} />
                    {n.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{n.message}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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

function SeverityDot({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  const colors = {
    critical: 'bg-destructive',
    warning: 'bg-amber-500',
    info: 'bg-primary',
  }
  return <span className={cn('size-2 shrink-0 rounded-full', colors[severity])} />
}
