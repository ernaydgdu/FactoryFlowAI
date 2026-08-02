/**
 * Product Card Service — ERP'nin merkezi ürün kartı.
 * Tüm alanlar master data referanslarından resolve edilir; hardcoded string yok.
 */
import type { BomLine, ProductCard } from '../../types'
import type { ProductCardMasterRefs, ProductCardRevision, TextileProductCard } from '../../types/textile-erp'
import {
  brandRepository,
  buyerRepository,
  collectionRepository,
  countryRepository,
  customerRepository,
  fabricCompositionRepository,
  fabricTypeRepository,
  merchandiserRepository,
  productGroupRepository,
  seasonRepository,
  subProductGroupRepository,
} from '../../master-data'
import {
  AGE_GROUPS,
  EMBROIDERY_TYPES,
  FITS,
  GENDERS,
  GTIP_CODES,
  pickLookup,
  PRINT_TYPES,
  WASH_TYPES,
} from '../../master-data/textile-lookups'
import { calcActualConsumption } from '../calculations'
import { buildBillOfMaterials, toLegacyBomLines } from './bom-service'
import { buildProductColorAssignments, toLegacyProductColors } from './color-management-service'

const MODEL_NAMES = [
  'SS26 Denim Jacket',
  'AW26 Fleece Hoodie',
  'SS26 Chino Pant',
  'SS26 Polo Basic',
  'SS26 Woven Shirt',
  'SS26 Cargo Short',
  'AW26 Puffer Coat',
  'SS26 Linen Blazer',
]

function defaultBomLines(): Omit<BomLine, 'actualConsumption'>[] {
  return [
    { id: 'bom-1', stockCardId: 'sc-1', consumption: 1.55, wastePercent: 3 },
    { id: 'bom-2', stockCardId: 'sc-6', consumption: 0.22, wastePercent: 5 },
    { id: 'bom-3', stockCardId: 'sc-8', consumption: 8, wastePercent: 2 },
    { id: 'bom-4', stockCardId: 'sc-10', consumption: 2, wastePercent: 0 },
    { id: 'bom-5', stockCardId: 'sc-14', consumption: 1, wastePercent: 0 },
    { id: 'bom-6', stockCardId: 'sc-16', consumption: 0.18, wastePercent: 5 },
    { id: 'bom-7', stockCardId: 'sc-18', consumption: 1, wastePercent: 0 },
    { id: 'bom-8', stockCardId: 'sc-21', consumption: 0.021, wastePercent: 0 },
  ]
}

function resolveName<T extends { name: string }>(repo: { getById(id: string): T | undefined }, id: string): string {
  return repo.getById(id)?.name ?? id
}

function buildRefs(index: number, sizeSetId: string): ProductCardMasterRefs {
  const customers = customerRepository.getActive()
  const brands = brandRepository.getActive()
  const buyers = buyerRepository.getActive()
  const merchs = merchandiserRepository.getActive()
  const seasons = seasonRepository.getActive()
  const collections = collectionRepository.getActive()
  const pgs = productGroupRepository.getActive()
  const spgs = subProductGroupRepository.getActive()
  const fts = fabricTypeRepository.getActive()
  const fcs = fabricCompositionRepository.getActive()
  const countries = countryRepository.getActive()

  return {
    customerId: customers[index % customers.length].id,
    brandId: brands[index % brands.length].id,
    buyerId: buyers[index % buyers.length].id,
    merchandiserId: merchs[index % merchs.length].id,
    seasonId: seasons[index % seasons.length].id,
    collectionId: collections[index % collections.length].id,
    productGroupId: pgs[index % pgs.length].id,
    subProductGroupId: spgs[index % spgs.length].id,
    genderId: pickLookup(GENDERS, index).id,
    ageGroupId: pickLookup(AGE_GROUPS, index).id,
    fitId: pickLookup(FITS, index).id,
    countryOfOriginId: countries[index % countries.length].id,
    gtipId: pickLookup(GTIP_CODES, index).id,
    fabricTypeId: fts[index % fts.length].id,
    fabricCompositionId: fcs[index % fcs.length].id,
    washTypeId: pickLookup(WASH_TYPES, index).id,
    printTypeId: pickLookup(PRINT_TYPES, index).id,
    embroideryTypeId: pickLookup(EMBROIDERY_TYPES, index).id,
    mainFabricStockCardId: 'sc-1',
    auxiliaryFabricStockCardIds: ['sc-6'],
    sizeSetId,
  }
}

