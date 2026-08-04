import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import type { ProductCardDetailDto } from '@/application/product-card/product-card.dto'
import {
  ProductCardDomainError,
  useActivateProductCardMutation,
  useArchiveProductCardMutation,
  useDeactivateProductCardMutation,
  useSubmitProductCardForReviewMutation,
} from '@/application/product-card/use-product-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ProductApprovalDialog } from './ProductApprovalDialog'
import { ProductRevisionDialog } from './ProductRevisionDialog'

type Props = {
  product: ProductCardDetailDto
}

export function ProductLifecyclePanel({ product }: Props) {
  const { user } = useAuth()
  const actorUserId = user?.id ?? 'system'
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitMutation = useSubmitProductCardForReviewMutation()
  const activateMutation = useActivateProductCardMutation()
  const deactivateMutation = useDeactivateProductCardMutation()
  const archiveMutation = useArchiveProductCardMutation()

  const lifecycleCmd = { id: product.id, expectedVersion: product.version, actorUserId }

  async function run(action: () => Promise<unknown>, success: string) {
    setError(null)
    setMessage(null)
    try {
      await action()
      setMessage(success)
    } catch (err) {
      setError(err instanceof ProductCardDomainError ? err.message : 'İşlem başarısız.')
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Yaşam Döngüsü</CardTitle>
          {product.editable && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/products/${product.id}/edit`}>
                <Pencil className="size-4" /> Düzenle
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {product.lifecycleStatus === 'Draft' && (
              <Button
                size="sm"
                disabled={submitMutation.isPending}
                onClick={() =>
                  run(() => submitMutation.mutateAsync(lifecycleCmd), 'İncelemeye gönderildi')
                }
              >
                İncelemeye Gönder
              </Button>
            )}
            {(product.lifecycleStatus === 'Under Review' || product.lifecycleStatus === 'Draft') && (
              <Button size="sm" onClick={() => setApprovalOpen(true)}>
                Onayla…
              </Button>
            )}
            {product.lifecycleStatus === 'Approved' && (
              <>
                <Button
                  size="sm"
                  disabled={activateMutation.isPending}
                  onClick={() =>
                    run(() => activateMutation.mutateAsync(lifecycleCmd), 'Üretime alındı')
                  }
                >
                  Üretime Al
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRevisionOpen(true)}>
                  Revizyon…
                </Button>
              </>
            )}
            {product.lifecycleStatus === 'In Production' && (
              <Button
                size="sm"
                variant="outline"
                disabled={deactivateMutation.isPending}
                onClick={() =>
                  run(
                    () =>
                      deactivateMutation.mutateAsync({
                        ...lifecycleCmd,
                        reason: 'Manuel kapatma',
                      }),
                    'Kapatıldı',
                  )
                }
              >
                Deaktive Et
              </Button>
            )}
            {product.lifecycleStatus === 'Closed' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={archiveMutation.isPending}
                  onClick={() =>
                    run(() => archiveMutation.mutateAsync(lifecycleCmd), 'Arşivlendi')
                  }
                >
                  Arşivle
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRevisionOpen(true)}>
                  Revizyon…
                </Button>
              </>
            )}
          </div>

          {product.readOnly && (
            <p className="text-sm text-muted-foreground">Arşivlenmiş kart — salt okunur.</p>
          )}

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <ProductApprovalDialog
        product={product}
        actorUserId={actorUserId}
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onSuccess={setMessage}
      />
      <ProductRevisionDialog
        product={product}
        actorUserId={actorUserId}
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        onSuccess={setMessage}
      />
    </>
  )
}
