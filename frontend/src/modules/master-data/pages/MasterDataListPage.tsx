import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  MasterDataDomainError,
  useCreateMasterDataMutation,
  useDeactivateMasterDataMutation,
  useMasterDataList,
  useMasterDataReferenceOptions,
  useReactivateMasterDataMutation,
  useUpdateMasterDataMutation,
} from '@/application/master-data/use-master-data'
import { DataTable, PageHeader, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MASTER_DATA_CRUD_REGISTRY } from '@/domain/master-data/master-data-crud.registry'
import type { MasterDataCrudEntityKey } from '@/domain/master-data/master-data-crud.registry'
import type { MasterDataEntityDto } from '@/application/master-data/master-data.dto'
import {
  MASTER_DATA_UI_CONFIG,
  type MasterDataFormField,
} from '@/modules/master-data/config/master-data-ui.config'

type Props = {
  entityKey: MasterDataCrudEntityKey
}

function cellValue(row: MasterDataEntityDto, key: string): string {
  const value = row[key]
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value != null ? String(value) : '—'
}

function MasterDataReferenceSelect({
  field,
  value,
  onChange,
}: {
  field: MasterDataFormField
  value: string
  onChange: (value: string) => void
}) {
  const { data = [] } = useMasterDataReferenceOptions(field.referenceKey ?? 'country')
  return (
    <select
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
    >
      <option value="">Seçin…</option>
      {data.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.code} — {opt.name}
        </option>
      ))}
    </select>
  )
}

function MasterDataFormFields({
  fields,
  values,
  onChange,
}: {
  fields: MasterDataFormField[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <>
      {fields.map((field) => (
        <label key={field.key} className="space-y-2 text-sm">
          <span className="font-medium">{field.label}</span>
          {field.type === 'select' ? (
            <MasterDataReferenceSelect
              field={field}
              value={String(values[field.key] ?? '')}
              onChange={(v) => onChange(field.key, v)}
            />
          ) : field.type === 'period' ? (
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(values[field.key] ?? 'SS')}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              <option value="SS">SS</option>
              <option value="AW">AW</option>
              <option value="RESORT">RESORT</option>
              <option value="CORE">CORE</option>
            </select>
          ) : field.type === 'sizes' ? (
            <Input
              value={Array.isArray(values[field.key]) ? (values[field.key] as string[]).join(', ') : String(values[field.key] ?? '')}
              onChange={(e) =>
                onChange(
                  field.key,
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                )
              }
              placeholder="XS, S, M, L, XL"
              required={field.required}
            />
          ) : field.type === 'number' ? (
            <Input
              type="number"
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              required={field.required}
            />
          ) : (
            <Input
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
              required={field.required}
            />
          )}
        </label>
      ))}
    </>
  )
}

