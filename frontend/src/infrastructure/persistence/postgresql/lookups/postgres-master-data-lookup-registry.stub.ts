/** Sprint 7.5 — master data lookup PG adapter skeleton. */
import { PostgresAdapterNotReadyError } from '../postgres-not-implemented.error'

export class PostgresMasterDataLookupRegistryStub {
  private notReady(): never {
    throw new PostgresAdapterNotReadyError('postgres-master-data-lookup-registry')
  }

  get country() {
    return this.notReady()
  }
}

export class PostgresMasterDataEnterpriseConfigStub {
  private notReady(): never {
    throw new PostgresAdapterNotReadyError('postgres-master-data-enterprise-config')
  }

  get attributes() {
    return this.notReady()
  }
}

export const postgresMasterDataLookupRegistryStub = new PostgresMasterDataLookupRegistryStub()
export const postgresMasterDataEnterpriseConfigStub = new PostgresMasterDataEnterpriseConfigStub()
