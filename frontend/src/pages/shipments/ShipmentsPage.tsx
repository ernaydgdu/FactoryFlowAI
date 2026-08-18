import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  deleteShipment,
  fetchShipments,
  type ApiShipmentListItem,
} from '@/infrastructure/api/shipments-api.repository'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ShipmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [deleteTarget, setDeleteTarget] = useState<ApiShipmentListItem | null>(null)

  const shipmentsQuery = useQuery({
    queryKey: applicationQueryKeys.shipmentRecord.list(),
    queryFn: fetchShipments,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteShipment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.shipmentRecord.all })
      setDeleteTarget(null)
    },
  })

  const shipments = shipmentsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sevkiyatlar"
        description="Birden fazla siparişi tek bir sevkiyat/çeki listesi belgesinde birleştirin."
        actions={
          <Button onClick={() => navigate('/shipments/new')}>
            <Plus className="size-4" /> Yeni Sevkiyat
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Sevkiyat No</th>
                  <th className="px-3 py-2">Tarih</th>
                  <th className="px-3 py-2 text-right">Sipariş Sayısı</th>
                  <th className="px-3 py-2 text-right">Toplam Adet</th>
                  <th className="px-3 py-2 text-right">Toplam Koli</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {shipmentsQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : shipments.length > 0 ? (
                  shipments.map((shipment) => (
                    <tr key={shipment.id} className="border-b border-border/60">
                      <td className="px-3 py-2 font-medium">{shipment.shipmentNo}</td>
                      <td className="px-3 py-2">{formatDate(shipment.shipmentDate)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{shipment.orderCount}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {shipment.totalQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {shipment.totalCartons.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/shipments/${shipment.id}`}>Detay</Link>
                          </Button>
                          {canManage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(shipment)}
                            >
                              Sil
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      Henüz sevkiyat oluşturulmadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget != null}
        title="Sevkiyatı sil"
        description={`${deleteTarget?.shipmentNo ?? ''} sevkiyatını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
