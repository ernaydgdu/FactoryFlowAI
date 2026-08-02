/**
 * Enterprise Master Data seed — attributes, dependencies, templates, hierarchy groups
 */
import {
  createCustomerGroup,
  createDepartment,
  createFabricCategory,
  createMachineGroup,
  createSupplierGroup,
  createTextileLookup,
} from '../factory'
import type {
  MasterDataAttributeDefinition,
  MasterDataDefaultProfile,
  MasterDataDependency,
  MasterDataValidationRule,
  ProductTemplate,
} from './types'

export const ENTERPRISE_CUSTOMER_GROUPS = [
  createCustomerGroup({ id: 'cg-retail', code: 'RETAIL', name: 'Perakende', description: 'Perakende müşteriler', sortOrder: 10 }),
  createCustomerGroup({ id: 'cg-brand', code: 'BRAND', name: 'Marka', description: 'Marka müşterileri', sortOrder: 20, parentId: 'cg-retail' }),
  createCustomerGroup({ id: 'cg-export', code: 'EXPORT', name: 'İhracat', description: 'İhracat müşterileri', sortOrder: 30 }),
]

export const ENTERPRISE_SUPPLIER_GROUPS = [
  createSupplierGroup({ id: 'sg-fabric', code: 'FABRIC', name: 'Kumaş Tedarikçileri', sortOrder: 10 }),
  createSupplierGroup({ id: 'sg-accessory', code: 'ACCESSORY', name: 'Aksesuar Tedarikçileri', sortOrder: 20 }),
  createSupplierGroup({ id: 'sg-service', code: 'SERVICE', name: 'Hizmet Tedarikçileri', sortOrder: 30, parentId: 'sg-fabric' }),
]

export const ENTERPRISE_DEPARTMENTS = [
  createDepartment({ id: 'dept-cutting', code: 'CUTTING', name: 'Kesimhane', sortOrder: 10 }),
  createDepartment({ id: 'dept-sewing', code: 'SEWING', name: 'Dikim', sortOrder: 20, parentId: 'dept-cutting' }),
  createDepartment({ id: 'dept-wash', code: 'WASHING', name: 'Yıkama', sortOrder: 30 }),
  createDepartment({ id: 'dept-qc', code: 'QC', name: 'Kalite', sortOrder: 40 }),
  createDepartment({ id: 'dept-pack', code: 'PACKING', name: 'Paketleme', sortOrder: 50, parentId: 'dept-qc' }),
]

export const ENTERPRISE_MACHINE_GROUPS = [
  createMachineGroup({ id: 'mg-flat', code: 'FLAT_GROUP', name: 'Düz Makine Grubu', workshopId: 'wsh-a', sortOrder: 10 }),
  createMachineGroup({ id: 'mg-overlock', code: 'OVL_GROUP', name: 'Overlok Grubu', workshopId: 'wsh-a', sortOrder: 20, parentId: 'mg-flat' }),
  createMachineGroup({ id: 'mg-finish', code: 'FINISH_GROUP', name: 'Finish Grubu', workshopId: 'wsh-b', sortOrder: 30 }),
]

export const ENTERPRISE_FABRIC_CATEGORIES = [
  createFabricCategory({ id: 'fcat-knit', code: 'KNIT', name: 'Örme', sortOrder: 10 }),
  createFabricCategory({ id: 'fcat-woven', code: 'WOVEN', name: 'Dokuma', sortOrder: 20 }),
  createFabricCategory({ id: 'fcat-denim', code: 'DENIM_CAT', name: 'Denim', sortOrder: 30, parentId: 'fcat-woven' }),
]

export const MASTER_DATA_ATTRIBUTE_DEFINITIONS: MasterDataAttributeDefinition[] = [
  { id: 'attr-shrink', code: 'SHRINKAGE_PCT', name: 'Shrinkage %', entityType: 'fabricType', dataType: 'number', unit: '%', sortOrder: 10, isRequired: false },
  { id: 'attr-weight', code: 'WEIGHT', name: 'Weight', entityType: 'fabricType', dataType: 'number', unit: 'gsm', sortOrder: 20, isRequired: true },
  { id: 'attr-width', code: 'WIDTH', name: 'Width', entityType: 'fabricType', dataType: 'number', unit: 'cm', sortOrder: 30, isRequired: true },
  { id: 'attr-elastic', code: 'ELASTIC_PCT', name: 'Elastic %', entityType: 'fabricType', dataType: 'number', unit: '%', sortOrder: 40, isRequired: false },
  { id: 'attr-finish', code: 'FINISH', name: 'Finish', entityType: 'fabricType', dataType: 'string', sortOrder: 50, isRequired: false },
  { id: 'attr-season', code: 'SEASON', name: 'Season', entityType: 'fabricType', dataType: 'reference', sortOrder: 60, isRequired: false, referenceEntityType: 'seasonType' },
  { id: 'attr-cert', code: 'CERTIFICATE', name: 'Certificate', entityType: 'fabricType', dataType: 'string', sortOrder: 70, isRequired: false },
  { id: 'attr-supplier', code: 'SUPPLIER', name: 'Supplier', entityType: 'fabricType', dataType: 'reference', sortOrder: 80, isRequired: false, referenceEntityType: 'supplier' },
  { id: 'attr-fastness', code: 'COLOR_FASTNESS', name: 'Color Fastness', entityType: 'fabricType', dataType: 'number', sortOrder: 90, isRequired: false },
]

