/**
 * Phase 5 Module 3 — Barcode & Mobile UI (production workflows).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  newIdempotencyKey,
  useBarcodeDashboard,
  useFgReceiptScanMutation,
  useMaterialIssueScanMutation,
  useOfflineQueue,
  useProductionWorkflowScanMutation,
  useReceivingScanMutation,
  useScanBundleMutation,
  useScanFinishedGoodsMutation,
  useScanMaterialMutation,
  useScanOperationMutation,
  useScanProductionMutation,
  useShipmentScanMutation,
  useSyncOfflineQueueMutation,
} from '@/application/barcode-mobile/use-barcode-mobile'
import type { ScanResultDto } from '@/application/barcode-mobile/barcode-mobile.dto'
import { DataTable, ErpModuleShell } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createCameraScanner,
  createManualTextScanner,
  type ScannerHandle,
} from '@/domain/barcode-mobile/scanner-abstraction'

const OPERATOR_KEY = 'ffai.barcode.operator'

function getOperator(): string {
  return sessionStorage.getItem(OPERATOR_KEY) ?? ''
}

function setOperator(id: string) {
  sessionStorage.setItem(OPERATOR_KEY, id)
}

function ResultBanner({ result }: { result: ScanResultDto | null }) {
  if (!result) return null
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        result.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900'
      }`}
    >
      <div className="font-medium">
        {result.ok ? 'OK' : 'FAIL'} · {result.kind}
        {result.idempotentReplay ? ' · replay' : ''}
        {result.entityNo ? ` · ${result.entityNo}` : ''}
      </div>
      <div>{result.message}</div>
      <div className="mt-1 font-mono text-xs break-all opacity-80">{result.raw}</div>
    </div>
  )
}

function ResolveScanPanel({
  title,
  description,
  placeholder,
  onScan,
  pending,
}: {
  title: string
  description: string
  placeholder: string
  onScan: (raw: string) => Promise<ScanResultDto>
  pending?: boolean
}) {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<ScanResultDto | null>(null)
  async function submit() {
    if (!raw.trim()) return
    setResult(await onScan(raw.trim()))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border px-3 font-mono text-sm"
          placeholder={placeholder}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        <Button disabled={pending || !raw.trim()} onClick={() => void submit()}>
          Tara (resolve)
        </Button>
        <ResultBanner result={result} />
      </CardContent>
    </Card>
  )
}

function WorkflowPanel({
  title,
  description,
  placeholder,
  extraFields,
  onSubmit,
  pending,
}: {
  title: string
  description: string
  placeholder: string
  extraFields: ReactNode
  onSubmit: (raw: string, offline: boolean) => Promise<ScanResultDto>
  pending?: boolean
}) {
  const [raw, setRaw] = useState('')
  const [offline, setOffline] = useState(false)
  const [result, setResult] = useState<ScanResultDto | null>(null)
  async function submit() {
    if (!raw.trim()) return
    setResult(await onSubmit(raw.trim(), offline))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border px-3 font-mono text-sm"
          placeholder={placeholder}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        {extraFields}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
          Offline kuyruğa al (sync sonra yazar)
        </label>
        <Button disabled={pending || !raw.trim()} onClick={() => void submit()}>
          Kaydet / Tara
        </Button>
        <ResultBanner result={result} />
      </CardContent>
    </Card>
  )
}

export function BarcodeDashboardPage() {
  const { data, isLoading } = useBarcodeDashboard()
  const sync = useSyncOfflineQueueMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="Barcode Dashboard" description="Formats · Offline queue · Sync" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/barcode-mobile/operator">Mobile Operator</Link>
          </Button>
          <Button variant="secondary" disabled={sync.isPending} onClick={() => void sync.mutateAsync()}>
            Sync Offline Queue
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Barcode / QR / GS1</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => `${r.symbology}-${r.example}`}
              data={data.formats}
              columns={[
                { key: 'kind', header: 'Kind', render: (r) => r.kind },
                { key: 'sym', header: 'Symbology', render: (r) => r.symbology },
                { key: 'ex', header: 'Örnek', render: (r) => <span className="font-mono text-xs">{r.example}</span> },
                { key: 'd', header: 'Açıklama', render: (r) => r.description },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offline Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.queuePreview}
              columns={[
                { key: 'id', header: 'ID', render: (r) => r.id },
                { key: 'w', header: 'Workflow', render: (r) => r.workflow },
                { key: 's', header: 'Status', render: (r) => r.status },
                { key: 'k', header: 'Idempotency', render: (r) => <span className="font-mono text-xs">{r.idempotencyKey}</span> },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function MobileOperatorPage() {
  const [operatorId, setOperatorId] = useState(getOperator)
  const [draft, setDraft] = useState(operatorId)
  const queue = useOfflineQueue()
  const sync = useSyncOfflineQueueMutation()

  return (
    <div className="mx-auto max-w-lg space-y-4 p-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operator Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {operatorId ? (
            <>
              <p className="text-sm">
                Aktif: <span className="font-semibold">{operatorId}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem(OPERATOR_KEY)
                  setOperatorId('')
                  setDraft('')
                }}
              >
                Çıkış
              </Button>
            </>
          ) : (
            <>
              <input
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="operator-1"
              />
              <Button
                onClick={() => {
                  const id = draft.trim() || 'operator-1'
                  setOperator(id)
                  setOperatorId(id)
                }}
              >
                Giriş
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      {operatorId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflows</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              ['receiving', 'Receiving'],
              ['material-issue', 'Material Issue'],
              ['production', 'Production'],
              ['fg-receipt', 'FG Receipt'],
              ['shipment', 'Shipment'],
              ['scanner', 'Scanner'],
            ].map(([path, label]) => (
              <Button key={path} asChild size="sm" variant="secondary">
                <Link to={`/barcode-mobile/${path}`}>{label}</Link>
              </Button>
            ))}
            <Button size="sm" disabled={sync.isPending} onClick={() => void sync.mutateAsync()}>
              Sync
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offline ({queue.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={queue.data ?? []}
            columns={[
              { key: 'w', header: 'Workflow', render: (r) => r.workflow },
              { key: 's', header: 'Status', render: (r) => r.status },
              { key: 'a', header: 'Attempts', render: (r) => r.attempts },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ScannerScreenPage() {
  const scanOp = useScanOperationMutation()
  const scanProd = useScanProductionMutation()
  const [mode, setMode] = useState<'manual' | 'camera'>('manual')
  const [result, setResult] = useState<ScanResultDto | null>(null)
  const [hint, setHint] = useState('')
  const handleRef = useRef<ScannerHandle | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scanOpRef = useRef(scanOp)
  scanOpRef.current = scanOp
  const [manual, setManual] = useState('')

  useEffect(() => {
    const callbacks = {
      onScan: (raw: string) => {
        void scanOpRef.current.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1' }).then(setResult)
      },
      onError: (message: string) => setHint(message),
    }
    const handle =
      mode === 'camera' ? createCameraScanner(callbacks, videoRef.current) : createManualTextScanner(callbacks)
    handleRef.current = handle
    void handle.start()
    return () => {
      void handle.stop()
    }
  }, [mode])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scanner — Operation / Production resolve</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={mode === 'manual' ? 'default' : 'outline'} onClick={() => setMode('manual')}>
              Manual / Wedge
            </Button>
            <Button size="sm" variant={mode === 'camera' ? 'default' : 'outline'} onClick={() => setMode('camera')}>
              Camera
            </Button>
          </div>
          {mode === 'camera' ? (
            <video ref={videoRef} className="h-48 w-full rounded-md bg-black object-cover" muted playsInline />
          ) : null}
          {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}
          <input
            className="flex h-10 w-full rounded-md border px-3 font-mono text-sm"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="KPL-OP-V1|UE-…|CUT"
          />
          <div className="flex gap-2">
            <Button onClick={() => handleRef.current?.injectManual?.(manual)}>Inject</Button>
            <Button
              variant="secondary"
              onClick={() =>
                void scanProd
                  .mutateAsync({ raw: manual, actorUserId: getOperator() || 'operator-1' })
                  .then(setResult)
              }
            >
              Production Resolve
            </Button>
          </div>
          <ResultBanner result={result} />
        </CardContent>
      </Card>
    </div>
  )
}

export function ReceivingScanPage() {
  const scan = useReceivingScanMutation()
  const [poId, setPoId] = useState('')
  const [wh, setWh] = useState('')
  const [qty, setQty] = useState('1')
  return (
    <WorkflowPanel
      title="Receiving Scan"
      description="Mal kabul → persistPostGoodsReceipt (audit + timeline + outbox, idempotent)"
      placeholder="KPL-MAT-V1|… veya GS1"
      pending={scan.isPending}
      extraFields={
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="h-9 rounded-md border px-2 text-sm" placeholder="PO id" value={poId} onChange={(e) => setPoId(e.target.value)} />
          <input className="h-9 rounded-md border px-2 text-sm" placeholder="Warehouse" value={wh} onChange={(e) => setWh(e.target.value)} />
          <input className="h-9 rounded-md border px-2 text-sm" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
      }
      onSubmit={(raw, offline) =>
        scan.mutateAsync({
          workflow: 'RECEIVING',
          raw,
          purchaseOrderId: poId,
          warehouseCode: wh,
          quantity: Number(qty),
          actorUserId: getOperator() || 'operator-1',
          idempotencyKey: newIdempotencyKey('rcv'),
          offline,
        })
      }
    />
  )
}

export function MaterialIssueScanPage() {
  const scan = useMaterialIssueScanMutation()
  const [qty, setQty] = useState('1')
  const [wh, setWh] = useState('')
  const [po, setPo] = useState('')
  return (
    <WorkflowPanel
      title="Material Issue Scan"
      description="Malzeme çıkış → persistGoodsIssue (idempotent referenceNo)"
      placeholder="KPL-MAT-V1|…"
      pending={scan.isPending}
      extraFields={
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="h-9 rounded-md border px-2 text-sm" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <input className="h-9 rounded-md border px-2 text-sm" placeholder="Warehouse (opt)" value={wh} onChange={(e) => setWh(e.target.value)} />
          <input className="h-9 rounded-md border px-2 text-sm" placeholder="UE (opt)" value={po} onChange={(e) => setPo(e.target.value)} />
        </div>
      }
      onSubmit={(raw, offline) =>
        scan.mutateAsync({
          workflow: 'MATERIAL_ISSUE',
          raw,
          quantity: Number(qty),
          warehouseCode: wh || undefined,
          productionOrderNo: po || undefined,
          actorUserId: getOperator() || 'operator-1',
          idempotencyKey: newIdempotencyKey('iss'),
          offline,
        })
      }
    />
  )
}

export function ProductionScanWorkflowPage() {
  const scan = useProductionWorkflowScanMutation()
  const [qty, setQty] = useState('1')
  return (
    <WorkflowPanel
      title="Production Scan"
      description="Operasyon barkodu → persistProductionDeclaration (reasonCode IDEM)"
      placeholder="KPL-OP-V1|UE-…|OP"
      pending={scan.isPending}
      extraFields={
        <input className="h-9 w-full rounded-md border px-2 text-sm" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
      }
      onSubmit={(raw, offline) =>
        scan.mutateAsync({
          workflow: 'PRODUCTION',
          raw,
          produced: Number(qty),
          actorUserId: getOperator() || 'operator-1',
          idempotencyKey: newIdempotencyKey('prd'),
          offline,
        })
      }
    />
  )
}

export function FgReceiptScanPage() {
  const scan = useFgReceiptScanMutation()
  const [qty, setQty] = useState('1')
  const [wh, setWh] = useState('MML-01')
  return (
    <WorkflowPanel
      title="FG Receipt Scan"
      description="Mamül kabul → persistFinishedGoodsReceipt (idempotent key)"
      placeholder="KPL-FG-V1|UE-… veya fg-UE"
      pending={scan.isPending}
      extraFields={
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="h-9 rounded-md border px-2 text-sm" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <input className="h-9 rounded-md border px-2 text-sm" value={wh} onChange={(e) => setWh(e.target.value)} placeholder="Mamül WH" />
        </div>
      }
      onSubmit={(raw, offline) =>
        scan.mutateAsync({
          workflow: 'FG_RECEIPT',
          raw,
          quantity: Number(qty),
          warehouseCode: wh,
          actorUserId: getOperator() || 'operator-1',
          idempotencyKey: newIdempotencyKey('fg'),
          offline,
        })
      }
    />
  )
}

export function ShipmentScanPage() {
  const scan = useShipmentScanMutation()
  const [qty, setQty] = useState('1')
  const [wh, setWh] = useState('')
  return (
    <WorkflowPanel
      title="Shipment Scan"
      description="Sevkiyat → persistShipment (SHIPMENT + audit/timeline/outbox)"
      placeholder="KPL-MAT / KPL-FG / GS1"
      pending={scan.isPending}
      extraFields={
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="h-9 rounded-md border px-2 text-sm" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <input className="h-9 rounded-md border px-2 text-sm" placeholder="Warehouse (opt)" value={wh} onChange={(e) => setWh(e.target.value)} />
        </div>
      }
      onSubmit={(raw, offline) =>
        scan.mutateAsync({
          workflow: 'SHIPMENT',
          raw,
          quantity: Number(qty),
          warehouseCode: wh || undefined,
          actorUserId: getOperator() || 'operator-1',
          idempotencyKey: newIdempotencyKey('shp'),
          offline,
        })
      }
    />
  )
}

export function BundleScanPage() {
  const scan = useScanBundleMutation()
  return (
    <ResolveScanPanel
      title="Bundle Scan (resolve)"
      description="lookupBundleByScan"
      placeholder="KPL-BUNDLE-V1|…"
      pending={scan.isPending}
      onScan={(raw) => scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1' })}
    />
  )
}

export function MaterialScanPage() {
  const scan = useScanMaterialMutation()
  return (
    <ResolveScanPanel
      title="Material Scan (resolve)"
      description="Stok kartı resolve"
      placeholder="KPL-MAT-V1|…"
      pending={scan.isPending}
      onScan={(raw) => scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1' })}
    />
  )
}

export function FinishedGoodsScanPage() {
  const scan = useScanFinishedGoodsMutation()
  return (
    <ResolveScanPanel
      title="Finished Goods Scan (resolve)"
      description="UE / fg- resolve"
      placeholder="KPL-FG-V1|UE-…"
      pending={scan.isPending}
      onScan={(raw) => scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1' })}
    />
  )
}

export function QualityScanPage() {
  const scan = useScanBundleMutation()
  return (
    <ResolveScanPanel
      title="Quality Scan (resolve)"
      description="Bundle resolve — quality aggregate yazılmaz"
      placeholder="KPL-BUNDLE-V1|…"
      pending={scan.isPending}
      onScan={(raw) => scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1' })}
    />
  )
}

export function WarehouseScanPage() {
  return <MaterialIssueScanPage />
}
