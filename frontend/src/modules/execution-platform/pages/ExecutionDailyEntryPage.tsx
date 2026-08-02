import { forwardRef, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDailyProductionEntries, usePostDailyProductionEntry } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { RequireProductionOrder } from '../components/RequireProductionOrder'
import { useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'

const DEFAULT_FORM = {
  operationCode: 'SEW',
  lineId: 'LINE-1',
  operatorId: 'OP-1',
  machineId: 'MCH-1',
  shiftCode: 'SHIFT-1',
  planned: 100,
  produced: 0,
  reject: 0,
  rework: 0,
  secondQuality: 0,
  fire: 0,
  downtimeMinutes: 0,
}

export function ExecutionDailyEntryPage() {
  const { role, actor } = useExecutionWorkspace()
  const post = usePostDailyProductionEntry()
  const producedRef = useRef<HTMLInputElement>(null)

  return (
    <RequireProductionOrder>
      {(po) => (
        <DailyEntryForm
          po={po}
          role={role}
          actor={actor}
          post={post}
          producedRef={producedRef}
        />
      )}
    </RequireProductionOrder>
  )
}

function DailyEntryForm({
  po,
  role,
  actor,
  post,
  producedRef,
}: {
  po: string
  role: ReturnType<typeof useExecutionWorkspace>['role']
  actor: string
  post: ReturnType<typeof usePostDailyProductionEntry>
  producedRef: React.RefObject<HTMLInputElement | null>
}) {
  const { data } = useDailyProductionEntries(po)
  const [form, setForm] = useState(DEFAULT_FORM)

  useEffect(() => {
    producedRef.current?.focus()
  }, [po, producedRef])

  const submit = () => {
    post.mutate({
      ...form,
      productionOrderNo: po,
      entryDate: new Date().toISOString().slice(0, 10),
      actor,
      role,
    })
    setForm((f) => ({ ...f, produced: 0, reject: 0, rework: 0, secondQuality: 0, fire: 0 }))
    producedRef.current?.focus()
  }

  return (
    <ExecutionPageFrame
      title="Daily Production Entry"
      purpose="Operatör — 15 saniyede kayıt (Tab + Enter)"
      kpis={[
        { label: 'Bugün Kayıt', value: String(data?.entries.length ?? 0), hint: po },
        { label: 'Operasyon', value: form.operationCode, hint: form.shiftCode },
      ]}
    >
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Operasyon" value={form.operationCode} onChange={(v) => setForm((f) => ({ ...f, operationCode: v }))} />
            <Field label="Vardiya" value={form.shiftCode} onChange={(v) => setForm((f) => ({ ...f, shiftCode: v }))} />
            <Field label="Hat" value={form.lineId} onChange={(v) => setForm((f) => ({ ...f, lineId: v }))} />
            <Field label="Operatör" value={form.operatorId} onChange={(v) => setForm((f) => ({ ...f, operatorId: v }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumField ref={producedRef} label="Üretilen *" value={form.produced} onChange={(n) => setForm((f) => ({ ...f, produced: n }))} />
            <NumField label="Red" value={form.reject} onChange={(n) => setForm((f) => ({ ...f, reject: n }))} />
            <NumField label="Fire" value={form.fire} onChange={(n) => setForm((f) => ({ ...f, fire: n }))} />
            <NumField label="Rework" value={form.rework} onChange={(n) => setForm((f) => ({ ...f, rework: n }))} />
            <NumField label="2.Kalite" value={form.secondQuality} onChange={(n) => setForm((f) => ({ ...f, secondQuality: n }))} />
            <NumField label="Duruş dk" value={form.downtimeMinutes} onChange={(n) => setForm((f) => ({ ...f, downtimeMinutes: n }))} />
          </div>
          <Button className="w-full" size="lg" onClick={submit} disabled={post.isPending || form.produced <= 0}>
            Kaydet (Enter)
          </Button>
          {post.isError ? <p className="text-sm text-destructive">{(post.error as Error).message}</p> : null}
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium">Son kayıtlar</p>
          <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {(data?.entries ?? []).slice(0, 8).map((e) => (
              <li key={e.id} className="flex justify-between border-b border-border/50 py-1">
                <span>{e.operationCode} / {e.shiftCode}</span>
                <span className="tabular-nums font-medium">{e.produced} adet</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ExecutionPageFrame>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  )
}

const NumField = forwardRef<
  HTMLInputElement,
  { label: string; value: number; onChange: (n: number) => void }
>(function NumField({ label, value, onChange }, ref) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        ref={ref}
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 text-lg tabular-nums"
      />
    </div>
  )
})