export const MASTER_DATA_VALIDATION_RULES: MasterDataValidationRule[] = [
  { id: 'vr-width-req', entityType: 'fabricType', fieldCode: 'WIDTH', rule: 'required', message: 'Kumaş eni zorunludur' },
  { id: 'vr-width-min', entityType: 'fabricType', fieldCode: 'WIDTH', rule: 'min', value: 80, message: 'Minimum en 80 cm' },
  { id: 'vr-width-max', entityType: 'fabricType', fieldCode: 'WIDTH', rule: 'max', value: 220, message: 'Maximum en 220 cm' },
  { id: 'vr-width-def', entityType: 'fabricType', fieldCode: 'WIDTH', rule: 'default', value: 150, message: 'Varsayılan en 150 cm' },
  { id: 'vr-width-prec', entityType: 'fabricType', fieldCode: 'WIDTH', rule: 'precision', value: 1, message: 'En 1 ondalık hassasiyet' },
  { id: 'vr-weight-req', entityType: 'fabricType', fieldCode: 'WEIGHT', rule: 'required', message: 'Gramaj zorunludur' },
  { id: 'vr-weight-min', entityType: 'fabricType', fieldCode: 'WEIGHT', rule: 'min', value: 80, message: 'Minimum gramaj 80 gsm' },
  { id: 'vr-weight-max', entityType: 'fabricType', fieldCode: 'WEIGHT', rule: 'max', value: 500, message: 'Maximum gramaj 500 gsm' },
  { id: 'vr-code-unique', entityType: 'productGroup', fieldCode: 'code', rule: 'unique', message: 'Ürün grubu kodu benzersiz olmalı' },
  { id: 'vr-code-regex', entityType: 'productGroup', fieldCode: 'code', rule: 'regex', value: '^[A-Z0-9_]{2,20}$', message: 'Kod formatı geçersiz' },
]

export const MASTER_DATA_DEPENDENCIES: MasterDataDependency[] = [
  { id: 'dep-tr-try', kind: 'defaultsTo', sourceEntityType: 'country', sourceEntityId: 'cnt-tr', targetEntityType: 'currency', targetEntityId: 'cur-try', priority: 1 },
  { id: 'dep-tr-incoterm', kind: 'suggests', sourceEntityType: 'country', sourceEntityId: 'cnt-tr', targetEntityType: 'incoterm', targetEntityId: 'inc-fob', priority: 2 },
  { id: 'dep-fob-pay', kind: 'suggests', sourceEntityType: 'incoterm', sourceEntityId: 'inc-fob', targetEntityType: 'paymentTerm', targetEntityId: 'pt-net60', priority: 1 },
  { id: 'dep-tshirt-size', kind: 'defaultsTo', sourceEntityType: 'productGroup', sourceEntityId: 'pg-tshirt', targetEntityType: 'sizeSet', targetEntityId: 'ss-tshirt', priority: 1 },
  { id: 'dep-tshirt-wash', kind: 'defaultsTo', sourceEntityType: 'productGroup', sourceEntityId: 'pg-tshirt', targetEntityType: 'washType', targetEntityId: 'wash-garment', priority: 2 },
  { id: 'dep-tshirt-route-cut', kind: 'routesTo', sourceEntityType: 'productGroup', sourceEntityId: 'pg-tshirt', targetEntityType: 'operation', targetEntityId: 'op-cut', priority: 10 },
  { id: 'dep-tshirt-route-sew', kind: 'routesTo', sourceEntityType: 'productGroup', sourceEntityId: 'pg-tshirt', targetEntityType: 'operation', targetEntityId: 'op-sew', priority: 20 },
  { id: 'dep-polo-size', kind: 'defaultsTo', sourceEntityType: 'productGroup', sourceEntityId: 'pg-polo', targetEntityType: 'sizeSet', targetEntityId: 'ss-polo', priority: 1 },
  { id: 'dep-pant-size', kind: 'defaultsTo', sourceEntityType: 'productGroup', sourceEntityId: 'pg-pantolon', targetEntityType: 'sizeSet', targetEntityId: 'ss-pant', priority: 1 },
]

