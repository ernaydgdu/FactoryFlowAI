import { useParams } from 'react-router-dom'

import type { MasterDataCrudEntityKey } from '@/domain/master-data/master-data-crud.registry'
import { resolveMasterDataEntityKeyFromPath } from '@/modules/master-data/config/master-data-ui.config'
import { MasterDataListPage } from '@/modules/master-data/pages/MasterDataListPage'

export function MasterDataRoutePage() {
  const { entityPath = '' } = useParams()
  const entityKey = resolveMasterDataEntityKeyFromPath(entityPath) as MasterDataCrudEntityKey | null

  if (!entityKey) {
    return <p className="p-8 text-muted-foreground">Geçersiz master data route.</p>
  }

  return <MasterDataListPage entityKey={entityKey} />
}
