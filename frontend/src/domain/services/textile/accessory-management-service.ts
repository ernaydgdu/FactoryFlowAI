/**
 * Accessory Management — kategori bazlı aksesuar kartları.
 */
import { getStockCardById, STOCK_CARDS } from '../../data/stock-cards'
import { supplierRepository } from '../../master-data'
import type {
  AccessoryCard,
  AccessoryCategoryCode,
  ButtonAttributes,
  LabelAttributes,
  ThreadAttributes,
  ZipperAttributes,
} from '../../types/textile-erp'
import type { StockCardCategory } from '../../types'

const CATEGORY_MAP: Record<StockCardCategory, AccessoryCategoryCode | null> = {
  Kumaş: null,
  Tela: null,
  Fermuar: 'ZIPPER',
  Düğme: 'BUTTON',
  İplik: 'THREAD',
  Etiket: 'LABEL',
  'Dokuma Etiket': 'LABEL',
  Poşet: 'PACKAGING',
  Karton: 'PACKAGING',
  Askı: 'PACKAGING',
  Koli: 'PACKAGING',
}

function parseZipper(attrs: Record<string, string | number>): ZipperAttributes {
  return {
    lengthCm: Number(attrs.length ?? 60),
    type: String(attrs.teethType ?? 'Metal'),
    direction: (attrs.direction as ZipperAttributes['direction']) ?? 'Sol',
    colorCode: String(attrs.color ?? ''),
    brand: String(attrs.brand ?? 'YKK'),
  }
}

function parseButton(attrs: Record<string, string | number>): ButtonAttributes {
  return {
    diameterMm: Number(attrs.diameter ?? 17),
    holes: String(attrs.holes ?? 'Shank'),
    material: String(attrs.material ?? 'Metal'),
    coating: String(attrs.coating ?? 'Nickel'),
  }
}

function parseThread(attrs: Record<string, string | number>): ThreadAttributes {
  return {
    tex: Number(attrs.tex ?? 40),
    ne: Number(attrs.number ?? 120),
    coneWeightGram: Number(attrs.coneWeight ?? 5000),
    colorCode: String(attrs.color ?? ''),
  }
}

function parseLabel(attrs: Record<string, string | number>): LabelAttributes {
  return {
    labelType: attrs.labelType === 'Care' ? 'Baskı' : 'Dokuma',
    folding: String(attrs.folding ?? 'Center'),
    language: String(attrs.language ?? 'Multi'),
  }
}

export function toAccessoryCard(stockCardId: string): AccessoryCard | undefined {
  const card = getStockCardById(stockCardId)
  if (!card) return undefined
  const categoryCode = CATEGORY_MAP[card.category]
  if (!categoryCode) return undefined

  const supplier = supplierRepository.find((s) => s.name === card.supplier)[0]
  let attributes: AccessoryCard['attributes'] = card.attributes

  if (categoryCode === 'ZIPPER') attributes = parseZipper(card.attributes)
  if (categoryCode === 'BUTTON') attributes = parseButton(card.attributes)
  if (categoryCode === 'THREAD') attributes = parseThread(card.attributes)
  if (categoryCode === 'LABEL') attributes = parseLabel(card.attributes)

  return {
    id: `acc-${card.id}`,
    stockCardId: card.id,
    code: card.code,
    name: card.name,
    categoryCode,
    unit: card.unit,
    supplierId: supplier?.id ?? '',
    warehouseCode: card.warehouseCode,
    leadTimeDays: card.leadTimeDays,
    attributes,
  }
}

export function getAllAccessoryCards(): AccessoryCard[] {
  return STOCK_CARDS.map((c) => toAccessoryCard(c.id)).filter((a): a is AccessoryCard => !!a)
}

export function getAccessoriesByCategory(code: AccessoryCategoryCode): AccessoryCard[] {
  return getAllAccessoryCards().filter((a) => a.categoryCode === code)
}

export function getCategorySpecificFields(code: AccessoryCategoryCode): string[] {
  switch (code) {
    case 'ZIPPER':
      return ['lengthCm', 'type', 'direction', 'colorCode', 'brand']
    case 'BUTTON':
      return ['diameterMm', 'holes', 'material', 'coating']
    case 'THREAD':
      return ['tex', 'ne', 'coneWeightGram', 'colorCode']
    case 'LABEL':
      return ['labelType', 'folding', 'language']
    default:
      return []
  }
}
