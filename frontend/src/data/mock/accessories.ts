/** Aksesuar kategorisine göre dinamik form alanları */

export type AccessoryFieldDef = {
  key: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
  unit?: string
}

export const ACCESSORY_FIELD_SCHEMAS: Record<string, AccessoryFieldDef[]> = {
  Fermuar: [
    { key: 'length', label: 'Uzunluk', type: 'text', unit: 'cm' },
    { key: 'type', label: 'Tip', type: 'select', options: ['Metal', 'Nylon', 'Invisible', 'Waterproof'] },
    { key: 'teethType', label: 'Diş Tipi', type: 'select', options: ['Coil', 'Vislon', 'Metal'] },
    { key: 'direction', label: 'Yön', type: 'select', options: ['Sol', 'Sağ', 'İki Yönlü'] },
    { key: 'color', label: 'Renk', type: 'text' },
    { key: 'brand', label: 'Marka', type: 'select', options: ['YKK', 'SBS', 'Riri', 'IDEAL'] },
  ],
  Düğme: [
    { key: 'diameter', label: 'Çap', type: 'number', unit: 'mm' },
    { key: 'holes', label: 'Delik', type: 'select', options: ['2', '4', 'Shank'] },
    { key: 'material', label: 'Malzeme', type: 'select', options: ['Metal', 'Polyester', 'Corozo', 'Plastik'] },
    { key: 'color', label: 'Renk', type: 'text' },
  ],
  İplik: [
    { key: 'number', label: 'Numara', type: 'select', options: ['50', '60', '80', '120', '150'] },
    { key: 'coneWeight', label: 'Cone Gram', type: 'number', unit: 'g' },
    { key: 'material', label: 'Malzeme', type: 'select', options: ['Polyester', 'Cotton', 'Core Spun'] },
    { key: 'color', label: 'Renk', type: 'text' },
  ],
  Etiket: [
    { key: 'labelType', label: 'Tür', type: 'select', options: ['Main', 'Care', 'Size', 'Barcode', 'Hangtag'] },
    { key: 'size', label: 'Ölçü', type: 'text', unit: 'mm' },
    { key: 'language', label: 'Dil', type: 'select', options: ['TR/EN', 'Multi', 'EN Only'] },
    { key: 'barcode', label: 'Barcode', type: 'text' },
  ],
  'Dokuma Etiket': [
    { key: 'width', label: 'En', type: 'number', unit: 'mm' },
    { key: 'fold', label: 'Kat', type: 'select', options: ['Center', 'End', 'Manhattan'] },
    { key: 'color', label: 'Renk', type: 'text' },
  ],
  Tela: [
    { key: 'weight', label: 'Gramaj', type: 'number', unit: 'gsm' },
    { key: 'width', label: 'En', type: 'number', unit: 'cm' },
    { key: 'type', label: 'Tip', type: 'select', options: ['Fusible', 'Non-fusible', 'Stretch'] },
  ],
}

export type AccessoryCard = {
  id: string
  code: string
  name: string
  category: string
  unit: string
  supplier: string
  leadTime: string
  status: 'Aktif' | 'Pasif'
  attributes: Record<string, string | number>
}

export type AccessoryStock = {
  id: string
  code: string
  name: string
  category: string
  warehouse: string
  quantity: number
  unit: string
  reserved: number
  freeStock: number
  minLevel: number
  status: 'Normal' | 'Kritik'
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

const CATEGORIES = Object.keys(ACCESSORY_FIELD_SCHEMAS)

function genAttributes(category: string, index: number): Record<string, string | number> {
  const schema = ACCESSORY_FIELD_SCHEMAS[category]
  if (!schema) return {}
  const attrs: Record<string, string | number> = {}
  for (const field of schema) {
    if (field.type === 'select' && field.options) {
      attrs[field.key] = field.options[index % field.options.length]
    } else if (field.type === 'number') {
      attrs[field.key] = 10 + (index % 8) * 2
    } else {
      attrs[field.key] = `${field.label} ${index + 1}`
    }
  }
  return attrs
}

export const accessoryCards: AccessoryCard[] = Array.from({ length: 44 }, (_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length]
  return {
    id: String(i + 1),
    code: `AKS-${String(100 + i).padStart(4, '0')}`,
    name: `${category} ${i + 1}`,
    category,
    unit: category === 'İplik' ? 'cone' : 'adet',
    supplier: pick(['YKK Türkiye', 'Coats Türkiye', 'Label Pro', 'Sanko Aksesuar'], i),
    leadTime: `${7 + (i % 4) * 7} gün`,
    status: i % 11 === 0 ? 'Pasif' : 'Aktif',
    attributes: genAttributes(category, i),
  }
})

export const accessoryStock: AccessoryStock[] = Array.from({ length: 44 }, (_, i) => {
  const qty = 500 + (i % 12) * 450
  const reserved = Math.floor(qty * 0.25)
  const min = 400 + (i % 5) * 200
  return {
    id: String(i + 1),
    code: `AKS-${String(100 + i).padStart(4, '0')}`,
    name: `${CATEGORIES[i % CATEGORIES.length]} ${i + 1}`,
    category: CATEGORIES[i % CATEGORIES.length],
    warehouse: 'Aksesuar Deposu',
    quantity: qty,
    unit: i % 6 === 0 ? 'cone' : 'adet',
    reserved,
    freeStock: qty - reserved,
    minLevel: min,
    status: qty - reserved < min ? 'Kritik' : 'Normal',
  }
})

export const accessoryKpis = [
  { label: 'Aksesuar Kartı', value: String(accessoryCards.length), hint: 'Tanımlı kalem' },
  { label: 'Kritik Stok', value: String(accessoryStock.filter((s) => s.status === 'Kritik').length), hint: 'Min altı' },
  { label: 'Kategori', value: String(CATEGORIES.length), hint: 'Dinamik form tipi' },
  { label: 'Ort. Tedarik', value: '14 gün', hint: 'Lead time' },
]

export function getAccessorySchema(category: string): AccessoryFieldDef[] {
  return ACCESSORY_FIELD_SCHEMAS[category] ?? []
}
