/**
 * Master Data enterprise configuration port — attributes, rules, dependencies, templates.
 */
import type { BaseMasterEntity } from '@/domain/master-data/types'
import type {
  HierarchyEntityType,
  MasterDataAttributeDefinition,
  MasterDataAttributeValue,
  MasterDataDefaultProfile,
  MasterDataDependency,
  MasterDataValidationRule,
  ProductTemplate,
} from '@/domain/master-data/enterprise/types'

export interface IMasterDataEnterpriseConfigPort {
  getAttributeDefinitions(entityType: string): MasterDataAttributeDefinition[]
  getAllAttributeDefinitions(): MasterDataAttributeDefinition[]
  getAttributeValues(entityType: string, entityId: string): MasterDataAttributeValue[]
  getAllAttributeValues(): MasterDataAttributeValue[]
  saveAttributeValue(value: MasterDataAttributeValue): MasterDataAttributeValue
  getValidationRules(): MasterDataValidationRule[]
  getDependencies(): MasterDataDependency[]
  getDefaultProfiles(): MasterDataDefaultProfile[]
  getProductTemplates(): ProductTemplate[]
  getHierarchyEntities(entityType: HierarchyEntityType): Array<BaseMasterEntity & { parentId?: string }>
  seedFromLegacy(input: {
    attributeDefinitions: MasterDataAttributeDefinition[]
    attributeValues: MasterDataAttributeValue[]
    validationRules: MasterDataValidationRule[]
    dependencies: MasterDataDependency[]
    defaultProfiles: MasterDataDefaultProfile[]
    productTemplates: ProductTemplate[]
    hierarchyEntities: Partial<Record<HierarchyEntityType, Array<BaseMasterEntity & { parentId?: string }>>>
  }): void
}
