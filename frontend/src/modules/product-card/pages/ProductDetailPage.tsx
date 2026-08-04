import { useState } from 'react'

import { useProductCardDetail } from '@/application/product-card/use-product-card'
import { ProductDetailView } from '../components/ProductDetailView'
import { ProductLifecyclePanel } from '../components/ProductLifecyclePanel'

type TabId = 'overview' | 'bom' | 'colors' | 'sizes' | 'technical' | 'revisions' | 'relations' | 'documents' | 'timeline'

export function ProductDetailPage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const { data: product, isLoading, isError } = useProductCardDetail(id)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (isError || !product) return <p className="p-8">Ürün bulunamadı</p>

  return (
    <div className="space-y-6 p-6">
      <ProductLifecyclePanel product={product} />
      <ProductDetailView
        product={product}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
