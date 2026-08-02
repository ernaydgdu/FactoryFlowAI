export type ShipmentRecord = {
  id: string
  shipmentNo: string
  orderNo: string
  customer: string
  style: string
  quantity: number
  exfDate: string
  carrier: string
  status: 'Hazırlanıyor' | 'Yolda' | 'Teslim Edildi'
}

export const shipmentRecords: ShipmentRecord[] = [
  { id: '1', shipmentNo: 'SVK-2026-0201', orderNo: 'SIP-2026-0129', customer: 'DeFacto', style: 'SS26 Polo Basic', quantity: 6400, exfDate: '05 Mar 2026', carrier: 'DHL Freight', status: 'Hazırlanıyor' },
  { id: '2', shipmentNo: 'SVK-2026-0198', orderNo: 'SIP-2026-0112', customer: 'Mango TR', style: 'AW25 Knit Dress', quantity: 3200, exfDate: '28 Feb 2026', carrier: 'Maersk', status: 'Yolda' },
  { id: '3', shipmentNo: 'SVK-2026-0194', orderNo: 'SIP-2026-0105', customer: 'LC Waikiki', style: 'AW25 Puffer Jacket', quantity: 5100, exfDate: '25 Feb 2026', carrier: 'Ekol Lojistik', status: 'Teslim Edildi' },
  { id: '4', shipmentNo: 'SVK-2026-0204', orderNo: 'SIP-2026-0142', customer: 'Mango TR', style: 'SS26 Denim Jacket', quantity: 4200, exfDate: '12 Mar 2026', carrier: 'DHL Freight', status: 'Hazırlanıyor' },
]

export const shippingKpis = [
  { label: 'Bu Hafta Sevkiyat', value: '14', hint: 'Planlanan' },
  { label: 'Yolda', value: '6', hint: 'Aktif sevkiyat' },
  { label: 'Zamanında Teslim', value: '%94,2', hint: 'Son 90 gün' },
  { label: 'Bekleyen Paket', value: '22', hint: 'EXF ≤ 7 gün' },
]

export type CostRecord = {
  id: string
  orderNo: string
  style: string
  materialCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  unitCost: number
  margin: number
}

export const costRecords: CostRecord[] = [
  { id: '1', orderNo: 'SIP-2026-0142', style: 'SS26 Denim Jacket', materialCost: 84200, laborCost: 52800, overheadCost: 18600, totalCost: 155600, unitCost: 37.05, margin: 22.4 },
  { id: '2', orderNo: 'SIP-2026-0138', style: 'AW26 Fleece Hoodie', materialCost: 118400, laborCost: 67200, overheadCost: 24800, totalCost: 210400, unitCost: 24.47, margin: 18.9 },
  { id: '3', orderNo: 'SIP-2026-0135', style: 'SS26 Chino Pant', materialCost: 156000, laborCost: 84000, overheadCost: 31200, totalCost: 271200, unitCost: 22.6, margin: 25.1 },
]

export const costKpis = [
  { label: 'Ort. Birim Maliyet', value: '₺28,04', hint: 'Aktif siparişler' },
  { label: 'Malzeme Payı', value: '%58', hint: 'Toplam maliyet' },
  { label: 'İşçilik Payı', value: '%32', hint: 'Toplam maliyet' },
  { label: 'Ort. Marj', value: '%22,1', hint: 'Hedef fiyat' },
]

export type ReportItem = {
  id: string
  name: string
  category: string
  description: string
  frequency: string
  lastRun: string
}

export const reportItems: ReportItem[] = [
  { id: '1', name: 'Günlük Üretim Özeti', category: 'Üretim', description: 'Hat bazlı günlük adet ve verim raporu', frequency: 'Günlük', lastRun: '02 Mar 2026 08:00' },
  { id: '2', name: 'Termin Riski Raporu', category: 'Planlama', description: 'EXF yaklaşan siparişler ve blokajlar', frequency: 'Günlük', lastRun: '02 Mar 2026 07:30' },
  { id: '3', name: 'Kritik Stok Raporu', category: 'Stok', description: 'Min altı kumaş ve aksesuar listesi', frequency: 'Haftalık', lastRun: '01 Mar 2026 09:00' },
  { id: '4', name: 'Maliyet Sapma Analizi', category: 'Maliyet', description: 'Plan vs gerçekleşen maliyet karşılaştırması', frequency: 'Aylık', lastRun: '28 Feb 2026 17:00' },
]

export const aiSuggestions = [
  'SIP-2026-0138 siparişi için kumaş teslimatı gecikmesi termin riski oluşturuyor. Alternatif tedarikçi önerisi hazır.',
  'Hat IST-D01 verimliliği %93,7 — haftalık ortalamanın üzerinde. Kapasite dengelemesi için UE-2026-0135 atanabilir.',
  '12 kalem kritik stok tespit edildi. Otomatik PO taslağı oluşturulabilir.',
]

export const settingsSections = [
  { id: 'company', title: 'Şirket Bilgileri', description: 'Fabrika, vergi ve iletişim ayarları' },
  { id: 'users', title: 'Kullanıcılar & Roller', description: 'Erişim ve yetkilendirme' },
  { id: 'factories', title: 'Fabrikalar', description: 'Üretim tesisleri ve hat tanımları' },
  { id: 'integrations', title: 'Entegrasyonlar', description: 'ERP, lojistik ve tedarik bağlantıları' },
]
