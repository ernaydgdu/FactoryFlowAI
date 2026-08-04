import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Invoices', href: '/commercial-documents/invoices' },
  { label: 'Document Sets', href: '/commercial-documents/sets' },
  { label: 'Issue Wizard', href: '/commercial-documents/issue' },
]

export function CommercialDocumentsLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Commercial & Export Documents</h1>
        <p className="text-sm text-muted-foreground">
          Commercial Invoice · COO · Inspection · B/L · Export Declaration
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
