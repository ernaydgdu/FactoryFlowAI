import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Coverage', href: '/brain-knowledge/coverage' },
  { label: 'Dictionary', href: '/brain-knowledge/dictionary' },
  { label: 'Graph', href: '/brain-knowledge/graph' },
  { label: 'Formulae', href: '/brain-knowledge/formulae' },
  { label: 'Rules', href: '/brain-knowledge/rules' },
  { label: 'Flows', href: '/brain-knowledge/flows' },
  { label: 'Decisions', href: '/brain-knowledge/decisions' },
  { label: 'Machines', href: '/brain-knowledge/machines' },
  { label: 'KPIs', href: '/brain-knowledge/kpis' },
]

export function BrainKnowledgeLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kepler Brain — Manufacturing Knowledge</h1>
        <p className="text-sm text-muted-foreground">
          Structured industrial knowledge · no LLM · Knowledge → Reasoning → Planning → Decision →
          Recommendation → Automation
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
