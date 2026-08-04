#!/usr/bin/env node
/**
 * Startup regression audit — route crawl with bootstrap-aware waits.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.STARTUP_AUDIT_BASE ?? 'http://localhost:5200'

const ROUTER = fs.readFileSync(path.join(ROOT, 'src/app/router.tsx'), 'utf8')

/**
 * Tokenizes <Route ...>, <Route ... />, </Route> tags in document order,
 * respecting {} brace depth so `>` characters inside `element={<L>...</L>}`
 * do not prematurely terminate the tag, and respecting multi-line tags
 * (e.g. path="..." on its own line).
 */
function tokenizeRouteTags(text) {
  const tokens = []
  let i = 0
  while (i < text.length) {
    if (text.startsWith('</Route>', i)) {
      tokens.push({ type: 'close' })
      i += '</Route>'.length
      continue
    }
    if (text.startsWith('<Route', i) && /[\s>]/.test(text[i + 6] ?? '')) {
      let j = i + 6
      let depth = 0
      let selfClosing = false
      while (j < text.length) {
        const ch = text[j]
        if (ch === '{') depth++
        else if (ch === '}') depth--
        else if (depth === 0 && ch === '>') {
          selfClosing = text[j - 1] === '/'
          j += 1
          break
        }
        j += 1
      }
      const tagText = text.slice(i, j)
      const pathMatch = tagText.match(/path="([^"]+)"/)
      tokens.push({ type: selfClosing ? 'self' : 'open', path: pathMatch?.[1] })
      i = j
      continue
    }
    i += 1
  }
  return tokens
}

function extractRoutes() {
  const tokens = tokenizeRouteTags(ROUTER)
  const stack = []
  const routes = new Set()

  const resolve = (raw) => (raw.startsWith('/') ? raw : [...stack, raw].join('/').replace(/\/{2,}/g, '/'))

  for (const t of tokens) {
    if (t.type === 'self') {
      if (t.path && !t.path.includes('*')) routes.add(resolve(t.path))
    } else if (t.type === 'open') {
      // Route blocks that wrap a layout always carry a path; index/pathless
      // opens (none in this router) would push an empty marker — guard anyway.
      stack.push(t.path ? resolve(t.path) : (stack.at(-1) ?? ''))
      if (t.path && !t.path.includes('*')) routes.add(resolve(t.path))
    } else if (t.type === 'close') {
      stack.pop()
    }
  }

  return [...routes]
    .map((r) =>
      r
        .replace(':productionOrderNo', 'UE-2026-0100')
        .replace(':orderId', '1')
        .replace(':poId', '1')
        .replace(':productId', '1')
        .replace(':id', '1')
        .replace(':entityPath', 'suppliers')
        .replace(':code', 'HMD-01')
        .replace(':ncrId', 'NCR-1'),
    )
    .sort()
}

const CRITICAL = [
  '/login',
  '/dashboard',
  '/master-data',
  '/products',
  '/products/1/bom',
  '/products/1/cost-sheet',
  '/orders',
  '/planning/mrp',
  '/purchasing',
]

async function waitRoot(page, minLen = 200, maxMs = 25000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const len = (await page.locator('#root').innerHTML()).length
    if (len >= minLen) return len
    await page.waitForTimeout(300)
  }
  return (await page.locator('#root').innerHTML()).length
}

async function main() {
  const routes = extractRoutes()
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const pageErrors = []
  const consoleErrors = []
  const rejections = []

  page.on('pageerror', (e) =>
    pageErrors.push({ url: page.url(), message: e.message, stack: e.stack?.split('\n').slice(0, 4).join('\n') }),
  )
  page.on('console', (msg) => {
    const t = msg.type()
    const text = msg.text()
    if (t === 'error') consoleErrors.push({ url: page.url(), text })
    if (t === 'warning' && text.includes('Unhandled')) rejections.push({ url: page.url(), text })
  })

  await page.addInitScript(() => {
    window.__startupRejections = []
    window.addEventListener('unhandledrejection', (e) => {
      window.__startupRejections.push(String(e.reason?.message ?? e.reason))
    })
  })

  console.log(`=== Startup Audit — ${routes.length} routes @ ${BASE} ===\n`)

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const bootLen = await waitRoot(page, 500, 30000)
  console.log(`[${bootLen >= 500 ? 'PASS' : 'FAIL'}] Bootstrap (#root len=${bootLen})`)

  await page.fill('#email', 'admin@kepler-erp.com')
  await page.fill('#password', 'Kepler2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  await waitRoot(page, 500, 15000)
  console.log('[PASS] Login → Dashboard')

  const ERROR_BOUNDARY_TEXT = 'Bir hata oluştu'
  const errorBoundaryHits = []

  const routeResults = []
  for (const route of routes) {
    const beforeP = pageErrors.length
    const beforeC = consoleErrors.length
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      const rootLen = await waitRoot(page, route === '/login' ? 100 : 200, 20000)
      const rej = await page.evaluate(() => window.__startupRejections ?? [])
      for (const r of rej) rejections.push({ route, message: r })
      const boundaryTriggered = await page
        .locator(`text=${ERROR_BOUNDARY_TEXT}`)
        .first()
        .isVisible()
        .catch(() => false)
      if (boundaryTriggered) errorBoundaryHits.push({ route })
      const newP = pageErrors.slice(beforeP)
      const newC = consoleErrors.slice(beforeC)
      const ok =
        newP.length === 0 && newC.length === 0 && !boundaryTriggered && rootLen >= (route === '/login' ? 100 : 200)
      routeResults.push({ route, ok, rootLen, pageErrors: newP, consoleErrors: newC, boundaryTriggered })
    } catch (e) {
      routeResults.push({ route, ok: false, error: e.message })
    }
  }

  await browser.close()

  let pass = 0
  let fail = 0
  for (const r of routeResults) {
    if (r.ok) pass += 1
    else {
      fail += 1
      console.log(`[FAIL] ${r.route} root=${r.rootLen ?? 0}`)
      if (r.pageErrors?.[0]) console.log(`  page: ${r.pageErrors[0].message}`)
      if (r.consoleErrors?.[0]) console.log(`  console: ${r.consoleErrors[0].text}`)
      if (r.boundaryTriggered) console.log(`  error-boundary: triggered ("${ERROR_BOUNDARY_TEXT}" visible)`)
      if (r.error) console.log(`  nav: ${r.error}`)
    }
  }

  const critFails = CRITICAL.filter((c) => !routeResults.find((r) => r.route === c)?.ok)
  console.log(`\nRoutes: ${pass}/${routes.length} PASS`)
  console.log(`Critical: ${critFails.length === 0 ? 'PASS' : 'FAIL — ' + critFails.join(', ')}`)
  console.log(`Page errors: ${pageErrors.length}`)
  console.log(`Console errors: ${consoleErrors.length}`)
  console.log(`Unhandled rejections: ${rejections.length}`)
  console.log(`Error boundary triggers: ${errorBoundaryHits.length}`)

  const out = {
    routeResults,
    pageErrors,
    consoleErrors,
    rejections,
    errorBoundaryHits,
    critFails,
    summary: { pass, fail },
  }
  fs.writeFileSync(path.join(ROOT, 'startup-audit-result.json'), JSON.stringify(out, null, 2))

  const clean =
    fail === 0 &&
    bootLen >= 500 &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0 &&
    rejections.length === 0 &&
    errorBoundaryHits.length === 0 &&
    critFails.length === 0
  process.exit(clean ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
