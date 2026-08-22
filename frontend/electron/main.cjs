// Electron ana süreç dosyası. .cjs uzantısı kullanılıyor çünkü frontend/package.json
// "type": "module" ayarlı - main process CommonJS gerektiriyor.
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
const path = require('node:path')
const { spawn } = require('node:child_process')
const http = require('node:http')
const fs = require('node:fs')

// package.json "name" alanı ("frontend") yerine kullanıcı verisi klasörünün
// (%APPDATA%\Kepler ERP\...) okunur bir isimle oluşmasını sağlar.
app.setName('Kepler ERP')

const isDev = !app.isPackaged
const FRONTEND_DEV_URL = 'http://localhost:5173'
const BACKEND_PORT = process.env.PORT || 3000
const STATIC_PORT = 5180

let mainWindow = null
let backendProcess = null
let staticServer = null

// ---------------------------------------------------------------------------
// Kalıcı log dosyası (userData/logs/app.log) - basit boyut tabanlı rotation.
// Hem Electron ana sürecinin kendi adımları hem de backend child process'inin
// stdout/stderr çıktısı buraya, zaman damgasıyla yazılır.
// ---------------------------------------------------------------------------
const LOG_DIR = path.join(app.getPath('userData'), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'app.log')
const LOG_ROTATE_SIZE = 10 * 1024 * 1024 // 10MB

function initLogging() {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  try {
    const stats = fs.statSync(LOG_FILE)
    if (stats.size > LOG_ROTATE_SIZE) {
      const backupPath = path.join(LOG_DIR, 'app.log.1')
      fs.rmSync(backupPath, { force: true })
      fs.renameSync(LOG_FILE, backupPath)
    }
  } catch {
    // dosya yoksa (ilk çalıştırma) sorun değil
  }
}

function log(source, message) {
  const text = String(message).replace(/\n$/, '')
  const line = `[${new Date().toISOString()}] [${source}] ${text}\n`
  if (source === 'error' || source === 'backend-err') {
    console.error(line.trimEnd())
  } else {
    console.log(line.trimEnd())
  }
  fs.appendFile(LOG_FILE, line, () => {})
}

function getIconPath() {
  return path.join(__dirname, '..', 'build', 'icon.ico')
}

function loadingHtml(message) {
  return (
    'data:text/html;charset=utf-8,' +
    encodeURIComponent(`<!doctype html>
<html>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#1c1917;color:#f5f5f4;font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box;">
    <pre style="font-size:13px;white-space:pre-wrap;font-family:inherit;max-width:900px;">${message}</pre>
  </body>
</html>`)
  )
}

function buildAppMenu() {
  const template = [
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Log Dosyasını Aç',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => {
            shell.openPath(LOG_DIR)
          },
        },
        {
          label: 'Güncellemeleri Kontrol Et',
          click: () => {
            checkForUpdates(true)
          },
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: getIconPath(),
    show: false,
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false)
  })

  mainWindow.loadURL(loadingHtml('Kepler ERP başlatılıyor...'))
}

// Özel (frameless) pencere başlık çubuğundaki Küçült/Büyüt/Kapat butonları
// preload.cjs üzerinden bu kanallara mesaj gönderir.
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize-toggle', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)

// url'den 200 dışında bir yanıt (örn. backend ayakta ama henüz hazır değil)
// ya da hiç yanıt (backend henüz dinlemiyor) geldiğinde onProgress ile
// aşama bildirir; 200 gelince resolve eder.
function waitForHealthy(url, timeoutMs, onProgress) {
  const start = Date.now()
  let lastPhase = null
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode === 200) {
          resolve(true)
          return
        }
        if (lastPhase !== 'db') {
          lastPhase = 'db'
          onProgress('db')
        }
        retryOrTimeout()
      })
      req.on('error', () => {
        if (lastPhase !== 'starting') {
          lastPhase = 'starting'
          onProgress('starting')
        }
        retryOrTimeout()
      })
      req.setTimeout(2000, () => req.destroy())
    }
    const retryOrTimeout = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Zaman aşımı: ${url} sağlıklı bir yanıt vermedi`))
      } else {
        setTimeout(attempt, 500)
      }
    }
    attempt()
  })
}

function startBackend() {
  const backendDir = path.join(process.resourcesPath, 'backend')
  // nest build çıktısı "dist/src/main.js" altına düşüyor (nest-cli.json'da
  // sourceRoot: "src", outDir haritalaması yok) - "dist/main.js" değil.
  const backendMain = path.join(backendDir, 'dist', 'src', 'main.js')

  log('main', `Backend başlatılıyor: ${backendMain}`)

  // Electron'un kendi gömülü Node.js çalışma zamanını kullanır -
  // kullanıcının ayrıca Node.js kurmasına gerek kalmaz.
  backendProcess = spawn(process.execPath, [backendMain], {
    cwd: backendDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(BACKEND_PORT),
      CORS_ORIGIN: `http://localhost:${STATIC_PORT}`,
    },
    stdio: 'pipe',
  })

  backendProcess.stdout.on('data', (d) => log('backend', d))
  backendProcess.stderr.on('data', (d) => log('backend-err', d))
  backendProcess.on('exit', (code) => log('main', `Backend süreci sonlandı, kod: ${code}`))
  backendProcess.on('error', (err) => log('error', `Backend başlatma hatası: ${err.message}`))
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

// /api ile başlayan istekleri backend'e (BACKEND_PORT) olduğu gibi iletir -
// frontend'in varsayılan göreli "/api" baseURL'i ile aynı origin üzerinden
// çalışabilmesi için gerekli (aksi halde frontend'in API çağrıları sessizce
// index.html'e düşer, backend'e hiç ulaşmaz).
function proxyToBackend(req, res) {
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end(`Backend'e ulaşılamadı: ${err.message}`)
  })
  req.pipe(proxyReq)
}

