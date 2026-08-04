import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Dashboard', href: '/barcode-mobile/dashboard' },
  { label: 'Operator', href: '/barcode-mobile/operator' },
  { label: 'Scanner', href: '/barcode-mobile/scanner' },
  { label: 'Receiving', href: '/barcode-mobile/receiving' },
  { label: 'Material Issue', href: '/barcode-mobile/material-issue' },
  { label: 'Production', href: '/barcode-mobile/production' },
  { label: 'FG Receipt', href: '/barcode-mobile/fg-receipt' },
  { label: 'Shipment', href: '/barcode-mobile/shipment' },
  { label: 'Bundle', href: '/barcode-mobile/bundle' },
  { label: 'Material', href: '/barcode-mobile/material' },
  { label: 'Finished Goods', href: '/barcode-mobile/finished-goods' },
]

export function BarcodeMobileLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Barcode & Mobile</h1>
        <p className="text-sm text-muted-foreground">
          GS1 · QR · Receiving / Issue / Production / FG / Shipment · Offline sync · Camera
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
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
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
