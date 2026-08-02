import type { MasterDataAttributeDefinition, MasterDataAttributeValue } from './types'
import { FABRIC_TYPE_ATTRIBUTE_VALUES, MASTER_DATA_ATTRIBUTE_DEFINITIONS } from './enterprise-seed'

export function getAttributeDefinitions(entityType: string): MasterDataAttributeDefinition[] {
  return MASTER_DATA_ATTRIBUTE_DEFINITIONS.filter((d) => d.entityType === entityType).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )
}

export function getAttributeValues(entityType: string, entityId: string): MasterDataAttributeValue[] {
  return FABRIC_TYPE_ATTRIBUTE_VALUES.filter((v) => v.entityType === entityType && v.entityId === entityId)
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
  const def = MASTER_DATA_ATTRIBUTE_DEFINITIONS.find((d) => d.code === attributeCode)
  if (!def) throw new Error(`Attribute tanımı bulunamadı: ${attributeCode}`)
  const entry: MasterDataAttributeValue = {
    attributeDefinitionId: def.id,
    attributeCode,
    entityType,
    entityId,
    value,
  }
  FABRIC_TYPE_ATTRIBUTE_VALUES.push(entry)
  return entry
}

export function countAttributeCoverage(): { definitions: number; values: number; entityTypes: number } {
  const entityTypes = new Set(MASTER_DATA_ATTRIBUTE_DEFINITIONS.map((d) => d.entityType))
  return {
    definitions: MASTER_DATA_ATTRIBUTE_DEFINITIONS.length,
    values: FABRIC_TYPE_ATTRIBUTE_VALUES.length,
    entityTypes: entityTypes.size,
  }
}
