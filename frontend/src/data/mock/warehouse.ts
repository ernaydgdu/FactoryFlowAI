export type WarehouseTransfer = {
  id: string
  transferNo: string
  date: string
  material: string
  materialCode: string
  quantity: number
  unit: string
  fromWarehouse: string
  toWarehouse: string
  orderNo: string
  status: 'Bekliyor' | 'Yolda' | 'Tamamlandı' | 'İptal'
  requestedBy: string
}

export type WarehouseInbound = {
  id: string
  docNo: string
  date: string
  supplier: string
  material: string
  quantity: number
  unit: string
  warehouse: string
  status: 'Bekliyor' | 'Tamamlandı' | 'Kısmi'
}

export type WarehouseOutbound = {
  id: string
  docNo: string
  date: string
  orderNo: string
  material: string
  quantity: number
  unit: string
  warehouse: string
  status: 'Hazırlanıyor' | 'Sevk Edildi' | 'İptal'
}

export type WarehouseCount = {
  id: string
  countNo: string
  warehouse: string
  startDate: string
  endDate: string
  items: number
  variance: number
  status: 'Planlandı' | 'Devam Ediyor' | 'Kapandı'
}

const WAREHOUSES = [
  'Hammadde Deposu',
  'Aksesuar Deposu',
  'Kesimhane',
  'Boyahane',
  'Atölye A',
  'Atölye B',
  'Atölye C',
  'Ütü Paket',
  'Mamül Deposu',
  'Numune Deposu',
  'Fire Deposu',
  'İade Deposu',
]

const MATERIALS = [
  '12 oz Indigo Denim',
  'French Terry Fleece',
  'YKK Metal Zipper',
  'Polyester Thread',
  'Woven Label',
  'Fusible Interlining',
]

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

export const warehouseTransfers: WarehouseTransfer[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  transferNo: `TRF-2026-${String(1000 + i).padStart(4, '0')}`,
  date: new Date(2026, 2, 1 + (i % 28)).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  material: pick(MATERIALS, i),
  materialCode: `MAT-${100 + (i % 20)}`,
  quantity: 50 + (i % 8) * 35,
  unit: i % 3 === 0 ? 'kg' : i % 3 === 1 ? 'm' : 'adet',
  fromWarehouse: pick(WAREHOUSES, i),
  toWarehouse: pick(WAREHOUSES, i + 2),
  orderNo: `SIP-2026-${String(100 + (i % 45)).padStart(4, '0')}`,
  status: pick(['Bekliyor', 'Yolda', 'Tamamlandı', 'İptal'] as const, i),
  requestedBy: pick(['Planlama', 'Kesimhane', 'Atölye A', 'Depo'], i),
}))

export const warehouseInbound: WarehouseInbound[] = Array.from({ length: 42 }, (_, i) => ({
  id: String(i + 1),
  docNo: `MG-2026-${String(800 + i).padStart(4, '0')}`,
  date: new Date(2026, 2, 1 + (i % 28)).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  supplier: pick(['Arvind Mills', 'YKK Türkiye', 'Bossa', 'Coats Türkiye'], i),
  material: pick(MATERIALS, i),
  quantity: 100 + (i % 10) * 80,
  unit: i % 3 === 0 ? 'kg' : i % 3 === 1 ? 'm' : 'adet',
  warehouse: pick(WAREHOUSES.slice(0, 2), i),
  status: pick(['Bekliyor', 'Tamamlandı', 'Kısmi'] as const, i),
}))

export const warehouseOutbound: WarehouseOutbound[] = Array.from({ length: 42 }, (_, i) => ({
  id: String(i + 1),
  docNo: `MC-2026-${String(400 + i).padStart(4, '0')}`,
  date: new Date(2026, 2, 1 + (i % 28)).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  orderNo: `SIP-2026-${String(100 + (i % 45)).padStart(4, '0')}`,
  material: pick(MATERIALS, i),
  quantity: 40 + (i % 9) * 30,
  unit: i % 3 === 0 ? 'kg' : i % 3 === 1 ? 'm' : 'adet',
  warehouse: pick(WAREHOUSES, i),
  status: pick(['Hazırlanıyor', 'Sevk Edildi', 'İptal'] as const, i),
}))

export const warehouseCounts: WarehouseCount[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  countNo: `SYM-2026-${String(10 + i).padStart(3, '0')}`,
  warehouse: pick(WAREHOUSES, i),
  startDate: new Date(2026, 1, 15 + i).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  endDate: new Date(2026, 1, 16 + i).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  items: 80 + (i % 8) * 15,
  variance: (i % 5) - 2,
  status: pick(['Planlandı', 'Devam Ediyor', 'Kapandı'] as const, i),
}))

export const warehouseKpis = [
  { label: 'Depo Sayısı', value: String(WAREHOUSES.length), hint: 'Aktif lokasyon' },
  { label: 'Bugün Transfer', value: String(warehouseTransfers.filter((t) => t.status === 'Yolda').length), hint: 'Devam eden' },
  { label: 'Açık Sayım', value: String(warehouseCounts.filter((c) => c.status === 'Devam Ediyor').length), hint: 'Devam eden' },
  { label: 'Stok Doğruluğu', value: '%98,4', hint: 'Son 30 gün' },
]

export { WAREHOUSES as WAREHOUSE_NAMES }
