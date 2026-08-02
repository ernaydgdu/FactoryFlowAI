import type {
  MasterDataExportContract,
  MasterDataExportResult,
  MasterDataImportContract,
  MasterDataImportResult,
} from './types'
import { ALL_MASTER_DATA_REPOSITORIES } from '../repositories'

export function exportMasterData(contract: MasterDataExportContract): MasterDataExportResult {
  const repo = ALL_MASTER_DATA_REPOSITORIES[contract.entityType as keyof typeof ALL_MASTER_DATA_REPOSITORIES]
  if (!repo) {
    return {
      entityType: contract.entityType,
      format: contract.format,
      rowCount: 0,
      payload: '',
      generatedAt: new Date().toISOString(),
    }
  }

  const rows = (contract.includeInactive ? repo.getAll() : repo.getActive()) as Array<Record<string, unknown>>
  const generatedAt = new Date().toISOString()

  if (contract.format === 'json') {
    const payload = JSON.stringify(rows.map((r) => pickColumns(r, contract.columns)), null, 2)
    return { entityType: contract.entityType, format: contract.format, rowCount: rows.length, payload, generatedAt }
  }

  if (contract.format === 'csv') {
    const header = contract.columns.join(',')
    const lines = rows.map((r) => contract.columns.map((c) => JSON.stringify(r[c] ?? '')).join(','))
    return {
      entityType: contract.entityType,
      format: contract.format,
      rowCount: rows.length,
      payload: [header, ...lines].join('\n'),
      generatedAt,
    }
  }

  // excel contract — tab-separated placeholder (UI yok, domain kontrat)
  const header = contract.columns.join('\t')
  const lines = rows.map((r) => contract.columns.map((c) => String(r[c] ?? '')).join('\t'))
  return {
    entityType: contract.entityType,
    format: contract.format,
    rowCount: rows.length,
    payload: [header, ...lines].join('\n'),
    generatedAt,
  }
}

export function importMasterData(contract: MasterDataImportContract, payload: string): MasterDataImportResult {
  const errors: string[] = []
  let totalRows = 0
  let imported = 0

  if (contract.format === 'json') {
    try {
      const rows = JSON.parse(payload) as unknown[]
      totalRows = Array.isArray(rows) ? rows.length : 0
      if (contract.dryRun) imported = 0
      else imported = contract.validateBeforeImport ? totalRows : totalRows
    } catch {
      errors.push('JSON parse hatası')
    }
  } else if (contract.format === 'csv' || contract.format === 'excel') {
    const lines = payload.split('\n').filter(Boolean)
    totalRows = Math.max(0, lines.length - 1)
    imported = contract.dryRun ? 0 : totalRows
  }

  return {
    entityType: contract.entityType,
    format: contract.format,
    totalRows,
    imported,
    skipped: totalRows - imported,
    errors,
  }
}

function pickColumns(row: Record<string, unknown>, columns: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of columns) out[c] = row[c]
  return out
}

export function getStandardExportColumns(_entityType: string): string[] {
  return ['id', 'code', 'name', 'description', 'shortDescription', 'externalCode', 'isActive', 'version', 'sortOrder']
}
