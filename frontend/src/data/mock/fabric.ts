export type FabricCard = {
  id: string
  code: string
  name: string
  composition: string
  width: string
  weight: string
  supplier: string
  color: string
  status: 'Aktif' | 'Pasif'
}

export type FabricStock = {
  id: string
  code: string
  name: string
  lot: string
  rollNo: string
  batch: string
  color: string
  width: number
  weight: number
  warehouse: string
  quantity: number
  unit: string
  reserved: number
  freeStock: number
  pendingOrder: number
  status: 'Normal' | 'Kritik' | 'Fazla'
}

export type FabricMovement = {
  id: string
  date: string
  code: string
  name: string
  type: 'Giriş' | 'Çıkış' | 'Transfer'
  quantity: number
  unit: string
  reference: string
  fromWarehouse: string
  toWarehouse: string
}

const FABRIC_NAMES = [
  '12 oz Indigo Denim',
  'French Terry Fleece',
  'Stretch Chino Twill',
  'Poplin Woven',
  'Rib Knit Black',
  'Corduroy 8W',
  'Interlock Jersey',
  'Mesh Athletic',
  'Waffle Knit',
  'Tencel Blend',
]

const COLORS = ['Indigo', 'Black', 'Navy', 'White', 'Grey Melange', 'Khaki', 'Stone', 'Ecru']
const WAREHOUSES = ['Hammadde Deposu', 'Kesimhane', 'Boyahane', 'Atölye A', 'Atölye B']

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

export const fabricCards: FabricCard[] = Array.from({ length: 42 }, (_, i) => ({
  id: String(i + 1),
  code: `KMS-${String(100 + i).padStart(4, '0')}`,
  name: pick(FABRIC_NAMES, i),
  composition: i % 2 === 0 ? '%98 Cotton %2 Elastane' : '%100 Cotton',
  width: `${140 + (i % 4) * 5} cm`,
  weight: `${200 + (i % 8) * 20} g/m²`,
  supplier: pick(['Arvind Mills', 'Bossa', 'Isko', 'Kipas', 'Sanko'], i),
  color: pick(COLORS, i),
  status: i % 9 === 0 ? 'Pasif' : 'Aktif',
}))

export const fabricStock: FabricStock[] = Array.from({ length: 48 }, (_, i) => {
  const qty = 400 + (i % 15) * 180
  const reserved = Math.floor(qty * (0.2 + (i % 5) * 0.1))
  const pending = Math.floor(reserved * 0.6)
  const free = qty - reserved
  return {
    id: String(i + 1),
    code: `KMS-${String(100 + (i % 42)).padStart(4, '0')}`,
    name: pick(FABRIC_NAMES, i),
    lot: `LOT-${String(2400 + i).padStart(4, '0')}`,
    rollNo: `TOP-${String(880 + i).padStart(4, '0')}`,
    batch: `P-${String(120 + (i % 30)).padStart(3, '0')}`,
    color: pick(COLORS, i),
    width: 145 + (i % 3) * 5,
    weight: 240 + (i % 6) * 15,
    warehouse: pick(WAREHOUSES, i),
    quantity: qty,
    unit: i % 3 === 0 ? 'kg' : 'm',
    reserved,
    freeStock: free,
    pendingOrder: pending,
    status: free < 100 ? 'Kritik' : free > qty * 0.7 ? 'Fazla' : 'Normal',
  }
})

export const fabricMovements: FabricMovement[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  date: new Date(2026, 2, 1 + (i % 28)).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  code: `KMS-${String(100 + (i % 42)).padStart(4, '0')}`,
  name: pick(FABRIC_NAMES, i),
  type: pick(['Giriş', 'Çıkış', 'Transfer'] as const, i),
  quantity: 50 + (i % 10) * 45,
  unit: i % 3 === 0 ? 'kg' : 'm',
  reference: i % 3 === 0 ? `PO-KMS-${8800 + i}` : i % 3 === 1 ? `UE-2026-${100 + i}` : `TRF-${4400 + i}`,
  fromWarehouse: pick(WAREHOUSES, i),
  toWarehouse: pick(WAREHOUSES, i + 1),
}))

export const fabricKpis = [
  { label: 'Kumaş Kartı', value: String(fabricCards.length), hint: 'Aktif tanım' },
  { label: 'Toplam Stok', value: '42.8K m', hint: 'Tüm depolar' },
  { label: 'Kritik Stok', value: String(fabricStock.filter((s) => s.status === 'Kritik').length), hint: 'Min altı kalem' },
  { label: 'Rezerve', value: '18.2K m', hint: 'Sipariş bağlı' },
]
