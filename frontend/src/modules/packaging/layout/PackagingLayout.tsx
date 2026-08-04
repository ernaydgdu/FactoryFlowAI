import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Dashboard', href: '/packaging/dashboard' },
  { label: 'Packing Lists', href: '/packaging/lists' },
  { label: 'Station', href: '/packaging/station' },
]

export function PackagingLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Packaging & Packing List</h1>
        <p className="text-sm text-muted-foreground">
          Carton / Pallet · SSCC · Weight/CBM · FG auto-pack · Shipment binding
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
