/**
 * Camera Scanner abstraction — browser BarcodeDetector + getUserMedia when available.
 * ManualTextScanner covers wedge/keyboard; no vendor SDK lock-in.
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

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  const w = typeof window !== 'undefined' ? (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }) : null
  return w?.BarcodeDetector ?? null
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
      const value = raw.trim()
      if (value) callbacks.onScan(value)
    },
  }
}

/**
 * Live camera scanner — uses BarcodeDetector API when present.
 * Falls back to manual inject if detector/camera unavailable (still production path for wedge).
 */
export function createCameraScanner(
  callbacks: ScannerCallbacks,
  videoEl?: HTMLVideoElement | null,
): ScannerHandle {
  let running = false
  let stream: MediaStream | null = null
  let raf = 0
  let detector: BarcodeDetectorLike | null = null
  let lastValue = ''
  let lastAt = 0

  async function tick() {
    if (!running || !videoEl || !detector) return
    try {
      if (videoEl.readyState >= 2) {
        const codes = await detector.detect(videoEl)
        const raw = codes[0]?.rawValue?.trim()
        const now = Date.now()
        if (raw && (raw !== lastValue || now - lastAt > 1500)) {
          lastValue = raw
          lastAt = now
          callbacks.onScan(raw)
        }
      }
    } catch (e) {
      callbacks.onError?.((e as Error).message)
    }
    if (running) raf = requestAnimationFrame(() => void tick())
  }

  return {
    async start() {
      running = true
      const Ctor = getBarcodeDetector()
      if (!Ctor) {
        callbacks.onError?.('BarcodeDetector desteklenmiyor — manuel / wedge kullanın.')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        callbacks.onError?.('Kamera API yok — manuel / wedge kullanın.')
        return
      }
      detector = new Ctor({
        formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix'],
      })
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (videoEl) {
          videoEl.srcObject = stream
          await videoEl.play()
        }
        raf = requestAnimationFrame(() => void tick())
      } catch (e) {
        callbacks.onError?.(`Kamera açılamadı: ${(e as Error).message}`)
      }
    },
    async stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
      if (videoEl) videoEl.srcObject = null
      detector = null
    },
    isRunning: () => running,
    injectManual(raw: string) {
      if (!running) {
        callbacks.onError?.('Scanner kapalı')
        return
      }
      const value = raw.trim()
      if (value) callbacks.onScan(value)
    },
  }
}

/** @deprecated use createCameraScanner */
export function createStubCameraScanner(callbacks: ScannerCallbacks): ScannerHandle {
  return createCameraScanner(callbacks)
}
