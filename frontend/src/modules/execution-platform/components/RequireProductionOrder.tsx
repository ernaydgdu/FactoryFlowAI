import type { ReactNode } from 'react'

import { useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'

export function RequireProductionOrder({ children }: { children: (po: string) => ReactNode }) {
  const { productionOrderNo } = useExecutionWorkspace()
  if (!productionOrderNo) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
        Üst çubuktan bir üretim emri (UE) seçin.
      </div>
    )
  }
  return children(productionOrderNo)
}

export function PageLoading() {
  return <div className="py-16 text-center text-sm text-muted-foreground">Yükleniyor…</div>
}
