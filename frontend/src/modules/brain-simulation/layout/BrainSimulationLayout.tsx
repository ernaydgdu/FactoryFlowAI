import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Coverage', href: '/brain-simulation/coverage' },
  { label: 'Scenarios', href: '/brain-simulation/scenarios' },
  { label: 'Compare', href: '/brain-simulation/compare' },
  { label: 'Timeline', href: '/brain-simulation/timeline' },
  { label: 'Impacts', href: '/brain-simulation/impacts' },
]

export function BrainSimulationLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kepler Brain — Manufacturing Simulation</h1>
        <p className="text-sm text-muted-foreground">
          Deterministic what-if engine · no LLM · Current / A / B / C · sideEffects=NONE
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
