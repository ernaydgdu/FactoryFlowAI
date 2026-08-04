import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Coverage', href: '/brain-reasoning/coverage' },
  { label: 'Facts', href: '/brain-reasoning/facts' },
  { label: 'Rules', href: '/brain-reasoning/rules' },
  { label: 'Constraints', href: '/brain-reasoning/constraints' },
  { label: 'Decisions', href: '/brain-reasoning/decisions' },
  { label: 'Recommendations', href: '/brain-reasoning/recommendations' },
]

export function BrainReasoningLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kepler Brain — Manufacturing Reasoning</h1>
        <p className="text-sm text-muted-foreground">
          Industrial inference engine · no LLM · Facts → Graph → Rules → Formula → Constraint →
          Decision → Recommendation
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
