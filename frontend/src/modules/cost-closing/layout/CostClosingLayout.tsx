import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Dashboard', href: '/cost-closing/dashboard' },
  { label: 'Variance', href: '/cost-closing/variance' },
  { label: 'Reconciliation', href: '/cost-closing/reconciliation' },
  { label: 'History', href: '/cost-closing/history' },
]

export function CostClosingLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Cost Closing</h1>
        <p className="text-sm text-muted-foreground">
          Manufacturing financial completion · variance · reconciliation · approval
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
