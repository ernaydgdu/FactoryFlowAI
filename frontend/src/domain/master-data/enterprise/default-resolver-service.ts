import type { MasterDataDefaultProfile } from './types'
import { MASTER_DATA_DEFAULT_PROFILES } from './enterprise-seed'
import { getDependencies } from './dependency-service'
import type { MasterDataEntityType } from '../types'

export function getDefaultProfile(productGroupId: string): MasterDataDefaultProfile | undefined {
  return MASTER_DATA_DEFAULT_PROFILES.find((p) => p.productGroupId === productGroupId)
}

export function getDefaultProfileByCode(code: string): MasterDataDefaultProfile | undefined {
  return MASTER_DATA_DEFAULT_PROFILES.find((p) => p.code === code)
}

export function resolveDefaultsForProductGroup(productGroupId: string) {
  const profile = getDefaultProfile(productGroupId)
  const deps = getDependencies('productGroup', productGroupId, 'defaultsTo')
  return {
    profile,
    sizeSetId: profile?.sizeSetId ?? deps.find((d) => d.targetEntityType === 'sizeSet')?.targetEntityId,
    washTypeId: profile?.washTypeId ?? deps.find((d) => d.targetEntityType === 'washType')?.targetEntityId,
    printTypeId: profile?.printTypeId,
    embroideryTypeId: profile?.embroideryTypeId,
    operationRouteIds:
      profile?.operationRouteIds ??
      getDependencies('productGroup', productGroupId, 'routesTo').map((d) => d.targetEntityId),
    bomTemplateId: profile?.bomTemplateId,
  }
}

export function resolveDefaultsForNewProduct(productGroupCode: string, productGroupId: string) {
  const defaults = resolveDefaultsForProductGroup(productGroupId)
  return {
    productGroupCode,
    productGroupId,
    ...defaults,
    source: 'master-data-default-profile' as const,
  }
}

export function countDefaultCoverage(): { profiles: number; productGroupsCovered: number } {
  const groups = new Set(MASTER_DATA_DEFAULT_PROFILES.map((p) => p.productGroupId))
  return { profiles: MASTER_DATA_DEFAULT_PROFILES.length, productGroupsCovered: groups.size }
}

export function resolveCommercialDefaults(countryId: string) {
  const countryDeps = getDependencies('country', countryId)
  return {
    currencyId: countryDeps.find((d) => d.targetEntityType === 'currency')?.targetEntityId,
    incotermId: countryDeps.find((d) => d.targetEntityType === 'incoterm')?.targetEntityId,
  }
}

export function resolvePaymentDefault(incotermId: string) {
  return getDependencies('incoterm' as MasterDataEntityType, incotermId, 'suggests').find(
    (d) => d.targetEntityType === 'paymentTerm',
  )?.targetEntityId
}
