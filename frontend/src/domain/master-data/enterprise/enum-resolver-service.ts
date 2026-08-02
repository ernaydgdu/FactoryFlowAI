/**
 * Runtime enum resolver — sabit TypeScript enum yerine repository SSOT
 */
import {
  ageGroupRepository,
  embroideryTypeRepository,
  fitRepository,
  genderRepository,
  machineTypeRepository,
  operationRepository,
  printTypeRepository,
  qualityCodeRepository,
  warehouseTypeRepository,
  washTypeRepository,
} from '../repositories'

export function getWashTypes() {
  return washTypeRepository.getActive()
}

export function getPrintTypes() {
  return printTypeRepository.getActive()
}

export function getEmbroideryTypes() {
  return embroideryTypeRepository.getActive()
}

export function getFits() {
  return fitRepository.getActive()
}

export function getGenders() {
  return genderRepository.getActive()
}

export function getAgeGroups() {
  return ageGroupRepository.getActive()
}

export function getOperations() {
  return operationRepository.getActive()
}

export function getWarehouseTypes() {
  return warehouseTypeRepository.getActive()
}

export function getMachineTypes() {
  return machineTypeRepository.getActive()
}

export function getQualityCodes() {
  return qualityCodeRepository.getActive()
}

export function resolveLookupName(repo: { getById(id: string): { name: string } | undefined }, id: string): string {
  return repo.getById(id)?.name ?? id
}

export function countEnumResolverCoverage(): { resolvers: number; totalLookups: number } {
  const counts = [
    getWashTypes().length,
    getPrintTypes().length,
    getEmbroideryTypes().length,
    getFits().length,
    getGenders().length,
    getAgeGroups().length,
    getOperations().length,
    getWarehouseTypes().length,
    getMachineTypes().length,
    getQualityCodes().length,
  ]
  return { resolvers: 10, totalLookups: counts.reduce((a, b) => a + b, 0) }
}
