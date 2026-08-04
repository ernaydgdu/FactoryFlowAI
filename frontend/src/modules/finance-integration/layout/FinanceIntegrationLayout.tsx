import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Timeline', href: '/finance-integration/timeline' },
  { label: 'Posting Queue', href: '/finance-integration/queue' },
  { label: 'Results', href: '/finance-integration/results' },
  { label: 'Failed', href: '/finance-integration/failed' },
  { label: 'GL Mapping', href: '/finance-integration/gl-mapping' },
]

export function FinanceIntegrationLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Finance Integration</h1>
        <p className="text-sm text-muted-foreground">
          Operational events → double-entry journals · posting · reverse · GL map
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
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
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
