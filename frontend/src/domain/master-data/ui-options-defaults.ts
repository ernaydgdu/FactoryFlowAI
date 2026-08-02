/**
 * UI form defaults — repository lookup at call time (bootstrap-safe).
 */
import {
  collectionRepository,
  colorCardRepository,
  currencyRepository,
  incotermRepository,
  operationRepository,
  paymentTermRepository,
  productGroupRepository,
  seasonRepository,
  sizeSetRepository,
  subProductGroupRepository,
  workshopRepository,
} from './repositories'

export function getDefaultIncotermCode(): string {
  return incotermRepository.getByCode('FOB')?.code ?? incotermRepository.getActive()[0]?.code ?? ''
}

export function getDefaultPaymentTermName(): string {
  return paymentTermRepository.getByCode('NET60')?.name ?? paymentTermRepository.getActive()[0]?.name ?? ''
}

export function getDefaultCurrencyCode(): string {
  return currencyRepository.getByCode('USD')?.code ?? currencyRepository.getActive()[0]?.code ?? ''
}

export function getDefaultSeasonName(): string {
  return seasonRepository.getByCode('SS26')?.name ?? seasonRepository.getActive()[0]?.name ?? ''
}

export function getDefaultCollectionName(): string {
  return collectionRepository.getByCode('CORE')?.name ?? collectionRepository.getActive()[0]?.name ?? ''
}

export function getDefaultWorkshopName(): string {
  return workshopRepository.getActive()[0]?.name ?? ''
}

export function getWorkshopNameByDepartment(department: string): string {
  const wh = workshopRepository.find((w) => w.location.includes(department))[0]
  return wh?.name ?? workshopRepository.getActive()[0]?.name ?? ''
}

export function getWarehouseNameByOperationCode(opCode: string): string {
  const op = operationRepository.getByCode(opCode)
  if (!op) return getDefaultWorkshopName()
  if (op.department === 'Kesimhane') return 'Kesimhane'
  if (op.department === 'Dikim') return getDefaultWorkshopName()
  if (op.department === 'Ütü Paket') return 'Ütü Paket'
  if (op.department === 'Kalite') return 'Kalite'
  return op.department
}

export function getDefaultProductGroupName(): string {
  return productGroupRepository.getActive()[0]?.name ?? ''
}

export function getDefaultSubGroupName(): string {
  return subProductGroupRepository.getActive()[0]?.name ?? ''
}

export function getDefaultProductType(): string {
  return sizeSetRepository.getActive()[0]?.productType ?? ''
}

export function getDefaultColorCardOptions(count = 2) {
  return colorCardRepository.getActive().slice(0, count).map((c) => ({
    code: c.code,
    pantone: c.pantone,
    description: c.name,
  }))
}
