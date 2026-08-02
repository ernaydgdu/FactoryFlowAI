import { useParams } from 'react-router-dom'

import { ProductDetailPage } from '@/modules/product-card/pages/ProductDetailPage'

export function ProductDetailRoute() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <ProductDetailPage id={id} />
}