export const MASTER_DATA_DEFAULT_PROFILES: MasterDataDefaultProfile[] = [
  {
    id: 'def-tshirt',
    code: 'DEF-TSHIRT',
    name: 'T-Shirt Defaults',
    productGroupId: 'pg-tshirt',
    sizeSetId: 'ss-tshirt',
    washTypeId: 'wash-garment',
    printTypeId: 'prt-none',
    embroideryTypeId: 'emb-none',
    operationRouteIds: ['op-cut', 'op-sew', 'op-qc', 'op-pack', 'op-ship'],
    bomTemplateId: 'tpl-tshirt-basic',
  },
  {
    id: 'def-polo',
    code: 'DEF-POLO',
    name: 'Polo Defaults',
    productGroupId: 'pg-polo',
    sizeSetId: 'ss-polo',
    washTypeId: 'wash-no_wash',
    printTypeId: 'prt-none',
    embroideryTypeId: 'emb-flat',
    operationRouteIds: ['op-cut', 'op-sew', 'op-iron', 'op-qc', 'op-pack'],
    bomTemplateId: 'tpl-polo-basic',
  },
  {
    id: 'def-sweat',
    code: 'DEF-SWEAT',
    name: 'Sweatshirt Defaults',
    productGroupId: 'pg-sweatshirt',
    sizeSetId: 'ss-tshirt',
    washTypeId: 'wash-garment',
    printTypeId: 'prt-screen',
    embroideryTypeId: 'emb-none',
    operationRouteIds: ['op-cut', 'op-sew', 'op-overlock', 'op-qc', 'op-pack'],
    bomTemplateId: 'tpl-sweat-basic',
  },
  {
    id: 'def-pant',
    code: 'DEF-PANT',
    name: 'Pantolon Defaults',
    productGroupId: 'pg-pantolon',
    sizeSetId: 'ss-pant',
    washTypeId: 'wash-stone',
    printTypeId: 'prt-none',
    embroideryTypeId: 'emb-none',
    operationRouteIds: ['op-cut', 'op-sew', 'op-wash', 'op-qc', 'op-pack'],
    bomTemplateId: 'tpl-pant-basic',
  },
]

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { id: 'tpl-tshirt-basic', code: 'TPL-TSHIRT', name: 'Basic T-Shirt', description: 'Standart basic tişört şablonu', productGroupId: 'pg-tshirt', sizeSetId: 'ss-tshirt', defaultProfileId: 'def-tshirt', status: 'Active', version: 1 },
  { id: 'tpl-polo-basic', code: 'TPL-POLO', name: 'Polo', description: 'Standart polo şablonu', productGroupId: 'pg-polo', sizeSetId: 'ss-polo', defaultProfileId: 'def-polo', status: 'Active', version: 1 },
  { id: 'tpl-sweat-basic', code: 'TPL-SWEAT', name: 'Sweatshirt', description: 'Standart sweatshirt şablonu', productGroupId: 'pg-sweatshirt', sizeSetId: 'ss-tshirt', defaultProfileId: 'def-sweat', status: 'Active', version: 1 },
  { id: 'tpl-pant-basic', code: 'TPL-PANT', name: 'Pantolon', description: 'Standart pantolon şablonu', productGroupId: 'pg-pantolon', sizeSetId: 'ss-pant', defaultProfileId: 'def-pant', status: 'Active', version: 1 },
]

/** Supplier category lookup — enum yerine master data */
export const SUPPLIER_CATEGORY_LOOKUPS = [
  createTextileLookup('supcat', { id: 'supcat-fabric', code: 'FABRIC', name: 'Kumaş', description: 'Kumaş tedarikçisi' }),
  createTextileLookup('supcat', { id: 'supcat-accessory', code: 'ACCESSORY', name: 'Aksesuar', description: 'Aksesuar tedarikçisi' }),
  createTextileLookup('supcat', { id: 'supcat-both', code: 'BOTH', name: 'Her İkisi', description: 'Kumaş + aksesuar' }),
  createTextileLookup('supcat', { id: 'supcat-logistics', code: 'LOGISTICS', name: 'Lojistik', description: 'Lojistik hizmet' }),
]

export function attributeValueSeed(entityId: string, code: string, value: string | number): import('./types').MasterDataAttributeValue {
  const def = MASTER_DATA_ATTRIBUTE_DEFINITIONS.find((d) => d.code === code)!
  return {
    attributeDefinitionId: def.id,
    attributeCode: code,
    entityType: 'fabricType',
    entityId,
    value,
  }
}

export const FABRIC_TYPE_ATTRIBUTE_VALUES = [
  attributeValueSeed('ft-single_jersey', 'WEIGHT', 180),
  attributeValueSeed('ft-single_jersey', 'WIDTH', 150),
  attributeValueSeed('ft-single_jersey', 'SHRINKAGE_PCT', 3),
  attributeValueSeed('ft-denim', 'WEIGHT', 320),
  attributeValueSeed('ft-denim', 'WIDTH', 150),
  attributeValueSeed('ft-denim', 'ELASTIC_PCT', 2),
]
