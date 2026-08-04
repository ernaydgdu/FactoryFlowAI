/**
 * Camera Scanner abstraction — no vendor lock-in.
 * ManualTextScanner is the default; StubCameraScanner simulates camera events.
 */
export type ScannerCallbacks = {
  onScan: (raw: string) => void
  onError?: (message: string) => void
}

export type ScannerHandle = {
  start: () => Promise<void>
  stop: () => Promise<void>
  isRunning: () => boolean
  injectManual?: (raw: string) => void
}

export function createManualTextScanner(callbacks: ScannerCallbacks): ScannerHandle {
  let running = false
  return {
    async start() {
      running = true
    },
    async stop() {
      running = false
    },
    isRunning: () => running,
    injectManual(raw: string) {
      if (!running) {
        callbacks.onError?.('Scanner kapalı')
        return
      }
      callbacks.onScan(raw.trim())
    },
  }
}

/** Kamera iskeleti — gerçek getUserMedia / BarcodeDetector bağlanabilir. */
export function createStubCameraScanner(callbacks: ScannerCallbacks): ScannerHandle {
  let running = false
  let timer: ReturnType<typeof setInterval> | null = null
  return {
    async start() {
      running = true
      // Demo: kamera yerine periyodik uyarı; gerçek tarama injectManual ile
      callbacks.onError?.('Kamera iskeleti aktif — gerçek cihaz entegrasyonu bekleniyor.')
    },
    async stop() {
      running = false
      if (timer) clearInterval(timer)
      timer = null
    },
    isRunning: () => running,
    injectManual(raw: string) {
      if (!running) {
        callbacks.onError?.('Kamera kapalı')
        return
      }
      callbacks.onScan(raw.trim())
    },
  }
}
