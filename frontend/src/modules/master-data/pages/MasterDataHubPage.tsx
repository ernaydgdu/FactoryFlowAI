import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/erp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MASTER_DATA_CRUD_REGISTRY, MASTER_DATA_CRUD_ENTITY_KEYS } from '@/domain/master-data/master-data-crud.registry'

export function MasterDataHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Referans veri yönetimi — müşteri, tedarikçi, depo, üretim yapısı, merchandising ve renk/beden setleri."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MASTER_DATA_CRUD_ENTITY_KEYS.map((key) => {
          const meta = MASTER_DATA_CRUD_REGISTRY[key]
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-lg">{meta.pluralLabel}</CardTitle>
                <CardDescription>{meta.label} CRUD</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to={meta.route}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {meta.pluralLabel} yönet →
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