export function MasterDataListPage({ entityKey }: Props) {
  const config = MASTER_DATA_UI_CONFIG[entityKey]
  const meta = MASTER_DATA_CRUD_REGISTRY[entityKey]
  const { user } = useAuth()
  const actorUserId = user?.id ?? 'system'

  const { data: rows = [], isLoading } = useMasterDataList(entityKey)
  const createMutation = useCreateMasterDataMutation(entityKey)
  const updateMutation = useUpdateMasterDataMutation(entityKey)
  const deactivateMutation = useDeactivateMasterDataMutation(entityKey)
  const reactivateMutation = useReactivateMasterDataMutation(entityKey)

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editRow, setEditRow] = useState<MasterDataEntityDto | null>(null)
  const [formValues, setFormValues] = useState<Record<string, unknown>>(config.createDefaults)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      setFormValues({ code: '', name: '', ...config.createDefaults })
    }
  }, [mode, config.createDefaults])

  function openEdit(row: MasterDataEntityDto) {
    setEditRow(row)
    setFormValues({ ...row })
    setMode('edit')
    setFormError('')
  }

  function closeForm() {
    setMode('list')
    setEditRow(null)
    setFormError('')
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    try {
      const payload = { ...formValues }
      if (entityKey === 'colorCard' && !payload.rgb) {
        payload.rgb = config.createDefaults.rgb
      }
      await createMutation.mutateAsync({ input: payload as { code: string; name: string }, actorUserId })
      closeForm()
    } catch (err) {
      setFormError(err instanceof MasterDataDomainError ? err.message : 'Kayıt oluşturulamadı.')
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault()
    if (!editRow) return
    setFormError('')
    try {
      const { id, version, ...rest } = formValues
      void id
      await updateMutation.mutateAsync({
        id: editRow.id,
        input: { ...rest, expectedVersion: editRow.version },
        actorUserId,
      })
      closeForm()
    } catch (err) {
      setFormError(err instanceof MasterDataDomainError ? err.message : 'Kayıt güncellenemedi.')
    }
  }

  async function handleDeactivate(row: MasterDataEntityDto) {
    setFormError('')
    try {
      await deactivateMutation.mutateAsync({
        id: row.id,
        expectedVersion: row.version,
        actorUserId,
      })
    } catch (err) {
      setFormError(err instanceof MasterDataDomainError ? err.message : 'Pasif yapılamadı.')
    }
  }

  async function handleReactivate(row: MasterDataEntityDto) {
    setFormError('')
    try {
      await reactivateMutation.mutateAsync({
        id: row.id,
        expectedVersion: row.version,
        actorUserId,
      })
    } catch (err) {
      setFormError(err instanceof MasterDataDomainError ? err.message : 'Aktif edilemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={meta.pluralLabel}
        description={`${meta.label} master data — liste, oluştur, güncelle, pasif/aktif`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/master-data">
                <ArrowLeft className="size-4" /> Master Data
              </Link>
            </Button>
            {mode === 'list' ? (
              <Button size="sm" onClick={() => setMode('create')}>
                <Plus className="size-4" /> Yeni {meta.label}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={closeForm}>
                Listeye Dön
              </Button>
            )}
          </div>
        }
      />

      {mode !== 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'create' ? `Yeni ${meta.label}` : `${meta.label} Düzenle`}</CardTitle>
            <CardDescription>
              {mode === 'edit' ? `Versiyon: ${editRow?.version}` : 'Zorunlu alanları doldurun.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={mode === 'create' ? handleCreate : handleUpdate}
            >
              <MasterDataFormFields
                fields={config.formFields}
                values={formValues}
                onChange={(key, value) => setFormValues((prev) => ({ ...prev, [key]: value }))}
              />
              {formError ? <p className="text-sm text-destructive md:col-span-2">{formError}</p> : null}
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {mode === 'create' ? 'Kaydet' : 'Güncelle'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {formError && mode === 'list' ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{meta.pluralLabel}</CardTitle>
          <CardDescription>{rows.length} kayıt</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : (
            <DataTable
              rowKey={(row) => row.id}
              data={rows}
              columns={[
                ...config.listColumns.map((col) => ({
                  key: col.key,
                  header: col.label,
                  render: (row: MasterDataEntityDto) => cellValue(row, col.key),
                })),
                {
                  key: 'status',
                  header: 'Durum',
                  render: (row: MasterDataEntityDto) => (
                    <StatusBadge
                      label={row.isActive ? 'Aktif' : 'Pasif'}
                      tone={row.isActive ? 'success' : 'warning'}
                    />
                  ),
                },
                {
                  key: 'version',
                  header: 'Ver.',
                  render: (row: MasterDataEntityDto) => String(row.version),
                },
                {
                  key: 'actions',
                  header: 'İşlem',
                  render: (row: MasterDataEntityDto) => (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        Düzenle
                      </Button>
                      {row.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deactivateMutation.isPending}
                          onClick={() => void handleDeactivate(row)}
                        >
                          Pasif Yap
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reactivateMutation.isPending}
                          onClick={() => void handleReactivate(row)}
                        >
                          Aktif Et
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
