import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Boxes,
  ClipboardList,
  Factory,
  FileBarChart,
  Gauge,
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
    title: 'Stok Yönetimi',
    icon: Boxes,
    items: [{ title: 'Stok Yönetimi', href: '/stock' }],
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
      { title: 'Planlama Board', href: '/production-planning/board' },
      { title: 'Kapasite Görünümü', href: '/production-planning/capacity-view' },
      { title: 'Hat Yükü', href: '/production-planning/line-load' },
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
      { title: 'Durum Panosu', href: '/production-order-lifecycle/board' },
      { title: 'Operasyon Listesi', href: '/production-order-lifecycle/operations' },
      { title: 'Malzeme Rezervasyonu', href: '/production-order-lifecycle/reservations' },
      { title: 'Siparişten Oluştur', href: '/production-order-lifecycle/create' },
      { title: 'Günlük Üretim Girişi', href: '/production-order-lifecycle/daily-entry' },
    ],
  },
  {
    title: 'Quality Management',
    icon: Factory,
    items: [
      { title: 'QC Dashboard', href: '/quality-management/dashboard' },
      { title: 'Muayene', href: '/quality-management/inspection' },
      { title: 'Rework Queue', href: '/quality-management/rework' },
      { title: 'Hold Queue', href: '/quality-management/hold' },
      { title: 'Quality Timeline', href: '/quality-management/timeline' },
    ],
  },
  {
    title: 'Barcode & Mobile',
    icon: Factory,
    items: [
      { title: 'Barcode Dashboard', href: '/barcode-mobile/dashboard' },
      { title: 'Mobile Operator', href: '/barcode-mobile/operator' },
      { title: 'Scanner', href: '/barcode-mobile/scanner' },
      { title: 'Receiving Scan', href: '/barcode-mobile/receiving' },
      { title: 'Material Issue', href: '/barcode-mobile/material-issue' },
      { title: 'Production Scan', href: '/barcode-mobile/production' },
      { title: 'FG Receipt Scan', href: '/barcode-mobile/fg-receipt' },
      { title: 'Shipment Scan', href: '/barcode-mobile/shipment' },
    ],
  },
  {
    title: 'Shop Floor (MES)',
    icon: Factory,
    items: [
      { title: 'Operatör Dashboard', href: '/shop-floor/operator' },
      { title: 'Workstation', href: '/shop-floor/workstation' },
      { title: 'Operasyon', href: '/shop-floor/operations' },
      { title: 'Bundle', href: '/shop-floor/bundles' },
      { title: 'Deklarasyon', href: '/shop-floor/declaration' },
      { title: 'Makine Durumu', href: '/shop-floor/machines' },
      { title: 'İşçilik', href: '/shop-floor/labor' },
      { title: 'Timeline', href: '/shop-floor/timeline' },
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
      { title: 'Mamül Kabul', href: '/warehouse/fg-receipt' },
      { title: 'Paketleme Dashboard', href: '/packaging/dashboard' },
      { title: 'Packing Lists', href: '/packaging/lists' },
      { title: 'Packing Station', href: '/packaging/station' },
    ],
  },
  {
    title: 'Sevkiyat',
    icon: Truck,
    items: [
      { title: 'Shipment Dashboard', href: '/shipping/dashboard' },
      { title: 'Shipments', href: '/shipping/shipments' },
      { title: 'Konteyner Planı', href: '/shipping/containers' },
      { title: 'Shipment Station', href: '/shipping/station' },
      { title: 'Commercial Invoices', href: '/commercial-documents/invoices' },
      { title: 'Export Documents', href: '/commercial-documents/sets' },
      { title: 'Issue Wizard', href: '/commercial-documents/issue' },
      { title: 'Export Logistics', href: '/export-logistics/dashboard' },
      { title: 'Export Board', href: '/export-logistics/board' },
      { title: 'Dispatch Wizard', href: '/export-logistics/dispatch' },
    ],
  },
  {
    title: 'Maliyet Analizi',
    icon: Wallet,
    items: [
      { title: 'Maliyet Özeti', href: '/cost' },
      { title: 'Finance Integration', href: '/finance-integration/timeline' },
      { title: 'Posting Queue', href: '/finance-integration/queue' },
      { title: 'GL Mapping', href: '/finance-integration/gl-mapping' },
      { title: 'Cost Closing', href: '/cost-closing/dashboard' },
      { title: 'Variance Analysis', href: '/cost-closing/variance' },
      { title: 'Closing History', href: '/cost-closing/history' },
      { title: 'Style Closing', href: '/style-closing/dashboard' },
      { title: 'Style Checklist', href: '/style-closing/checklist' },
      { title: 'Style History', href: '/style-closing/history' },
    ],
  },
  {
    title: 'Raporlar',
    icon: FileBarChart,
    items: [{ title: 'Rapor Merkezi', href: '/reports' }],
  },
  {
    title: 'Enterprise',
    icon: Gauge,
    items: [
      { title: 'Health', href: '/enterprise/health' },
      { title: 'Bootstrap Diagnostics', href: '/enterprise/bootstrap' },
      { title: 'Performance', href: '/enterprise/performance' },
      { title: 'Audit', href: '/enterprise/audit' },
      { title: 'AI Foundation', href: '/enterprise/ai' },
    ],
  },
  {
    title: 'Kepler AI',
    icon: Bot,
    items: [
      { title: 'Manufacturing Knowledge', href: '/brain-knowledge/coverage' },
      { title: 'Manufacturing Reasoning', href: '/brain-reasoning/coverage' },
      { title: 'Manufacturing Planning', href: '/brain-planning/coverage' },
      { title: 'Manufacturing Simulation', href: '/brain-simulation/coverage' },
      { title: 'Manufacturing Memory', href: '/brain-memory/coverage' },
      { title: 'Dictionary', href: '/brain-knowledge/dictionary' },
      { title: 'Knowledge Graph', href: '/brain-knowledge/graph' },
      { title: 'Formula Library', href: '/brain-knowledge/formulae' },
      { title: 'AI Asistan', href: '/ai' },
    ],
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
  '/stock': 'Stok Yönetimi',
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
  '/packaging/dashboard': 'Packaging Dashboard',
  '/packaging/lists': 'Packing Lists',
  '/packaging/station': 'Packing Station',
  '/production-order-lifecycle/orders': 'Üretim Emri Yaşam Döngüsü',
  '/production-order-lifecycle/board': 'UE Durum Panosu',
  '/production-order-lifecycle/operations': 'UE Operasyon Listesi',
  '/production-order-lifecycle/reservations': 'UE Malzeme Rezervasyonu',
  '/production-order-lifecycle/create': 'Siparişten UE Oluştur',
  '/production-order-lifecycle/daily-entry': 'UE Günlük Üretim',
  '/execution-platform/dashboard': 'Execution Dashboard',
  '/shop-floor/operator': 'Operatör Dashboard',
  '/shop-floor/workstation': 'Workstation',
  '/shop-floor/operations': 'Shop Floor Operasyon',
  '/shop-floor/bundles': 'Shop Floor Bundle',
  '/shop-floor/declaration': 'Production Declaration',
  '/shop-floor/machines': 'Makine Durumu',
  '/shop-floor/labor': 'İşçilik Takibi',
  '/shop-floor/timeline': 'Shop Floor Timeline',
  '/quality-management/dashboard': 'QC Dashboard',
  '/quality-management/inspection': 'Muayene',
  '/quality-management/rework': 'Rework Queue',
  '/quality-management/hold': 'Hold Queue',
  '/quality-management/timeline': 'Quality Timeline',
  '/barcode-mobile/dashboard': 'Barcode Dashboard',
  '/barcode-mobile/operator': 'Mobile Operator',
  '/barcode-mobile/scanner': 'Scanner Screen',
  '/barcode-mobile/receiving': 'Receiving Scan',
  '/barcode-mobile/material-issue': 'Material Issue Scan',
  '/barcode-mobile/production': 'Production Scan',
  '/barcode-mobile/fg-receipt': 'FG Receipt Scan',
  '/barcode-mobile/shipment': 'Shipment Scan',
  '/barcode-mobile/bundle': 'Bundle Scan',
  '/barcode-mobile/material': 'Material Scan',
  '/barcode-mobile/finished-goods': 'Finished Goods Scan',
  '/barcode-mobile/quality': 'Quality Scan',
  '/barcode-mobile/warehouse': 'Warehouse Scan',
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
  '/warehouse/fg-receipt': 'Mamül Kabul',
  '/shipping': 'Sevkiyat',
  '/shipping/dashboard': 'Shipment Dashboard',
  '/shipping/shipments': 'Shipments',
  '/shipping/containers': 'Konteyner Planı',
  '/shipping/station': 'Shipment Station',
  '/commercial-documents': 'Commercial Documents',
  '/commercial-documents/invoices': 'Commercial Invoices',
  '/commercial-documents/sets': 'Export Document Sets',
  '/commercial-documents/issue': 'Issue Wizard',
  '/export-logistics': 'Export Logistics',
  '/export-logistics/dashboard': 'Export Status Dashboard',
  '/export-logistics/board': 'Export Shipment Board',
  '/export-logistics/dispatch': 'Dispatch Wizard',
  '/cost': 'Maliyet Analizi',
  '/finance-integration': 'Finance Integration',
  '/finance-integration/timeline': 'Financial Timeline',
  '/finance-integration/queue': 'Posting Queue',
  '/finance-integration/results': 'Posting Result',
  '/finance-integration/failed': 'Failed Posting',
  '/finance-integration/gl-mapping': 'GL Mapping',
  '/cost-closing': 'Cost Closing',
  '/cost-closing/dashboard': 'Cost Closing Dashboard',
  '/cost-closing/variance': 'Variance Analysis',
  '/cost-closing/reconciliation': 'Reconciliation View',
  '/cost-closing/history': 'Closing History',
  '/style-closing': 'Style Closing',
  '/style-closing/dashboard': 'Style Closing Dashboard',
  '/style-closing/checklist': 'Completion Checklist',
  '/style-closing/missing': 'Missing Requirements',
  '/style-closing/kpi': 'Final KPI Summary',
  '/style-closing/history': 'Historical Closings',
  '/reports': 'Raporlar',
  '/enterprise': 'Enterprise Hardening',
  '/enterprise/health': 'Health Dashboard',
  '/enterprise/bootstrap': 'Bootstrap Diagnostics',
  '/enterprise/performance': 'Performance Dashboard',
  '/enterprise/audit': 'Audit Dashboard',
  '/enterprise/ai': 'AI Foundation',
  '/brain-knowledge': 'Manufacturing Knowledge',
  '/brain-knowledge/coverage': 'Knowledge Coverage',
  '/brain-knowledge/dictionary': 'Textile Dictionary',
  '/brain-knowledge/graph': 'Knowledge Graph',
  '/brain-knowledge/formulae': 'Formula Library',
  '/brain-knowledge/rules': 'Business Rules',
  '/brain-knowledge/flows': 'Production Flows',
  '/brain-knowledge/decisions': 'Decision Library',
  '/brain-knowledge/machines': 'Machine Library',
  '/brain-knowledge/kpis': 'KPI Knowledge',
  '/brain-reasoning': 'Manufacturing Reasoning',
  '/brain-reasoning/coverage': 'Reasoning Coverage',
  '/brain-reasoning/facts': 'Fact Engine',
  '/brain-reasoning/rules': 'Rule Evaluations',
  '/brain-reasoning/constraints': 'Constraints & Formulae',
  '/brain-reasoning/decisions': 'Decision Engine',
  '/brain-reasoning/recommendations': 'Recommendations',
  '/brain-planning': 'Manufacturing Planning',
  '/brain-planning/coverage': 'Planning Coverage',
  '/brain-planning/plans': 'Plan Alternatives',
  '/brain-planning/sequencing': 'Production Sequencing',
  '/brain-planning/allocation': 'Allocations',
  '/brain-planning/risk': 'Risk & Path',
  '/brain-planning/explanation': 'Plan Explanation',
  '/brain-simulation': 'Manufacturing Simulation',
  '/brain-simulation/coverage': 'Simulation Coverage',
  '/brain-simulation/scenarios': 'Scenarios',
  '/brain-simulation/compare': 'Compare Scenarios',
  '/brain-simulation/timeline': 'Timeline',
  '/brain-simulation/impacts': 'Impacts',
  '/brain-memory': 'Manufacturing Memory',
  '/brain-memory/coverage': 'Memory Coverage',
  '/brain-memory/records': 'Memory Records',
  '/brain-memory/indexes': 'Memory Indexes',
  '/brain-memory/queries': 'Memory Queries',
  '/brain-memory/decisions': 'Decision History',
  '/brain-memory/timeline': 'Production Timeline Replay',
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
  if (pathname.startsWith('/quality-management/ncr/')) {
    return 'NCR Detay'
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
  if (
    pathname.startsWith('/warehouse/') &&
    !['/warehouse/inbound', '/warehouse/outbound', '/warehouse/transfer', '/warehouse/reservation', '/warehouse/count', '/warehouse/fg-receipt'].includes(
      pathname,
    )
  ) {
    return 'Depo Detay'
  }
  return routeTitles[pathname] ?? 'KEPLER ERP'
}
