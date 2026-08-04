import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Coverage', href: '/brain-planning/coverage' },
  { label: 'Plans', href: '/brain-planning/plans' },
  { label: 'Sequencing', href: '/brain-planning/sequencing' },
  { label: 'Allocation', href: '/brain-planning/allocation' },
  { label: 'Risk & Path', href: '/brain-planning/risk' },
  { label: 'Explanation', href: '/brain-planning/explanation' },
]

export function BrainPlanningLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kepler Brain — Manufacturing Planning</h1>
        <p className="text-sm text-muted-foreground">
          Executable plan recommendations · no LLM · Knowledge → Reasoning → Planning · sideEffects=NONE
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
