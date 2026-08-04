import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Operatör', href: '/shop-floor/operator' },
  { label: 'Workstation', href: '/shop-floor/workstation' },
  { label: 'Operasyon', href: '/shop-floor/operations' },
  { label: 'Bundle', href: '/shop-floor/bundles' },
  { label: 'Deklarasyon', href: '/shop-floor/declaration' },
  { label: 'Makine', href: '/shop-floor/machines' },
  { label: 'İşçilik', href: '/shop-floor/labor' },
  { label: 'Timeline', href: '/shop-floor/timeline' },
]

export function ShopFloorLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Shop Floor (MES)</h1>
        <p className="text-sm text-muted-foreground">
          Operatör ekranları — Work Session · Bundle · WIP · Deklarasyon · Tamamlama
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
