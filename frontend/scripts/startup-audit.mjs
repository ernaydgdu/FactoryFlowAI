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

function extractRoutes() {
  const routes = new Set()
  for (const m of ROUTER.matchAll(/path="([^"]+)"/g)) routes.add(m[1])
  return [...routes]
    .filter((r) => !r.includes('*'))
    .map((r) =>
      r
        .replace(':productionOrderNo', 'UE-2026-0100')
        .replace(':orderId', '1')
        .replace(':poId', '1')
        .replace(':productId', '1')
        .replace(':id', '1')
        .replace(':entityPath', 'suppliers'),
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

  const routeResults = []
  for (const route of routes) {
    const beforeP = pageErrors.length
    const beforeC = consoleErrors.length
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      const rootLen = await waitRoot(page, route === '/login' ? 100 : 200, 20000)
      const rej = await page.evaluate(() => window.__startupRejections ?? [])
      for (const r of rej) rejections.push({ route, message: r })
      const newP = pageErrors.slice(beforeP)
      const newC = consoleErrors.slice(beforeC)
      const ok = newP.length === 0 && newC.length === 0 && rootLen >= (route === '/login' ? 100 : 200)
      routeResults.push({ route, ok, rootLen, pageErrors: newP, consoleErrors: newC })
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
      if (r.error) console.log(`  nav: ${r.error}`)
    }
  }

  const critFails = CRITICAL.filter((c) => !routeResults.find((r) => r.route === c)?.ok)
  console.log(`\nRoutes: ${pass}/${routes.length} PASS`)
  console.log(`Critical: ${critFails.length === 0 ? 'PASS' : 'FAIL — ' + critFails.join(', ')}`)
  console.log(`Page errors: ${pageErrors.length}`)
  console.log(`Console errors: ${consoleErrors.length}`)
  console.log(`Unhandled rejections: ${rejections.length}`)

  const out = { routeResults, pageErrors, consoleErrors, rejections, critFails, summary: { pass, fail } }
  fs.writeFileSync(path.join(ROOT, 'startup-audit-result.json'), JSON.stringify(out, null, 2))

  const clean =
    fail === 0 &&
    bootLen >= 500 &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0 &&
    rejections.length === 0 &&
    critFails.length === 0
  process.exit(clean ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
