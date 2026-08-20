import {
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type OrderListToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  selectedCount: number
  totalCount: number
  isExporting: boolean
  isExportingPdf: boolean
  onExportExcel: () => void
  onExportPdf: () => void
  onDeleteSelected: () => void
}

export function OrderListToolbar({
  search,
  onSearchChange,
  selectedCount,
  totalCount,
  isExporting,
  isExportingPdf,
  onExportExcel,
  onExportPdf,
  onDeleteSelected,
}: OrderListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1 xl:max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Sipariş no, müşteri, marka, model, planlamacı ara..."
            className="bg-background pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportExcel} disabled={isExporting}>
            <FileSpreadsheet className="size-4" />
            {isExporting ? 'İndiriliyor...' : 'Excel'}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPdf} disabled={isExportingPdf}>
            <FileText className="size-4" />
            {isExportingPdf ? 'PDF oluşturuluyor...' : 'PDF'}
          </Button>
          {selectedCount > 0 ? (
            <Button variant="outline" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="size-4" />
              Sil ({selectedCount})
            </Button>
          ) : null}
          <Button size="sm" asChild>
            <Link to="/orders/new">
              <Plus className="size-4" />
              Yeni Sipariş
            </Link>
          </Button>
        </div>
      </div>
      {selectedCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {selectedCount} sipariş seçildi — toplam {totalCount} kayıt
        </p>
      ) : null}
    </div>
  )
}
