import { FileText, Plus, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function DocumentsTab({ form }: TabProps) {
  const { form: f, addDocument, removeDocument } = form

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Teknik föy, fit onay, renk onay ve diğer dökümanlar.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={addDocument}>
          <Upload className="size-4" /> Döküman Ekle (Mock)
        </Button>
      </div>

      {f.documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <FileText className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Henüz döküman eklenmedi. Mock yükleme ile simüle edilir.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={addDocument}
          >
            <Plus className="size-4" /> İlk Dökümanı Ekle
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Dosya Adı</th>
                <th className="px-4 py-3 font-medium">Tür</th>
                <th className="px-4 py-3 font-medium">Yükleme</th>
                <th className="px-4 py-3 font-medium">Boyut</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {f.documents.map((doc) => (
                <tr key={doc.id} className="border-b border-border/60">
                  <td className="px-4 py-2 font-medium">{doc.name}</td>
                  <td className="px-4 py-2">{doc.type}</td>
                  <td className="px-4 py-2">{doc.uploadedAt}</td>
                  <td className="px-4 py-2">{doc.size}</td>
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
