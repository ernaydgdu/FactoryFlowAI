import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  ClipboardList,
  Factory,
  FileBarChart,
  Layers,
  LayoutDashboard,
  Package,
  Scissors,
  Settings,
  Shirt,
  Truck,
  Warehouse,
  Wallet,
} from 'lucide-react'

export type NavLinkItem = {
  title: string
  href: string
}

export type NavGroup = {
  title: string
  icon: LucideIcon
  items: NavLinkItem[]
}

export const dashboardNavItem = {
  title: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
}

export const navGroups: NavGroup[] = [
  {
    title: 'Sipariş & Merchandising',
    icon: ClipboardList,
    items: [
      { title: 'Sipariş Listesi', href: '/orders' },
      { title: 'Yeni Sipariş', href: '/orders/new' },
      { title: 'Merchandising', href: '/merchandising' },
      { title: 'MRP', href: '/planning/mrp' },
      { title: 'Satın Alma', href: '/purchasing' },
    ],
  },
  {
    title: 'Ürün Kartları',
    icon: Layers,
    items: [
      { title: 'Ürün Kartları', href: '/products' },
      { title: 'Beden Setleri', href: '/planning/size-sets' },
    ],
  },
  {
    title: 'Kumaş Yönetimi',
    icon: Shirt,
    items: [
      { title: 'Kumaş Kartları', href: '/fabric/cards' },
      { title: 'Kumaş Girişi (Top)', href: '/fabric/receipt' },
      { title: 'Kumaş Stokları', href: '/fabric/stock' },
      { title: 'Kumaş Hareketleri', href: '/fabric/movements' },
    ],
  },
  {
    title: 'Aksesuar Yönetimi',
    icon: Package,
    items: [
      { title: 'Aksesuar Kartları', href: '/accessories/cards' },
      { title: 'Aksesuar Stokları', href: '/accessories/stock' },
    ],
  },
  {
    title: 'Kesim & Pastal',
    icon: Scissors,
    items: [
      { title: 'Kesim Emirleri', href: '/cutting' },
    ],
  },
  {
    title: 'Üretim Planlama',
    icon: Factory,
    items: [
      { title: 'Dashboard', href: '/production-planning/dashboard' },
      { title: 'Üretim Takvimi', href: '/production-planning/calendar' },
      { title: 'Üretim Emirleri', href: '/production-planning/orders' },
      { title: 'Üretim Programı', href: '/production-planning/schedule' },
      { title: 'Kapasite Planlama', href: '/production-planning/capacity' },
      { title: 'Atölye Planlama', href: '/production-planning/workshops' },
      { title: 'Hat Planlama', href: '/production-planning/lines' },
      { title: 'Günlük Üretim Girişi', href: '/production-planning/daily-entry' },
      { title: 'Operasyon Takibi', href: '/production-planning/operations' },
      { title: 'Üretim Timeline', href: '/production-planning/timeline' },
    ],
  },
  {
    title: 'Üretim Emri Yaşam Döngüsü',
    icon: Factory,
    items: [
      { title: 'Üretim Emirleri', href: '/production-order-lifecycle/orders' },
      { title: 'Siparişten Oluştur', href: '/production-order-lifecycle/create' },
      { title: 'Günlük Üretim Girişi', href: '/production-order-lifecycle/daily-entry' },
    ],
  },
  {
    title: 'Execution Platform',
    icon: Factory,
    items: [
      { title: 'Dashboard', href: '/execution-platform/dashboard' },
      { title: 'Bundle Board', href: '/execution-platform/bundles' },
      { title: 'Operasyon Board', href: '/execution-platform/operations' },
      { title: 'Work Session', href: '/execution-platform/work-sessions' },
      { title: 'Günlük Giriş', href: '/execution-platform/daily-entry' },
      { title: 'WIP Monitor', href: '/execution-platform/wip' },
      { title: 'Kalite Gate', href: '/execution-platform/quality' },
      { title: 'Timeline', href: '/execution-platform/timeline' },
      { title: 'Split', href: '/execution-platform/split' },
      { title: 'Takvim', href: '/execution-platform/calendar' },
      { title: 'Brain Console', href: '/execution-platform/brain' },
    ],
  },
  {
    title: 'Depo',
    icon: Warehouse,
    items: [
      { title: 'Envanter Dashboard', href: '/inventory' },
      { title: 'Depo Yönetimi', href: '/warehouse' },
      { title: 'Stok Sorgulama', href: '/inventory/stock-inquiry' },
      { title: 'Stok Ledger', href: '/inventory/ledger' },
      { title: 'Mal Kabul (GR)', href: '/warehouse/inbound' },
      { title: 'Mal Çıkış', href: '/warehouse/outbound' },
      { title: 'Transfer', href: '/warehouse/transfer' },
      { title: 'Rezervasyon', href: '/warehouse/reservation' },
      { title: 'Sayım', href: '/warehouse/count' },
    ],
  },
  {
    title: 'Sevkiyat',
    icon: Truck,
    items: [
      { title: 'Sevkiyat Takibi', href: '/shipping' },
      { title: 'Konteyner Planı', href: '/shipping/containers' },
    ],
  },
  {
    title: 'Maliyet Analizi',
    icon: Wallet,
    items: [{ title: 'Maliyet Özeti', href: '/cost' }],
  },
  {
    title: 'Raporlar',
    icon: FileBarChart,
    items: [{ title: 'Rapor Merkezi', href: '/reports' }],
  },
  {
    title: 'Kepler AI',
    icon: Bot,
    items: [{ title: 'AI Asistan', href: '/ai' }],
  },
]

