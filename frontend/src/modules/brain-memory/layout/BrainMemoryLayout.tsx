import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Coverage', href: '/brain-memory/coverage' },
  { label: 'Records', href: '/brain-memory/records' },
  { label: 'Indexes', href: '/brain-memory/indexes' },
  { label: 'Queries', href: '/brain-memory/queries' },
  { label: 'Decisions', href: '/brain-memory/decisions' },
  { label: 'Timeline Replay', href: '/brain-memory/timeline' },
]

export function BrainMemoryLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kepler Brain — Manufacturing Memory</h1>
        <p className="text-sm text-muted-foreground">
          Immutable enterprise memory · append-only · no LLM · Knowledge → … → Simulation → Memory
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
