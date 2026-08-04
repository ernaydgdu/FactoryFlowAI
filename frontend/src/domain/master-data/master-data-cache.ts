import type { MasterDataCrudEntityKey } from './master-data-crud.registry'
import {
  brandRepository,
  collectionRepository,
  colorCardRepository,
  customerRepository,
  productionLineRepository,
  seasonRepository,
  sizeSetRepository,
  supplierRepository,
  warehouseRepository,
  workshopRepository,
} from './repositories'

type CacheableRepo = { _invalidateCache?: () => void }

const REPO_BY_KEY = {
  customer: customerRepository,
  supplier: supplierRepository,
  warehouse: warehouseRepository,
  productionLine: productionLineRepository,
  workshop: workshopRepository,
  brand: brandRepository,
  season: seasonRepository,
  collection: collectionRepository,
  colorCard: colorCardRepository,
  sizeSet: sizeSetRepository,
} satisfies Record<MasterDataCrudEntityKey, unknown>

export function invalidateMasterDataRepositoryCache(entityKey: MasterDataCrudEntityKey): void {
  const repo = REPO_BY_KEY[entityKey] as CacheableRepo
  repo._invalidateCache?.()
}
