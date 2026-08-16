import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

type OrderRowActionsProps = {
  orderId: string
  onDelete: () => void
  canDelete: boolean
}

export function OrderRowActions({
  orderId,
  onDelete,
  canDelete,
}: OrderRowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Sipariş Detay">
        <Link to={`/orders/${orderId}`}>
          <Eye className="size-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        asChild
        title="Düzenle"
      >
        <Link to={`/orders/${orderId}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      {canDelete ? (
        <Button
          variant="ghost"
          size="icon"
          title="Sil"
          onClick={onDelete}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
