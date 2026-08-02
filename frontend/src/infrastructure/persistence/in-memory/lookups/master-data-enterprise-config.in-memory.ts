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
import type { IMasterDataEnterpriseConfigPort } from '@/domain/ports/persistence/lookups/master-data-enterprise-config.port'

export class MasterDataEnterpriseConfigInMemory implements IMasterDataEnterpriseConfigPort {
  private attributeDefinitions: MasterDataAttributeDefinition[] = []
  private attributeValues: MasterDataAttributeValue[] = []
  private validationRules: MasterDataValidationRule[] = []
  private dependencies: MasterDataDependency[] = []
  private defaultProfiles: MasterDataDefaultProfile[] = []
  private productTemplates: ProductTemplate[] = []
  private hierarchyEntities: Partial<
    Record<HierarchyEntityType, Array<BaseMasterEntity & { parentId?: string }>>
  > = {}

  captureSnapshot() {
    return structuredClone({
      attributeDefinitions: this.attributeDefinitions,
      attributeValues: this.attributeValues,
      validationRules: this.validationRules,
      dependencies: this.dependencies,
      defaultProfiles: this.defaultProfiles,
      productTemplates: this.productTemplates,
      hierarchyEntities: this.hierarchyEntities,
    })
  }

  restoreSnapshot(state: ReturnType<MasterDataEnterpriseConfigInMemory['captureSnapshot']>): void {
    this.attributeDefinitions = state.attributeDefinitions
    this.attributeValues = state.attributeValues
    this.validationRules = state.validationRules
    this.dependencies = state.dependencies
    this.defaultProfiles = state.defaultProfiles
    this.productTemplates = state.productTemplates
    this.hierarchyEntities = state.hierarchyEntities
  }

  getAttributeDefinitions(entityType: string): MasterDataAttributeDefinition[] {
    return this.attributeDefinitions
      .filter((d) => d.entityType === entityType)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  getAllAttributeDefinitions(): MasterDataAttributeDefinition[] {
    return [...this.attributeDefinitions]
  }

  getAttributeValues(entityType: string, entityId: string): MasterDataAttributeValue[] {
    return this.attributeValues.filter((v) => v.entityType === entityType && v.entityId === entityId)
  }

  getAllAttributeValues(): MasterDataAttributeValue[] {
    return [...this.attributeValues]
  }

  saveAttributeValue(value: MasterDataAttributeValue): MasterDataAttributeValue {
    this.attributeValues.push(value)
    return value
  }

  getValidationRules(): MasterDataValidationRule[] {
    return [...this.validationRules]
  }

  getDependencies(): MasterDataDependency[] {
    return [...this.dependencies]
  }

  getDefaultProfiles(): MasterDataDefaultProfile[] {
    return [...this.defaultProfiles]
  }

  getProductTemplates(): ProductTemplate[] {
    return [...this.productTemplates]
  }

  getHierarchyEntities(entityType: HierarchyEntityType): Array<BaseMasterEntity & { parentId?: string }> {
    return [...(this.hierarchyEntities[entityType] ?? [])]
  }

  seedFromLegacy(input: {
    attributeDefinitions: MasterDataAttributeDefinition[]
    attributeValues: MasterDataAttributeValue[]
    validationRules: MasterDataValidationRule[]
    dependencies: MasterDataDependency[]
    defaultProfiles: MasterDataDefaultProfile[]
    productTemplates: ProductTemplate[]
    hierarchyEntities: Partial<Record<HierarchyEntityType, Array<BaseMasterEntity & { parentId?: string }>>>
  }): void {
    this.attributeDefinitions = [...input.attributeDefinitions]
    this.attributeValues = [...input.attributeValues]
    this.validationRules = [...input.validationRules]
    this.dependencies = [...input.dependencies]
    this.defaultProfiles = [...input.defaultProfiles]
    this.productTemplates = [...input.productTemplates]
    this.hierarchyEntities = { ...input.hierarchyEntities }
  }
}

export const masterDataEnterpriseConfigInMemory = new MasterDataEnterpriseConfigInMemory()
