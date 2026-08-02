/**
 * Master Data Coverage Report — tüm entity repository kapsamı.
 */
import type { BaseMasterEntity, MasterDataEntityType } from './types'
import { ALL_MASTER_DATA_REPOSITORIES } from './repositories'

export type MasterDataEntityCoverage = {
  entityType: MasterDataEntityType
  repositoryKey: keyof typeof ALL_MASTER_DATA_REPOSITORIES
  label: string
  total: number
  active: number
  inactive: number
  versioned: number
  localized: number
  sampleCodes: string[]
}

export type MasterDataCoverageReport = {
  generatedAt: string
  totalEntities: number
  totalActive: number
  totalRepositories: number
  entities: MasterDataEntityCoverage[]
  textileMasterDataComplete: boolean
}

const REPOSITORY_LABELS: Record<keyof typeof ALL_MASTER_DATA_REPOSITORIES, { type: MasterDataEntityType; label: string }> = {
  country: { type: 'country', label: 'Ülke' },
  currency: { type: 'currency', label: 'Para Birimi' },
  customer: { type: 'customer', label: 'Müşteri' },
  brand: { type: 'brand', label: 'Marka' },
  buyer: { type: 'buyer', label: 'Buyer' },
  merchandiser: { type: 'merchandiser', label: 'Merchandiser' },
  supplier: { type: 'supplier', label: 'Tedarikçi' },
  warehouse: { type: 'warehouse', label: 'Depo' },
  workshop: { type: 'workshop', label: 'Atölye' },
  seasonType: { type: 'seasonType', label: 'Sezon Tipi' },
  season: { type: 'season', label: 'Sezon' },
  collection: { type: 'collection', label: 'Koleksiyon' },
  productGroup: { type: 'productGroup', label: 'Ürün Grubu' },
  subProductGroup: { type: 'subProductGroup', label: 'Alt Ürün Grubu' },
  sizeSet: { type: 'sizeSet', label: 'Beden Seti' },
  colorCard: { type: 'colorCard', label: 'Renk Kartı' },
  fabricType: { type: 'fabricType', label: 'Kumaş Tipi' },
  fabricComposition: { type: 'fabricComposition', label: 'Kompozisyon' },
  accessoryCategory: { type: 'accessoryCategory', label: 'Aksesuar Tipi' },
  accessoryType: { type: 'accessoryType', label: 'Aksesuar Alt Tipi' },
  operation: { type: 'operation', label: 'Operasyon' },
  productionLine: { type: 'productionLine', label: 'Üretim Hattı' },
  machineType: { type: 'machineType', label: 'Makine Tipi' },
  machine: { type: 'machine', label: 'Makine' },
  qualityCode: { type: 'qualityCode', label: 'Kalite Kodu' },
  warehouseType: { type: 'warehouseType', label: 'Depo Tipi' },
  unit: { type: 'unit', label: 'Birim' },
  gender: { type: 'gender', label: 'Gender' },
  ageGroup: { type: 'ageGroup', label: 'Age Group' },
  fit: { type: 'fit', label: 'Fit' },
  washType: { type: 'washType', label: 'Yıkama Tipi' },
  printType: { type: 'printType', label: 'Baskı Tipi' },
  embroideryType: { type: 'embroideryType', label: 'Nakış' },
  gtipCode: { type: 'gtipCode', label: 'GTIP' },
  employee: { type: 'employee', label: 'Çalışan' },
  transportCompany: { type: 'transportCompany', label: 'Taşıyıcı' },
  forwarder: { type: 'forwarder', label: 'Forwarder' },
  containerType: { type: 'containerType', label: 'Konteyner Tipi' },
  incoterm: { type: 'incoterm', label: 'Incoterm' },
  paymentTerm: { type: 'paymentTerm', label: 'Ödeme Şekli' },
}

function analyzeEntity(key: keyof typeof ALL_MASTER_DATA_REPOSITORIES): MasterDataEntityCoverage {
  const repo = ALL_MASTER_DATA_REPOSITORIES[key]
  const all = repo.getAll() as BaseMasterEntity[]
  const meta = REPOSITORY_LABELS[key]

  return {
    entityType: meta.type,
    repositoryKey: key,
    label: meta.label,
    total: all.length,
    active: all.filter((e) => e.isActive !== false && e.status === 'Active' && !e.deletedAt).length,
    inactive: all.filter((e) => e.isActive === false || e.status === 'Inactive' || e.deletedAt).length,
    versioned: all.filter((e) => e.version >= 1).length,
    localized: all.filter((e) => e.localizationKey || e.localization?.tr || e.localization?.en).length,
    sampleCodes: all.slice(0, 5).map((e) => e.code),
  }
}

/** Textile master data minimum beklenen kayıt sayıları */
const TEXTILE_MINIMUMS: Partial<Record<keyof typeof ALL_MASTER_DATA_REPOSITORIES, number>> = {
  productGroup: 26,
  fabricType: 20,
  fabricComposition: 9,
  washType: 6,
  printType: 9,
  embroideryType: 5,
  operation: 12,
  productionLine: 6,
  machineType: 10,
  qualityCode: 7,
  warehouseType: 11,
  accessoryCategory: 17,
  unit: 9,
  currency: 5,
  incoterm: 6,
  paymentTerm: 6,
  seasonType: 6,
}

export function generateMasterDataCoverageReport(): MasterDataCoverageReport {
  const entities = (Object.keys(ALL_MASTER_DATA_REPOSITORIES) as Array<
    keyof typeof ALL_MASTER_DATA_REPOSITORIES
  >).map(analyzeEntity)

  const textileMasterDataComplete = Object.entries(TEXTILE_MINIMUMS).every(([key, min]) => {
    const entry = entities.find((e) => e.repositoryKey === key)
    return (entry?.active ?? 0) >= (min ?? 0)
  })

  return {
    generatedAt: new Date().toISOString(),
    totalEntities: entities.reduce((sum, e) => sum + e.total, 0),
    totalActive: entities.reduce((sum, e) => sum + e.active, 0),
    totalRepositories: entities.length,
    entities,
    textileMasterDataComplete,
  }
}

export function formatCoverageReportMarkdown(report: MasterDataCoverageReport): string {
  const lines = [
    '# Kepler ERP — Master Data Coverage Report',
    '',
    `**Generated:** ${report.generatedAt}`,
    `**Total Entities:** ${report.totalEntities}`,
    `**Active Entities:** ${report.totalActive}`,
    `**Repositories:** ${report.totalRepositories}`,
    `**Textile Master Data Complete:** ${report.textileMasterDataComplete ? '✅ YES' : '❌ NO'}`,
    '',
    '| Entity | Label | Total | Active | Versioned | Localized | Sample Codes |',
    '|--------|-------|-------|--------|-----------|-----------|--------------|',
  ]

  for (const e of report.entities) {
    lines.push(
      `| ${e.entityType} | ${e.label} | ${e.total} | ${e.active} | ${e.versioned} | ${e.localized} | ${e.sampleCodes.join(', ')} |`,
    )
  }

  return lines.join('\n')
}