// Paketlenmiş frontend build'ini (resources/frontend-dist) statik olarak
// sunan minik bir HTTP sunucusu - /api isteklerini backend'e yönlendirir,
// diğer SPA route'ları için index.html'e düşer.
function startStaticServer() {
  const staticDir = path.join(process.resourcesPath, 'frontend-dist')

  staticServer = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])

    if (urlPath.startsWith('/api')) {
      proxyToBackend(req, res)
      return
    }

    let filePath = path.join(staticDir, urlPath)

    if (!filePath.startsWith(staticDir)) {
      res.writeHead(403)
      res.end()
      return
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        filePath = path.join(staticDir, 'index.html')
      }
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
      fs.createReadStream(filePath).pipe(res)
    })
  })

  return new Promise((resolve, reject) => {
    staticServer.once('error', reject)
    staticServer.listen(STATIC_PORT, '127.0.0.1', resolve)
  })
}

// İlk kurulumdan sonraki ilk açılışta Windows Defender/antivirüs yeni
// yazılan yüzlerce dosyayı (backend/node_modules, Prisma engine binary'leri)
// taramaya çalışabilir ve bu, backend'in ayağa kalkmasını dakikalarca
// geciktirebilir (build sırasında aynı sebeple app.asar kilitlenmişti).
// Bu yüzden makul ama cömert bir zaman aşımı kullanılıyor.
const BACKEND_READY_TIMEOUT_MS = 120000

async function launchProduction() {
  await startStaticServer()
  log('main', `Statik sunucu hazır: http://localhost:${STATIC_PORT}`)
  startBackend()

  mainWindow.loadURL(loadingHtml('Backend başlatılıyor...'))

  try {
    await waitForHealthy(
      `http://localhost:${BACKEND_PORT}/api/health`,
      BACKEND_READY_TIMEOUT_MS,
      (phase) => {
        if (phase === 'starting') {
          mainWindow.loadURL(loadingHtml('Backend başlatılıyor...'))
        } else if (phase === 'db') {
          mainWindow.loadURL(loadingHtml('Veritabanı bağlantısı kontrol ediliyor...'))
        }
      },
    )
  } catch (err) {
    log('error', err.message)
    throw new Error(`${err.message}\n\nDetaylı log dosyası: ${LOG_FILE}`)
  }

  log('main', 'Backend ve veritabanı hazır.')
  mainWindow.loadURL(loadingHtml('Neredeyse hazır...'))
  await mainWindow.loadURL(`http://localhost:${STATIC_PORT}`)
  log('main', 'Frontend yüklendi.')
}

async function launchDev() {
  await waitForHealthy(`http://localhost:${BACKEND_PORT}/api/health`, 30000, () => {}).catch(
    (err) => log('main', `Dev backend health beklenirken: ${err.message}`),
  )
  await mainWindow.loadURL(FRONTEND_DEV_URL)
  mainWindow.webContents.openDevTools({ mode: 'detach' })
}

// ---------------------------------------------------------------------------
// Otomatik güncelleme (electron-updater + GitHub Releases). Açılışta arka
// planda sessizce kontrol eder; yeni sürüm varsa kullanıcıya sorar, onay
// verirse indirir ve uygulama kapatılıp yeniden açıldığında kurar.
// ---------------------------------------------------------------------------
function checkForUpdates(manual) {
  if (isDev) {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: 'Geliştirme modunda güncelleme kontrolü yapılmaz.',
      })
    }
    return
  }

  let autoUpdater
  try {
    ;({ autoUpdater } = require('electron-updater'))
  } catch (err) {
    log('error', `electron-updater yüklenemedi: ${err.message}`)
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.logger = { info: (m) => log('updater', m), warn: (m) => log('updater', m), error: (m) => log('error', `updater: ${m}`) }

  autoUpdater.on('update-available', (info) => {
    log('main', `Yeni sürüm bulundu: ${info.version}`)
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['İndir', 'Daha Sonra'],
        defaultId: 0,
        message: `Yeni bir güncelleme mevcut (v${info.version}). İndirmek ister misiniz?`,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', () => {
    log('main', 'Güncelleme yok, uygulama güncel.')
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: 'Kepler ERP güncel.',
      })
    }
  })

  autoUpdater.on('download-progress', (progress) => {
    log('main', `Güncelleme indiriliyor: %${progress.percent.toFixed(0)}`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log('main', `Güncelleme indirildi: ${info.version}`)
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['Şimdi Yeniden Başlat', 'Daha Sonra'],
        defaultId: 0,
        message: 'Güncelleme indirildi. Şimdi yeniden başlatıp kurmak ister misiniz?',
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    log('error', `Güncelleme kontrolü hatası: ${err.message}`)
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        message: `Güncelleme kontrolü başarısız: ${err.message}`,
      })
    }
  })

  autoUpdater.checkForUpdates().catch((err) => log('error', `checkForUpdates: ${err.message}`))
}

app.whenReady().then(async () => {
  initLogging()
  log('main', `Kepler ERP başlatılıyor (packaged=${app.isPackaged}, version=${app.getVersion()})`)
  buildAppMenu()
  createWindow()

  try {
    if (isDev) {
      await launchDev()
    } else {
      await launchProduction()
      // Pencere yüklendikten sonra, kullanıcıyı bekletmeden arka planda kontrol et.
      setTimeout(() => checkForUpdates(false), 3000)
    }
  } catch (err) {
    log('error', String(err.message || err))
    if (mainWindow) {
      mainWindow.loadURL(loadingHtml(`Başlatma hatası: ${String(err.message || err)}`))
    }
  }
})

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill()
  if (staticServer) staticServer.close()
  app.quit()
})

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill()
})
