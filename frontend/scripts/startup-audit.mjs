#!/usr/bin/env node
/**
 * Startup regression audit — route crawl with bootstrap-aware waits.
 *
 * Modes:
 *   SMOKE (default) — login, dashboard, module routes only (max 20), fail-fast
 *   FULL            — all router routes (existing behaviour)
 *
 * FULL only when STARTUP_AUDIT_FULL=true.
 *
 * Smoke route selection (first match wins):
 *   1. STARTUP_AUDIT_ROUTES=/a,/b,/c
 *   2. STARTUP_AUDIT_PREFIX=/barcode-mobile
 *   3. Git-diff discovery of absolute path="/…" additions on src/app/router.tsx
 *
 * Env:
 *   STARTUP_AUDIT_BASE          — default http://localhost:5200
 *   STARTUP_AUDIT_FULL=true     — enable FULL mode
 *   STARTUP_AUDIT_ROUTES        — comma-separated smoke routes
 *   STARTUP_AUDIT_PREFIX        — smoke filter prefix
 *   STARTUP_AUDIT_BASE_REF      — git base for smoke discovery (default HEAD~1)
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const REPO = path.resolve(ROOT, '..')
const BASE = process.env.STARTUP_AUDIT_BASE ?? 'http://localhost:5200'
const FULL_MODE = process.env.STARTUP_AUDIT_FULL === 'true'
const MODE = FULL_MODE ? 'FULL' : 'SMOKE'
const SMOKE_MAX = 20
const ERROR_BOUNDARY_TEXT = 'Bir hata oluştu'

const ROUTER = fs.readFileSync(path.join(ROOT, 'src/app/router.tsx'), 'utf8')
const ROUTER_REL = 'frontend/src/app/router.tsx'

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

function normalizeRouteParams(route) {
  return route
    .replace(':productionOrderNo', 'UE-2026-0100')
    .replace(':orderId', '1')
    .replace(':poId', '1')
    .replace(':productId', '1')
    .replace(':id', '1')
    .replace(':entityPath', 'suppliers')
    .replace(':code', 'HMD-01')
    .replace(':ncrId', 'NCR-1')
    .replace(':packingListId', 'pl-1')
    .replace(':shipmentId', 'sh-1')
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
      stack.push(t.path ? resolve(t.path) : (stack.at(-1) ?? ''))
      if (t.path && !t.path.includes('*')) routes.add(resolve(t.path))
    } else if (t.type === 'close') {
      stack.pop()
    }
  }

  return [...routes].map(normalizeRouteParams).sort()
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

function gitDiff(args) {
  try {
    return execSync(`git diff ${args}`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch {
    return ''
  }
}

/** Absolute path="/…" additions from router diffs (working tree + vs base ref). */
function discoverModulePrefixesFromGit() {
  const baseRef = process.env.STARTUP_AUDIT_BASE_REF ?? 'HEAD~1'
  const blobs = [
    gitDiff(`-- ${ROUTER_REL}`),
    gitDiff(`--cached -- ${ROUTER_REL}`),
    gitDiff(`${baseRef} HEAD -- ${ROUTER_REL}`),
  ]
  const prefixes = new Set()
  for (const diff of blobs) {
    for (const line of diff.split('\n')) {
      if (!line.startsWith('+') || line.startsWith('+++')) continue
      const m = line.match(/path="(\/[^"]+)"/)
      if (m) prefixes.add(m[1])
    }
  }
  return [...prefixes]
}

