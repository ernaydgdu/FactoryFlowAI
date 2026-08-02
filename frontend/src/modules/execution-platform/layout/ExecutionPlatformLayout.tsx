import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { ExecutionWorkspaceProvider } from '../context/ExecutionWorkspaceContext'
import { WorkspaceBar } from '../components/WorkspaceBar'

const SUB_NAV = [
  { label: 'Dashboard', href: '/execution-platform/dashboard' },
  { label: 'Bundle Board', href: '/execution-platform/bundles' },
  { label: 'Operasyon', href: '/execution-platform/operations' },
  { label: 'Work Session', href: '/execution-platform/work-sessions' },
  { label: 'Günlük Giriş', href: '/execution-platform/daily-entry' },
  { label: 'WIP', href: '/execution-platform/wip' },
  { label: 'Kalite', href: '/execution-platform/quality' },
  { label: 'Timeline', href: '/execution-platform/timeline' },
  { label: 'Split', href: '/execution-platform/split' },
  { label: 'Takvim', href: '/execution-platform/calendar' },
  { label: 'Brain', href: '/execution-platform/brain' },
]

export function ExecutionPlatformLayout() {
  return (
    <ExecutionWorkspaceProvider>
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Execution Platform</h1>
            <p className="text-sm text-muted-foreground">Shop floor — canlı üretim, bundle, operasyon, kalite</p>
          </div>
        </div>
        <WorkspaceBar />
        <nav className="flex gap-1 overflow-x-auto border-b border-border pb-0.5">
          {SUB_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-primary bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </ExecutionWorkspaceProvider>
  )
}
