import { masterDataEnterpriseConfig } from '../master-data-port-access'
import { runDomainCommandInTransaction } from '@/domain/ports/persistence/command-transaction.port'
import type { MasterDataAttributeDefinition, MasterDataAttributeValue } from './types'

function configRepo() {
  return masterDataEnterpriseConfig()
}

export function getAttributeDefinitions(entityType: string): MasterDataAttributeDefinition[] {
  return configRepo().getAttributeDefinitions(entityType)
}

export function getAttributeValues(entityType: string, entityId: string): MasterDataAttributeValue[] {
  return configRepo().getAttributeValues(entityType, entityId)
}

export function resolveAttributeMap(entityType: string, entityId: string): Record<string, string | number | boolean> {
  const map: Record<string, string | number | boolean> = {}
  for (const v of getAttributeValues(entityType, entityId)) {
    map[v.attributeCode] = v.value
  }
  return map
}

export function setAttributeValue(
  entityType: string,
  entityId: string,
  attributeCode: string,
  value: string | number | boolean,
): MasterDataAttributeValue {
  return runDomainCommandInTransaction(() =>
    setAttributeValueInternal(entityType, entityId, attributeCode, value),
  )
}

function setAttributeValueInternal(
  entityType: string,
  entityId: string,
  attributeCode: string,
  value: string | number | boolean,
): MasterDataAttributeValue {
  const def = configRepo().getAllAttributeDefinitions().find((d) => d.code === attributeCode)
  if (!def) throw new Error(`Attribute tanımı bulunamadı: ${attributeCode}`)
  const entry: MasterDataAttributeValue = {
    attributeDefinitionId: def.id,
    attributeCode,
    entityType,
    entityId,
    value,
  }
  return configRepo().saveAttributeValue(entry)
}

export function countAttributeCoverage(): { definitions: number; values: number; entityTypes: number } {
  const definitions = configRepo().getAllAttributeDefinitions()
  const entityTypes = new Set(definitions.map((d) => d.entityType))
  return {
    definitions: definitions.length,
    values: configRepo().getAllAttributeValues().length,
    entityTypes: entityTypes.size,
  }
}
