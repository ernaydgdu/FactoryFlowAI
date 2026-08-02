export type OrderRecord = {
  id: string
  orderNo: string
  customer: string
  style: string
  season: string
  quantity: number
  exfDate: string
  status: 'Planlama' | 'Üretimde' | 'Tamamlandı' | 'Sevk Edildi'
  factory: string
}

export const orderRecords: OrderRecord[] = [
  { id: '1', orderNo: 'SIP-2026-0142', customer: 'Mango TR', style: 'SS26 Denim Jacket', season: 'SS26', quantity: 4200, exfDate: '12 Mar 2026', status: 'Üretimde', factory: 'İstanbul' },
  { id: '2', orderNo: 'SIP-2026-0138', customer: 'LC Waikiki', style: 'AW26 Fleece Hoodie', season: 'AW26', quantity: 8600, exfDate: '08 Mar 2026', status: 'Üretimde', factory: 'Bursa' },
  { id: '3', orderNo: 'SIP-2026-0135', customer: 'Koton', style: 'SS26 Chino Pant', season: 'SS26', quantity: 12000, exfDate: '15 Mar 2026', status: 'Planlama', factory: 'İzmir' },
  { id: '4', orderNo: 'SIP-2026-0129', customer: 'DeFacto', style: 'SS26 Polo Basic', season: 'SS26', quantity: 6400, exfDate: '05 Mar 2026', status: 'Tamamlandı', factory: 'İstanbul' },
  { id: '5', orderNo: 'SIP-2026-0124', customer: 'Zara Home TR', style: 'SS26 Woven Shirt', season: 'SS26', quantity: 3100, exfDate: '20 Mar 2026', status: 'Planlama', factory: 'Bursa' },
  { id: '6', orderNo: 'SIP-2026-0118', customer: 'H&M TR', style: 'SS26 Cargo Short', season: 'SS26', quantity: 9800, exfDate: '14 Mar 2026', status: 'Üretimde', factory: 'İstanbul' },
]

export const orderKpis = [
  { label: 'Toplam Sipariş', value: '142', hint: 'Aktif portföy' },
  { label: 'Bu Ay EXF', value: '38', hint: 'Mart 2026' },
  { label: 'Üretimde', value: '67', hint: 'Açık emirler' },
  { label: 'Termin Riski', value: '8', hint: '7 gün içinde EXF' },
]

export const newOrderDefaults = {
  customers: ['Mango TR', 'LC Waikiki', 'Koton', 'DeFacto', 'H&M TR'],
  factories: ['İstanbul Fabrika', 'Bursa Fabrika', 'İzmir Fabrika'],
  seasons: ['SS26', 'AW26', 'SS27'],
  productTypes: ['Denim', 'Knit', 'Woven', 'Outerwear'],
}