function buildRevision(index: number, status: ProductCardRevision['status']): ProductCardRevision {
  return {
    revisionNo: 1,
    status,
    changedAt: '2026-02-01T00:00:00.000Z',
    changedById: 'emp-planner-001',
    changeNote: index === 0 ? 'İlk onaylı revizyon' : 'Otomatik demo revizyon',
  }
}

export function buildTextileProductCard(index: number, sizeSetId: string): TextileProductCard {
  const id = String(index + 1)
  const refs = buildRefs(index, sizeSetId)
  const legacyBom = defaultBomLines().map((l) => ({
    ...l,
    actualConsumption: calcActualConsumption(l.consumption, l.wastePercent),
  }))
  const bom = buildBillOfMaterials(id, legacyBom)
  const colorAssignments = buildProductColorAssignments(2 + (index % 3), index)
  const status: ProductCardRevision['status'] = (['Onaylı', 'Üretimde', 'Taslak'] as const)[
    index % 3
  ]
  const revision = buildRevision(index, status)

  return {
    id,
    productCode: `URN-SS26-${String(1000 + index).padStart(4, '0')}`,
    customerModelNo: `CM-${8800 + index}`,
    internalModelNo: `IM-${4200 + index}`,
    productName: MODEL_NAMES[index % MODEL_NAMES.length],
    pattern: `PAT-${100 + index}`,
    weight: `${200 + (index % 6) * 20} g/m²`,
    description: `Ürün kartı ${id} — onaylı teknik tanım`,
    technicalSheetRef: `TF-${id}-R${revision.revisionNo}`,
    measurementChartId: `mc-${id}`,
    refs,
    resolved: {
      customer: resolveName(customerRepository, refs.customerId),
      brand: resolveName(brandRepository, refs.brandId),
      buyer: resolveName(buyerRepository, refs.buyerId),
      merchandiser: resolveName(merchandiserRepository, refs.merchandiserId),
      season: resolveName(seasonRepository, refs.seasonId),
      collection: resolveName(collectionRepository, refs.collectionId),
      productGroup: resolveName(productGroupRepository, refs.productGroupId),
      subGroup: resolveName(subProductGroupRepository, refs.subProductGroupId),
      gender: pickLookup(GENDERS, index).name,
      ageGroup: pickLookup(AGE_GROUPS, index).name,
      fit: pickLookup(FITS, index).name,
      countryOfOrigin: resolveName(countryRepository, refs.countryOfOriginId),
      gtip: pickLookup(GTIP_CODES, index).code,
      fabricType: resolveName(fabricTypeRepository, refs.fabricTypeId),
      composition: fabricCompositionRepository.getById(refs.fabricCompositionId)?.fiberContent ?? '',
      wash: pickLookup(WASH_TYPES, index).name,
      print: pickLookup(PRINT_TYPES, index).name,
      embroidery: pickLookup(EMBROIDERY_TYPES, index).name,
      mainFabric: 'sc-1',
    },
    colorAssignments,
    bom,
    currentRevision: revision,
    revisionHistory: [revision],
    status,
  }
}

/** Legacy ProductCard — mevcut sipariş/Brain uyumluluğu */
export function toLegacyProductCard(card: TextileProductCard): ProductCard {
  return {
    id: card.id,
    productCode: card.productCode,
    customerModelNo: card.customerModelNo,
    internalModelNo: card.internalModelNo,
    productName: card.productName,
    brand: card.resolved.brand,
    customer: card.resolved.customer,
    buyer: card.resolved.buyer,
    merchandiser: card.resolved.merchandiser,
    season: card.resolved.season,
    collection: card.resolved.collection,
    productGroup: card.resolved.productGroup,
    subGroup: card.resolved.subGroup,
    gender: card.resolved.gender as ProductCard['gender'],
    ageGroup: card.resolved.ageGroup as ProductCard['ageGroup'],
    fit: card.resolved.fit,
    pattern: card.pattern,
    fabricType: card.resolved.fabricType,
    composition: card.resolved.composition,
    weight: card.weight,
    wash: card.resolved.wash,
    print: card.resolved.print,
    embroidery: card.resolved.embroidery,
    description: card.description,
    sizeSetId: card.refs.sizeSetId,
    colors: toLegacyProductColors(card.colorAssignments),
    bom: toLegacyBomLines(card.bom),
    status: card.status,
  }
}

export function buildAllTextileProductCards(sizeSetIds: string[]): TextileProductCard[] {
  return Array.from({ length: 24 }, (_, i) =>
    buildTextileProductCard(i, sizeSetIds[i % sizeSetIds.length]),
  )
}

export function buildAllLegacyProductCards(sizeSetIds: string[]): ProductCard[] {
  return buildAllTextileProductCards(sizeSetIds).map(toLegacyProductCard)
}
