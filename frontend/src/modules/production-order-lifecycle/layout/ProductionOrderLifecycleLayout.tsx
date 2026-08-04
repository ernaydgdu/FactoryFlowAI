import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Üretim Emirleri', href: '/production-order-lifecycle/orders' },
  { label: 'Durum Panosu', href: '/production-order-lifecycle/board' },
  { label: 'Operasyonlar', href: '/production-order-lifecycle/operations' },
  { label: 'Rezervasyon', href: '/production-order-lifecycle/reservations' },
  { label: 'Siparişten Oluştur', href: '/production-order-lifecycle/create' },
  { label: 'Günlük Üretim', href: '/production-order-lifecycle/daily-entry' },
]

export function ProductionOrderLifecycleLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Üretim Emri Yaşam Döngüsü</h1>
        <p className="text-sm text-muted-foreground">
          Draft → Planned → Approved → Released → In Production → Completed → Closed
        </p>
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
