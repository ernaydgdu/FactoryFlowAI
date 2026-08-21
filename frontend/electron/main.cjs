// Electron ana süreç dosyası. .cjs uzantısı kullanılıyor çünkü frontend/package.json
// "type": "module" ayarlı - main process CommonJS gerektiriyor.
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { spawn } = require('node:child_process')
const http = require('node:http')
const fs = require('node:fs')

const isDev = !app.isPackaged
const FRONTEND_DEV_URL = 'http://localhost:5173'
const BACKEND_PORT = process.env.PORT || 3000
const STATIC_PORT = 5180

let mainWindow = null
let backendProcess = null
let staticServer = null

function getIconPath() {
  return path.join(__dirname, '..', 'build', 'icon.ico')
}

function loadingHtml(message) {
  return (
    'data:text/html;charset=utf-8,' +
    encodeURIComponent(`<!doctype html>
<html>
  <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
    background:#1c1917;color:#f5f5f4;font-family:system-ui,sans-serif;">
    <p style="font-size:14px;">${message}</p>
  </body>
</html>`)
  )
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
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.loadURL(loadingHtml('Kepler ERP başlatılıyor...'))
}

// url'den herhangi bir HTTP yanıtı (durum kodu ne olursa olsun) gelene kadar
// bekler - sunucunun ayakta olup olmadığını anlamak için yeterlidir.
function waitForHttp(url, timeoutMs) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume()
        resolve(true)
      })
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Zaman aşımı: ${url} yanıt vermedi`))
        } else {
          setTimeout(attempt, 300)
        }
      })
      req.setTimeout(2000, () => req.destroy())
    }
    attempt()
  })
}

function startBackend() {
  const backendDir = path.join(process.resourcesPath, 'backend')
  // nest build çıktısı "dist/src/main.js" altına düşüyor (nest-cli.json'da
  // sourceRoot: "src", outDir haritalaması yok) - "dist/main.js" değil.
  const backendMain = path.join(backendDir, 'dist', 'src', 'main.js')

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

  backendProcess.stdout.on('data', (d) => console.log(`[backend] ${d}`))
  backendProcess.stderr.on('data', (d) => console.error(`[backend] ${d}`))
  backendProcess.on('exit', (code) => {
    console.log(`[backend] süreç sonlandı, kod: ${code}`)
  })
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

async function launchProduction() {
  await startStaticServer()
  startBackend()
  await waitForHttp(`http://localhost:${BACKEND_PORT}/api`, 30000)
  await mainWindow.loadURL(`http://localhost:${STATIC_PORT}`)
}

async function launchDev() {
  await waitForHttp(FRONTEND_DEV_URL, 30000)
  await mainWindow.loadURL(FRONTEND_DEV_URL)
  mainWindow.webContents.openDevTools({ mode: 'detach' })
}

app.whenReady().then(async () => {
  createWindow()

  try {
    if (isDev) {
      await launchDev()
    } else {
      await launchProduction()
    }
  } catch (err) {
    console.error(err)
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
