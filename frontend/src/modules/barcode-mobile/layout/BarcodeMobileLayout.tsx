import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const SUB_NAV = [
  { label: 'Barcode Dashboard', href: '/barcode-mobile/dashboard' },
  { label: 'Mobile Operator', href: '/barcode-mobile/operator' },
  { label: 'Scanner', href: '/barcode-mobile/scanner' },
  { label: 'Bundle Scan', href: '/barcode-mobile/bundle' },
  { label: 'Material Scan', href: '/barcode-mobile/material' },
  { label: 'Finished Goods', href: '/barcode-mobile/finished-goods' },
  { label: 'Quality Scan', href: '/barcode-mobile/quality' },
  { label: 'Warehouse Scan', href: '/barcode-mobile/warehouse' },
]

export function BarcodeMobileLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Barcode & Mobile</h1>
        <p className="text-sm text-muted-foreground">
          QR · GS1-128 iskeleti · Bundle/Pallet Label · Operation/Material/FG Scan · PWA iskeleti
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
