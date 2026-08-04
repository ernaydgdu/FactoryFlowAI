/**
 * Phase 5 Module 3 — Barcode & Mobile UI.
 * Camera Scanner abstraction + offline queue skeleton; no Shop Floor/Quality aggregate writes.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useBarcodeDashboard,
  useFlushOfflineQueueMutation,
  useOfflineQueue,
  useScanBundleMutation,
  useScanFinishedGoodsMutation,
  useScanMaterialMutation,
  useScanOperationMutation,
  useScanProductionMutation,
} from '@/application/barcode-mobile/use-barcode-mobile'
import type { ScanResultDto } from '@/application/barcode-mobile/barcode-mobile.dto'
import { DataTable, ErpModuleShell } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createManualTextScanner, createStubCameraScanner } from '@/domain/barcode-mobile/scanner-abstraction'
import type { ScannerHandle } from '@/domain/barcode-mobile/scanner-abstraction'

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
        {result.ok ? 'OK' : 'FAIL'} · {result.kind} · {result.symbology}
      </div>
      <div>{result.message}</div>
      <div className="mt-1 font-mono text-xs break-all opacity-80">{result.raw}</div>
    </div>
  )
}

function ScanPanel({
  title,
  description,
  placeholder,
  onScan,
  pending,
}: {
  title: string
  description: string
  placeholder: string
  onScan: (raw: string, offline: boolean) => Promise<ScanResultDto>
  pending?: boolean
}) {
  const [raw, setRaw] = useState('')
  const [offline, setOffline] = useState(false)
  const [result, setResult] = useState<ScanResultDto | null>(null)

  async function submit() {
    if (!raw.trim()) return
    const r = await onScan(raw.trim(), offline)
    setResult(r)
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
          Offline kuyruğa al (iskelet)
        </label>
        <Button disabled={pending || !raw.trim()} onClick={() => void submit()}>
          Tara
        </Button>
        <ResultBanner result={result} />
      </CardContent>
    </Card>
  )
}

export function BarcodeDashboardPage() {
  const { data, isLoading } = useBarcodeDashboard()
  const flush = useFlushOfflineQueueMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="Barcode Dashboard" description="Symbology · Label · Offline Queue" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/barcode-mobile/operator">Mobile Operator</Link>
          </Button>
          <Button
            variant="secondary"
            disabled={flush.isPending}
            onClick={() => void flush.mutateAsync()}
          >
            Flush Offline Queue
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Barcode / QR / GS1 Formatları</CardTitle>
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
            <CardTitle className="text-base">Offline Queue Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.queuePreview}
              columns={[
                { key: 'id', header: 'ID', render: (r) => r.id },
                { key: 'k', header: 'Kind', render: (r) => r.kind },
                { key: 's', header: 'Status', render: (r) => r.status },
                { key: 'r', header: 'Raw', render: (r) => <span className="font-mono text-xs">{r.raw}</span> },
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

  function login() {
    const id = draft.trim() || 'operator-1'
    setOperator(id)
    setOperatorId(id)
  }

  function logout() {
    sessionStorage.removeItem(OPERATOR_KEY)
    setOperatorId('')
    setDraft('')
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operator Login (PWA)</CardTitle>
          <p className="text-sm text-muted-foreground">SessionStorage — cihaz lokal kimlik iskeleti</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {operatorId ? (
            <>
              <p className="text-sm">
                Aktif operatör: <span className="font-semibold">{operatorId}</span>
              </p>
              <Button variant="outline" onClick={logout}>
                Çıkış
              </Button>
            </>
          ) : (
            <>
              <input
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                placeholder="operator-1"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button onClick={login}>Giriş</Button>
            </>
          )}
        </CardContent>
      </Card>
      {operatorId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hızlı Rotalar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/barcode-mobile/scanner">Operation Scan</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/barcode-mobile/bundle">Bundle Scan</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/barcode-mobile/quality">Quality Scan</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/barcode-mobile/warehouse">Warehouse Scan</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/barcode-mobile/material">Material</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/barcode-mobile/finished-goods">Finished Goods</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offline Queue ({queue.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={queue.data ?? []}
            columns={[
              { key: 'id', header: 'ID', render: (r) => r.id },
              { key: 'k', header: 'Kind', render: (r) => r.kind },
              { key: 's', header: 'Status', render: (r) => r.status },
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
  const scanOpRef = useRef(scanOp)
  scanOpRef.current = scanOp
  const [manual, setManual] = useState('')

  useEffect(() => {
    const callbacks = {
      onScan: (raw: string) => {
        const actor = getOperator() || 'operator-1'
        void scanOpRef.current.mutateAsync({ raw, actorUserId: actor }).then(setResult)
      },
      onError: (message: string) => setHint(message),
    }
    const handle = mode === 'camera' ? createStubCameraScanner(callbacks) : createManualTextScanner(callbacks)
    handleRef.current = handle
    void handle.start()
    return () => {
      void handle.stop()
    }
  }, [mode])

  async function inject() {
    handleRef.current?.injectManual?.(manual)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scanner Screen — Operation / Production Scan</CardTitle>
          <p className="text-sm text-muted-foreground">Camera Scanner abstraction (manual | stub camera)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant={mode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setMode('manual')}>
              Manual
            </Button>
            <Button variant={mode === 'camera' ? 'default' : 'outline'} size="sm" onClick={() => setMode('camera')}>
              Camera Stub
            </Button>
          </div>
          {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}
          <input
            className="flex h-10 w-full rounded-md border px-3 font-mono text-sm"
            placeholder="KPL-OP-V1|UE-…|CUT"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void inject()
            }}
          />
          <div className="flex gap-2">
            <Button onClick={() => void inject()}>Inject Scan</Button>
            <Button
              variant="secondary"
              onClick={() => {
                const actor = getOperator() || 'operator-1'
                void scanProd.mutateAsync({ raw: manual, actorUserId: actor }).then(setResult)
              }}
            >
              Production Scan
            </Button>
          </div>
          <ResultBanner result={result} />
        </CardContent>
      </Card>
    </div>
  )
}

export function BundleScanPage() {
  const scan = useScanBundleMutation()
  return (
    <ScanPanel
      title="Bundle Scan"
      description="KPL-BUNDLE-V1 — lookupBundleByScan"
      placeholder="KPL-BUNDLE-V1|…"
      pending={scan.isPending}
      onScan={(raw, offline) =>
        scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1', offline })
      }
    />
  )
}

export function MaterialScanPage() {
  const scan = useScanMaterialMutation()
  return (
    <ScanPanel
      title="Material Scan"
      description="KPL-MAT-V1|code veya stok kartı kodu"
      placeholder="KPL-MAT-V1|STK-…"
      pending={scan.isPending}
      onScan={(raw, offline) =>
        scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1', offline })
      }
    />
  )
}

export function FinishedGoodsScanPage() {
  const scan = useScanFinishedGoodsMutation()
  return (
    <ScanPanel
      title="Finished Goods Scan"
      description="KPL-FG-V1|UE veya fg-UE"
      placeholder="KPL-FG-V1|UE-…"
      pending={scan.isPending}
      onScan={(raw, offline) =>
        scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1', offline })
      }
    />
  )
}

export function QualityScanPage() {
  const scan = useScanBundleMutation()
  return (
    <ScanPanel
      title="Quality Scan"
      description="Kalite hattı için bundle tarama (aggregate yazılmaz — yalnızca resolve)"
      placeholder="KPL-BUNDLE-V1|…"
      pending={scan.isPending}
      onScan={(raw, offline) =>
        scan.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1', offline })
      }
    />
  )
}

export function WarehouseScanPage() {
  const scanMat = useScanMaterialMutation()
  const scanFg = useScanFinishedGoodsMutation()
  const [mode, setMode] = useState<'material' | 'fg'>('material')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant={mode === 'material' ? 'default' : 'outline'} onClick={() => setMode('material')}>
          Material
        </Button>
        <Button size="sm" variant={mode === 'fg' ? 'default' : 'outline'} onClick={() => setMode('fg')}>
          Finished Goods / Pallet
        </Button>
      </div>
      {mode === 'material' ? (
        <ScanPanel
          title="Warehouse — Material Scan"
          description="Depo malzeme tarama"
          placeholder="KPL-MAT-V1|…"
          pending={scanMat.isPending}
          onScan={(raw, offline) =>
            scanMat.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1', offline })
          }
        />
      ) : (
        <ScanPanel
          title="Warehouse — Finished Goods Scan"
          description="Mamül / palet UE eşlemesi"
          placeholder="KPL-FG-V1|UE-… veya KPL-PAL-V1|…"
          pending={scanFg.isPending}
          onScan={(raw, offline) =>
            scanFg.mutateAsync({ raw, actorUserId: getOperator() || 'operator-1', offline })
          }
        />
      )}
    </div>
  )
}
