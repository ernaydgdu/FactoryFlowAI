import { masterDataEnterpriseConfig } from '../master-data-port-access'
import type { MasterDataDefaultProfile } from './types'
import { getDependencies } from './dependency-service'
import type { MasterDataEntityType } from '../types'

function configRepo() {
  return masterDataEnterpriseConfig()
}

export function getDefaultProfile(productGroupId: string): MasterDataDefaultProfile | undefined {
  return configRepo().getDefaultProfiles().find((p) => p.productGroupId === productGroupId)
}

export function getDefaultProfileByCode(code: string): MasterDataDefaultProfile | undefined {
  return configRepo().getDefaultProfiles().find((p) => p.code === code)
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
  const profiles = configRepo().getDefaultProfiles()
  const groups = new Set(profiles.map((p) => p.productGroupId))
  return { profiles: profiles.length, productGroupsCovered: groups.size }
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
