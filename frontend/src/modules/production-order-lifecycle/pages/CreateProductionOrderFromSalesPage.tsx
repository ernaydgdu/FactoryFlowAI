import { Link, useNavigate } from 'react-router-dom'

import { DataTable, ErpModuleShell } from '@/components/erp'
import { Button } from '@/components/ui/button'
import {
  useCreateProductionOrder,
  useSalesOrdersForPoCreate,
} from '@/application/production-order-lifecycle/use-production-order-lifecycle'

export function CreateProductionOrderFromSalesPage() {
  const navigate = useNavigate()
  const { data: candidates = [], isLoading } = useSalesOrdersForPoCreate()
  const createPo = useCreateProductionOrder()
  const available = candidates.filter((c) => !c.hasProductionOrder)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Siparişten Üretim Emri Oluştur"
      description="BOM, operasyon route, maliyet ve planlama snapshot ile Draft UE"
      kpis={[
        { label: 'Uygun Sipariş', value: String(available.length), hint: 'UE yok' },
        { label: 'Mevcut UE', value: String(candidates.length - available.length), hint: '' },
      ]}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(c) => c.id}
          data={available}
          columns={[
            { key: 'order', header: 'Sipariş', render: (c) => c.orderNo },
            { key: 'customer', header: 'Müşteri', render: (c) => c.customer },
            { key: 'product', header: 'Ürün', render: (c) => c.productCode },
            { key: 'name', header: 'Ürün Adı', render: (c) => c.productName },
            { key: 'qty', header: 'Adet', render: (c) => c.quantity.toLocaleString('tr-TR') },
            {
              key: 'action',
              header: '',
              render: (c) => (
                <Button
                  size="sm"
                  disabled={createPo.isPending}
                  onClick={() => {
                    createPo.mutate(
                      { salesOrderId: c.id, priority: 'Normal', actor: 'planner' },
                      {
                        onSuccess: (po) => {
                          navigate(`/production-order-lifecycle/orders/${po.productionOrderNo}`)
                        },
                      },
                    )
                  }}
                >
                  UE Oluştur
                </Button>
              ),
            },
          ]}
        />
        {createPo.isError ? (
          <p className="mt-4 text-sm text-destructive">{(createPo.error as Error).message}</p>
        ) : null}
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link to="/production-order-lifecycle/orders">← UE listesine dön</Link>
        </Button>
      </div>
    </ErpModuleShell>
  )
}
