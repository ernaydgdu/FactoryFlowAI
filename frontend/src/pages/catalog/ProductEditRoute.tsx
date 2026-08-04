import { useParams } from 'react-router-dom'

import { ProductEditPage } from '@/modules/product-card/pages/ProductEditPage'

export function ProductEditRoute() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <ProductEditPage id={id} />
}
