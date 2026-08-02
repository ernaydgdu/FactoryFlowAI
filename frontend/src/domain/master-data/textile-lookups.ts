/**
 * Textile lookup master data — SSOT via Master Data Repository.
 * product-card-service backward compat için ref formatında export eder.
 */
import type {
  AgeGroupRef,
  EmbroideryTypeRef,
  FitRef,
  GenderRef,
  GtipRef,
  PrintTypeRef,
  WashTypeRef,
} from '../types/textile-erp'
import { lazyArray } from '../data/lazy-cache'
import {
  ageGroupRepository,
  embroideryTypeRepository,
  fitRepository,
  genderRepository,
  gtipCodeRepository,
  printTypeRepository,
  washTypeRepository,
} from './repositories'

function toRef<T extends { id: string; code: string; name: string }>(items: T[]) {
  return items.map((item) => ({ id: item.id, code: item.code, name: item.name }))
}

export const GENDERS = lazyArray((): GenderRef[] => toRef(genderRepository.getActive()))
export const AGE_GROUPS = lazyArray((): AgeGroupRef[] => toRef(ageGroupRepository.getActive()))
export const FITS = lazyArray((): FitRef[] => toRef(fitRepository.getActive()))
export const WASH_TYPES = lazyArray((): WashTypeRef[] => toRef(washTypeRepository.getActive()))
export const PRINT_TYPES = lazyArray((): PrintTypeRef[] => toRef(printTypeRepository.getActive()))
export const EMBROIDERY_TYPES = lazyArray((): EmbroideryTypeRef[] =>
  toRef(embroideryTypeRepository.getActive()),
)

export const GTIP_CODES = lazyArray((): GtipRef[] =>
  gtipCodeRepository.getActive().map((g) => ({
    id: g.id,
    code: g.hsCode,
    name: g.name,
    description: g.description,
  })),
)

export function getGenderById(id: string) {
  return GENDERS.find((g) => g.id === id)
}

export function getAgeGroupById(id: string) {
  return AGE_GROUPS.find((a) => a.id === id)
}

export function getFitById(id: string) {
  return FITS.find((f) => f.id === id)
}

export function getWashTypeById(id: string) {
  return WASH_TYPES.find((w) => w.id === id)
}

export function getPrintTypeById(id: string) {
  return PRINT_TYPES.find((p) => p.id === id)
}

export function getEmbroideryTypeById(id: string) {
  return EMBROIDERY_TYPES.find((e) => e.id === id)
}

export function getGtipById(id: string) {
  return GTIP_CODES.find((g) => g.id === id)
}

export function pickLookup<T extends { id: string }>(items: T[], index: number): T {
  return items[index % items.length]
}
