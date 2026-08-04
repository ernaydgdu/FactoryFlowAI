import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Dashboard', href: '/style-closing/dashboard' },
  { label: 'Checklist', href: '/style-closing/checklist' },
  { label: 'Missing', href: '/style-closing/missing' },
  { label: 'KPI Summary', href: '/style-closing/kpi' },
  { label: 'History', href: '/style-closing/history' },
]

export function StyleClosingLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Style Closing</h1>
        <p className="text-sm text-muted-foreground">
          Final textile style completion · ops · logistics · finance gates
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
