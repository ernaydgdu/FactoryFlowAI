import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'QC Dashboard', href: '/quality-management/dashboard' },
  { label: 'Muayene', href: '/quality-management/inspection' },
  { label: 'Rework Queue', href: '/quality-management/rework' },
  { label: 'Hold Queue', href: '/quality-management/hold' },
  { label: 'Timeline', href: '/quality-management/timeline' },
]

export function QualityManagementLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Quality Management</h1>
        <p className="text-sm text-muted-foreground">
          Inspection · QC Plan · Accept / Reject / Rework / Hold · NCR · CAPA iskeleti
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
