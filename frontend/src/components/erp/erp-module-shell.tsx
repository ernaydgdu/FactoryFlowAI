import type { ReactNode } from 'react'

import { KpiCards, PageHeader, type KpiItem } from '@/components/erp'
import { PaginationBar } from '@/components/erp/pagination-bar'
import { Card, CardContent } from '@/components/ui/card'

type ErpModuleShellProps = {
  title: string
  description: string
  kpis: KpiItem[]
  kpiColumns?: 2 | 3 | 4 | 5
  toolbar?: ReactNode
  children: ReactNode
  pagination?: {
    page: number
    totalPages: number
    pageSize: number
    totalCount: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    label?: string
  }
  headerActions?: ReactNode
}

export function ErpModuleShell({
  title,
  description,
  kpis,
  kpiColumns = 4,
  toolbar,
  children,
  pagination,
  headerActions,
}: ErpModuleShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={headerActions}
      />
      <KpiCards items={kpis} columns={kpiColumns} />
      {toolbar}
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          {children}
          {pagination ? (
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalCount={pagination.totalCount}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              label={pagination.label}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
