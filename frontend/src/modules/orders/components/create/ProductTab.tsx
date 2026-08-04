import { FormField, FormGrid } from '@/components/erp/form-field'
import { selectClass } from '@/components/erp/form-field'
import { useApprovedProductCardOptions } from '@/application/product-card/use-product-card'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function ProductTab({ form: orderForm }: TabProps) {
  const { data: approvedCards = [], isLoading } = useApprovedProductCardOptions()
  const { form, selectProductCard } = orderForm

  return (
    <FormGrid cols={2}>
      <FormField
        label="Onaylı Ürün Kartı"
        id="productCardId"
        hint="Sipariş yalnızca mevcut ve onaylı ürün kartlarından seçilir. Yeni kart oluşturmak için Ürün Kartları modülünü kullanın."
        required
      >
        <select
          id="productCardId"
          className={selectClass}
          value={form.productCardId}
          onChange={(e) => {
            const card = approvedCards.find((c) => c.id === e.target.value)
            selectProductCard(
              e.target.value,
              card
                ? {
                    productCode: card.productCode,
                    productName: card.productName,
                    customer: card.customer,
                    brand: card.brand,
                    season: card.season,
                  }
                : null,
            )
          }}
          disabled={isLoading}
        >
          <option value="">{isLoading ? 'Yükleniyor…' : 'Onaylı ürün kartı seçin…'}</option>
          {approvedCards.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </FormField>

      {form.selectedProductSummary && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          <p className="font-medium">{form.selectedProductSummary.productCode}</p>
          <p className="text-muted-foreground">{form.selectedProductSummary.productName}</p>
          <p className="mt-2 text-muted-foreground">
            {form.selectedProductSummary.customer} · {form.selectedProductSummary.brand} · {form.selectedProductSummary.season}
          </p>
        </div>
      )}

      {approvedCards.length === 0 && !isLoading && (
        <p className="text-sm text-amber-600">
          Onaylı ürün kartı yok. Önce /products üzerinden ürün kartı oluşturup onaylayın.
        </p>
      )}
    </FormGrid>
  )
}
