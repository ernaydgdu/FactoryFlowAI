import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Dashboard', href: '/production-planning/dashboard' },
  { label: 'Takvim', href: '/production-planning/calendar' },
  { label: 'Üretim Emirleri', href: '/production-planning/orders' },
  { label: 'Program', href: '/production-planning/schedule' },
  { label: 'Kapasite', href: '/production-planning/capacity' },
  { label: 'Atölye', href: '/production-planning/workshops' },
  { label: 'Hat', href: '/production-planning/lines' },
  { label: 'Günlük Giriş', href: '/production-planning/daily-entry' },
  { label: 'Operasyon', href: '/production-planning/operations' },
  { label: 'Timeline', href: '/production-planning/timeline' },
]

export function ProductionPlanningLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Üretim Planlama</h1>
        <p className="text-sm text-muted-foreground">Tekstil fabrikası üretim planlama merkezi</p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b pb-2">
        {SUB_NAV.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