export const footerNavItems = [
  {
    title: 'Ayarlar',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Master Data',
    href: '/master-data',
    icon: Layers,
  },
]

export const appConfig = {
  name: 'KEPLER',
  product: 'ERP',
  tagline: 'Fason Tekstil Üretim Platformu',
} as const

export const routeTitles: Record<string, string> = {
  '/dashboard': 'Kontrol Paneli',
  '/orders': 'Sipariş Listesi',
  '/orders/new': 'Yeni Sipariş',
  '/merchandising': 'Merchandising',
  '/purchasing': 'Satın Alma',
  '/products': 'Ürün Kartları',
  '/planning/mrp': 'MRP',
  '/planning/size-sets': 'Beden Setleri',
  '/fabric/cards': 'Kumaş Kartları',
  '/fabric/receipt': 'Kumaş Girişi',
  '/fabric/stock': 'Kumaş Stokları',
  '/fabric/movements': 'Kumaş Hareketleri',
  '/accessories/cards': 'Aksesuar Kartları',
  '/accessories/stock': 'Aksesuar Stokları',
  '/cutting': 'Kumaş Kesimi',
  '/production/orders': 'Üretim Emirleri',
  '/production/sewing': 'Dikim Takibi',
  '/production/washing': 'Yıkama Takibi',
  '/production/lines': 'Hat Planlama',
  '/production/operations': 'Operasyon Takibi',
  '/quality': 'Kalite Kontrol',
  '/quality/inline': 'Inline Inspection',
  '/quality/midline': 'Midline Inspection',
  '/quality/final': 'Final Inspection',
  '/packaging': 'Paketleme',
  '/production-order-lifecycle/orders': 'Üretim Emri Yaşam Döngüsü',
  '/production-order-lifecycle/create': 'Siparişten UE Oluştur',
  '/production-order-lifecycle/daily-entry': 'UE Günlük Üretim',
  '/execution-platform/dashboard': 'Execution Dashboard',
  '/execution-platform/bundles': 'Bundle Board',
  '/execution-platform/operations': 'Operasyon Board',
  '/execution-platform/work-sessions': 'Work Session Monitor',
  '/execution-platform/daily-entry': 'Execution Günlük Giriş',
  '/execution-platform/wip': 'WIP Monitor',
  '/execution-platform/quality': 'Quality Gate Console',
  '/execution-platform/timeline': 'Execution Timeline',
  '/execution-platform/split': 'Split Production',
  '/execution-platform/calendar': 'Production Calendar',
  '/execution-platform/brain': 'Brain Console',
  '/warehouse/outbound': 'Mal Çıkış',
  '/warehouse/count': 'Depo Sayım',
  '/shipping': 'Sevkiyat',
  '/shipping/containers': 'Konteyner Planı',
  '/cost': 'Maliyet Analizi',
  '/reports': 'Raporlar',
  '/ai': 'Kepler AI',
  '/settings': 'Ayarlar',
  '/settings/users': 'Kullanıcılar & Roller',
  '/master-data': 'Master Data',
  '/master-data/customers': 'Müşteriler',
  '/master-data/suppliers': 'Tedarikçiler',
  '/master-data/warehouses': 'Depolar',
  '/master-data/workshops': 'Atölyeler',
  '/master-data/production-lines': 'Üretim Hatları',
  '/master-data/brands': 'Markalar',
  '/master-data/seasons': 'Sezonlar',
  '/master-data/collections': 'Koleksiyonlar',
  '/master-data/color-cards': 'Renk Kartları',
  '/master-data/size-sets': 'Beden Setleri',
}

export function getRouteTitle(pathname: string): string {
  if (pathname.startsWith('/orders/') && pathname !== '/orders/new') {
    return 'Sipariş Detay'
  }
  if (pathname.startsWith('/production-order-lifecycle/orders/')) {
    return 'Üretim Emri Detay'
  }
  if (pathname.startsWith('/products/')) {
    return 'Ürün Kartı Detay'
  }
  if (pathname.startsWith('/merchandising/')) {
    return 'Merchandising Detay'
  }
  if (pathname.startsWith('/purchasing/orders/')) {
    return 'Satın Alma Siparişi'
  }
  return routeTitles[pathname] ?? 'KEPLER ERP'
}