function resolveSmokeRoutes(allRoutes) {
  const explicit = process.env.STARTUP_AUDIT_ROUTES?.trim()
  if (explicit) {
    return explicit
      .split(',')
      .map((s) => normalizeRouteParams(s.trim()))
      .filter(Boolean)
      .slice(0, SMOKE_MAX)
  }

  const prefix = process.env.STARTUP_AUDIT_PREFIX?.trim()
  if (prefix) {
    return allRoutes.filter((r) => r === prefix || r.startsWith(`${prefix}/`)).slice(0, SMOKE_MAX)
  }

  const prefixes = discoverModulePrefixesFromGit()
  if (prefixes.length > 0) {
    const matched = allRoutes.filter((r) => prefixes.some((p) => r === p || r.startsWith(`${p}/`)))
    return matched.slice(0, SMOKE_MAX)
  }

  return null
}

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
  const allRoutes = extractRoutes()
  let routes
  let smokeAbort = null

  if (MODE === 'FULL') {
    routes = allRoutes
  } else {
    routes = resolveSmokeRoutes(allRoutes)
    if (!routes || routes.length === 0) {
      console.error('=== Startup Audit — SMOKE ===')
      console.error('No module routes resolved.')
      console.error('Set STARTUP_AUDIT_ROUTES=/a,/b or STARTUP_AUDIT_PREFIX=/module-path')
      console.error('Or ensure router.tsx has new absolute path="/…" lines vs STARTUP_AUDIT_BASE_REF.')
      process.exit(1)
    }
  }

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

  console.log(`=== Startup Audit — ${MODE} — ${routes.length} routes @ ${BASE} ===\n`)
  if (MODE === 'SMOKE') {
    console.log(`Smoke routes (max ${SMOKE_MAX}):`)
    for (const r of routes) console.log(`  - ${r}`)
    console.log('')
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const bootLen = await waitRoot(page, 500, 30000)
  console.log(`[${bootLen >= 500 ? 'PASS' : 'FAIL'}] Bootstrap (#root len=${bootLen})`)

  await page.fill('#email', 'admin@kepler-erp.com')
  await page.fill('#password', 'Kepler2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  await waitRoot(page, 500, 15000)
  console.log('[PASS] Login → Dashboard')

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
      await page.evaluate(() => {
        window.__startupRejections = []
      })
      const boundaryTriggered = await page
        .locator(`text=${ERROR_BOUNDARY_TEXT}`)
        .first()
        .isVisible()
        .catch(() => false)
      if (boundaryTriggered) errorBoundaryHits.push({ route })
      const newP = pageErrors.slice(beforeP)
      const newC = consoleErrors.slice(beforeC)
      const ok =
        newP.length === 0 &&
        newC.length === 0 &&
        rej.length === 0 &&
        !boundaryTriggered &&
        rootLen >= (route === '/login' ? 100 : 200)
      routeResults.push({ route, ok, rootLen, pageErrors: newP, consoleErrors: newC, boundaryTriggered })

      if (MODE === 'SMOKE' && !ok) {
        if (boundaryTriggered) smokeAbort = { reason: 'error-boundary', route }
        else if (newP.length > 0) smokeAbort = { reason: 'page-error', route, detail: newP[0].message }
        else if (newC.length > 0) smokeAbort = { reason: 'console-error', route, detail: newC[0].text }
        else if (rej.length > 0) smokeAbort = { reason: 'unhandled-rejection', route, detail: rej[0] }
        else smokeAbort = { reason: 'root-empty', route }
        console.log(`[FAIL] ${route} root=${rootLen} — SMOKE abort (${smokeAbort.reason})`)
        if (smokeAbort.detail) console.log(`  ${smokeAbort.detail}`)
        break
      }
    } catch (e) {
      routeResults.push({ route, ok: false, error: e.message })
      if (MODE === 'SMOKE') {
        smokeAbort = { reason: 'navigation-error', route, detail: e.message }
        console.log(`[FAIL] ${route} — SMOKE abort (navigation-error)`)
        console.log(`  ${e.message}`)
        break
      }
    }
  }

  await browser.close()

  let pass = 0
  let fail = 0
  for (const r of routeResults) {
    if (r.ok) {
      pass += 1
      if (MODE === 'SMOKE') console.log(`[PASS] ${r.route} root=${r.rootLen}`)
    } else {
      fail += 1
      if (!(MODE === 'SMOKE' && smokeAbort && r.route === smokeAbort.route)) {
        console.log(`[FAIL] ${r.route} root=${r.rootLen ?? 0}`)
        if (r.pageErrors?.[0]) console.log(`  page: ${r.pageErrors[0].message}`)
        if (r.consoleErrors?.[0]) console.log(`  console: ${r.consoleErrors[0].text}`)
        if (r.boundaryTriggered) console.log(`  error-boundary: triggered ("${ERROR_BOUNDARY_TEXT}" visible)`)
        if (r.error) console.log(`  nav: ${r.error}`)
      }
    }
  }

  const critFails =
    MODE === 'FULL' ? CRITICAL.filter((c) => !routeResults.find((r) => r.route === c)?.ok) : []

  console.log(`\nMode: ${MODE}`)
  console.log(`Routes: ${pass}/${routes.length} PASS${smokeAbort ? ` (aborted after ${routeResults.length})` : ''}`)
  if (MODE === 'FULL') {
    console.log(`Critical: ${critFails.length === 0 ? 'PASS' : 'FAIL — ' + critFails.join(', ')}`)
  }
  console.log(`Page errors: ${pageErrors.length}`)
  console.log(`Console errors: ${consoleErrors.length}`)
  console.log(`Unhandled rejections: ${rejections.length}`)
  console.log(`Error boundary triggers: ${errorBoundaryHits.length}`)
  if (smokeAbort) console.log(`Smoke abort: ${smokeAbort.reason} @ ${smokeAbort.route}`)

  const out = {
    mode: MODE,
    routeResults,
    pageErrors,
    consoleErrors,
    rejections,
    errorBoundaryHits,
    critFails,
    smokeAbort,
    summary: { pass, fail, aborted: Boolean(smokeAbort) },
  }
  fs.writeFileSync(path.join(ROOT, 'startup-audit-result.json'), JSON.stringify(out, null, 2))

  const clean =
    fail === 0 &&
    !smokeAbort &&
    bootLen >= 500 &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0 &&
    rejections.length === 0 &&
    errorBoundaryHits.length === 0 &&
    (MODE === 'SMOKE' || critFails.length === 0)
  process.exit(clean ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
