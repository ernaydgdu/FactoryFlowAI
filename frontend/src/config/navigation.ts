import type { LucideIcon } from 'lucide-react'
import { Activity, Boxes, ClipboardList, LayoutDashboard, Star } from 'lucide-react'

export type NavLinkItem = {
  title: string
  href: string
}

export type NavGroup = {
  title: string
  icon: LucideIcon
  items: NavLinkItem[]
}

export type FooterNavItem = NavLinkItem & { icon: LucideIcon }

export const dashboardNavItem = {
  title: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
}

export const navGroups: NavGroup[] = [
  {
    title: 'Sipariş Yönetimi',
    icon: ClipboardList,
    items: [
      { title: 'Sipariş Listesi', href: '/orders' },
      { title: 'Yeni Sipariş', href: '/orders/new' },
    ],
  },
  {
    title: 'Stok Yönetimi',
    icon: Boxes,
    items: [
      { title: 'Stok Yönetimi', href: '/stock' },
      { title: 'Depolar', href: '/warehouses' },
      { title: 'Mamul Envanteri', href: '/finished-goods' },
    ],
  },
  {
    title: 'Üretim',
    icon: Activity,
    items: [{ title: 'Hat Durumu', href: '/line-status' }],
  },
  {
    title: 'Tedarikçi Performansı',
    icon: Star,
    items: [{ title: 'Tedarikçi Performansı', href: '/suppliers' }],
  },
]

export const footerNavItems: FooterNavItem[] = []

export const appConfig = {
  name: 'KEPLER',
  product: 'ERP',
  tagline: 'Fason Tekstil Üretim Platformu',
} as const

export const routeTitles: Record<string, string> = {
  '/dashboard': 'Kontrol Paneli',
  '/orders': 'Sipariş Listesi',
  '/orders/new': 'Yeni Sipariş',
  '/stock': 'Stok Yönetimi',
  '/warehouses': 'Depolar',
  '/finished-goods': 'Mamul Envanteri',
  '/suppliers': 'Tedarikçi Performansı',
  '/line-status': 'Hat Durumu',
}

export function getRouteTitle(pathname: string): string {
  if (pathname.startsWith('/orders/') && pathname !== '/orders/new') {
    return 'Sipariş Detay'
  }
  return routeTitles[pathname] ?? 'KEPLER ERP'
}
