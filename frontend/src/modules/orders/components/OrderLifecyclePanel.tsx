import { useState } from 'react'

import type { SalesOrderDetailDto } from '@/application/sales-order/sales-order.dto'
import { salesOrderLifecycleBadge } from '@/application/sales-order/sales-order.dto'
import {
  SalesOrderDomainError,
  useApproveSalesOrderMutation,
  useArchiveSalesOrderMutation,
  useCancelSalesOrderMutation,
  useCloseSalesOrderMutation,
} from '@/application/sales-order/use-sales-order'
import { StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  order: SalesOrderDetailDto
  actorUserId: string
  onSuccess?: (msg: string) => void
}

export function OrderLifecyclePanel({ order, actorUserId, onSuccess }: Props) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const approveMutation = useApproveSalesOrderMutation(order.id)
  const cancelMutation = useCancelSalesOrderMutation(order.id)
  const closeMutation = useCloseSalesOrderMutation(order.id)
  const archiveMutation = useArchiveSalesOrderMutation(order.id)

  async function run(action: () => Promise<unknown>, success: string) {
    setError(null)
    try {
      await action()
      onSuccess?.(success)
    } catch (err) {
      setError(err instanceof SalesOrderDomainError ? err.message : 'İşlem başarısız.')
    }
  }

  const cmd = {
    expectedVersion: order.version,
    actorUserId,
    comment: comment.trim() || undefined,
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge {...salesOrderLifecycleBadge(order.lifecycleStatus)} />
        <span className="text-sm text-muted-foreground">Rev. {order.revisionNo}</span>
      </div>
      <Input
        placeholder="İşlem notu (opsiyonel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="max-w-md"
      />
      <div className="flex flex-wrap gap-2">
        {(order.lifecycleStatus === 'Draft' || order.lifecycleStatus === 'Under Review') && (
          <Button
            size="sm"
            variant="outline"
            disabled={approveMutation.isPending}
            onClick={() => run(() => approveMutation.mutateAsync(cmd), 'Sipariş onaylandı.')}
          >
            Onayla
          </Button>
        )}
        {order.lifecycleStatus !== 'Cancelled' && order.lifecycleStatus !== 'Archived' && order.lifecycleStatus !== 'Closed' && (
          <Button
            size="sm"
            variant="outline"
            disabled={cancelMutation.isPending}
            onClick={() => run(() => cancelMutation.mutateAsync(cmd), 'Sipariş iptal edildi.')}
          >
            İptal
          </Button>
        )}
        {order.lifecycleStatus === 'Active' && (
          <Button
            size="sm"
            variant="outline"
            disabled={closeMutation.isPending}
            onClick={() => run(() => closeMutation.mutateAsync(cmd), 'Sipariş kapatıldı.')}
          >
            Kapat
          </Button>
        )}
        {order.lifecycleStatus === 'Closed' && (
          <Button
            size="sm"
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={() => run(() => archiveMutation.mutateAsync(cmd), 'Sipariş arşivlendi.')}
          >
            Arşivle
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
