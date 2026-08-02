/**
 * Kepler ERP — Lazy Route Export Validator
 * Ensures every lazyPage() in router.tsx resolves to a real named export.
 * Exit code 1 on mismatch (CI / prebuild gate).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ROUTER_PATH = path.join(ROOT, 'src/app/router.tsx')
const SRC = path.join(ROOT, 'src')

const LAZY_PAGE_RE =
  /lazyPage\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*,\s*['"]([^'"]+)['"]\s*,?\s*\)/gs

function collectLazyPages(routerContent) {
  const entries = []
  const seen = new Set()
  for (const match of routerContent.matchAll(LAZY_PAGE_RE)) {
    const importPath = match[1]
    const exportName = match[2]
    const key = `${importPath}::${exportName}`
    if (seen.has(key)) continue
    seen.add(key)

    const before = routerContent.slice(Math.max(0, (match.index ?? 0) - 80), match.index ?? 0)
    const symbol =
      before.match(/const\s+(\w+)\s*=\s*$/)?.[1] ??
      before.match(/const\s+(\w+)\s*=\s*lazyPage\s*$/)?.[1] ??
      '—'

    entries.push({ importPath, exportName, symbol, index: match.index ?? 0 })
  }
  return entries
}

function resolveModulePath(importPath) {
  const rel = importPath.startsWith('@/')
    ? importPath.slice(2)
    : importPath.replace(/^\.\//, '')
  const base = path.join(SRC, rel)
  const candidates = [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function parseExportSpec(spec) {
  const trimmed = spec.trim()
  if (!trimmed) return null
  const asParts = trimmed.split(/\s+as\s+/)
  if (asParts.length === 2) {
    return { local: asParts[0].trim(), exported: asParts[1].trim() }
  }
  return { local: trimmed, exported: trimmed }
}

function findNamedExport(modulePath, exportName, visited = new Set()) {
  if (!modulePath || visited.has(modulePath)) return { found: false, reason: 'module not found or circular re-export' }
  visited.add(modulePath)

  const content = fs.readFileSync(modulePath, 'utf8')

  const directPatterns = [
    new RegExp(`export\\s+function\\s+${exportName}\\b`),
    new RegExp(`export\\s+const\\s+${exportName}\\b`),
    new RegExp(`export\\s+class\\s+${exportName}\\b`),
    new RegExp(`export\\s+default\\s+function\\s+${exportName}\\b`),
  ]
  if (directPatterns.some((re) => re.test(content))) {
    return { found: true, via: path.relative(ROOT, modulePath) }
  }

  const inlineExportRe = /export\s*\{([^}]+)\}(?!\s*from)/g
  for (const match of content.matchAll(inlineExportRe)) {
    for (const part of match[1].split(',')) {
      const spec = parseExportSpec(part)
      if (spec?.exported === exportName) {
        return { found: true, via: path.relative(ROOT, modulePath) }
      }
    }
  }

  const reExportRe = /export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
  for (const match of content.matchAll(reExportRe)) {
    for (const part of match[1].split(',')) {
      const spec = parseExportSpec(part)
      if (!spec || spec.exported !== exportName) continue
      const target = resolveModulePath(match[2])
      const nested = findNamedExport(target, spec.local, visited)
      if (nested.found) return nested
    }
  }

  if (/export\s+default\s/.test(content) && exportName === 'default') {
    return { found: true, via: path.relative(ROOT, modulePath) }
  }

  return { found: false, reason: `export "${exportName}" not found in ${path.relative(ROOT, modulePath)}` }
}

function routeForSymbol(symbol, routerContent) {
  if (symbol === '—') return '—'
  const lines = routerContent.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(`<${symbol}`)) continue
    for (let j = i; j >= Math.max(0, i - 8); j--) {
      const pathMatch = lines[j].match(/<Route\s+path="([^"]+)"/)
      if (pathMatch) return pathMatch[1]
    }
    for (let j = i; j >= Math.max(0, i - 8); j--) {
      const nestedMatch = lines[j].match(/path="([^"]+)"/)
      if (nestedMatch && !nestedMatch[1].startsWith('/')) {
        const parent = findParentProductionPlanningRoute(lines, j)
        return parent ? `${parent}/${nestedMatch[1]}` : nestedMatch[1]
      }
    }
  }
  return '—'
}

function findParentProductionPlanningRoute(lines, fromIndex) {
  for (let j = fromIndex; j >= 0; j--) {
    const m = lines[j].match(/<Route\s+path="(\/production-planning)"/)
    if (m) return m[1]
  }
  return null
}

function main() {
  const routerContent = fs.readFileSync(ROUTER_PATH, 'utf8')
  const lazyEntries = collectLazyPages(routerContent)
  const entries = []

  for (const { importPath, exportName, symbol } of lazyEntries) {
    const modulePath = resolveModulePath(importPath)
    const result = modulePath
      ? findNamedExport(modulePath, exportName)
      : { found: false, reason: `cannot resolve import "${importPath}"` }

    const route = routeForSymbol(symbol, routerContent)

    entries.push({
      route,
      symbol,
      importPath,
      exportName,
      status: result.found ? 'PASS' : 'FAIL',
      detail: result.found ? result.via : result.reason,
    })
  }

  const failed = entries.filter((e) => e.status === 'FAIL')
  const passed = entries.filter((e) => e.status === 'PASS')

  console.log('\nKepler ERP — Lazy Route Export Validation\n')
  console.log('| Route | Symbol | Import | Export | Status |')
  console.log('|-------|--------|--------|--------|--------|')
  for (const e of entries.sort((a, b) => a.route.localeCompare(b.route))) {
    console.log(`| ${e.route} | ${e.symbol} | ${e.importPath.replace('@/', '')} | ${e.exportName} | ${e.status} |`)
  }
  console.log(`\nSummary: ${passed.length} PASS / ${failed.length} FAIL / ${entries.length} total\n`)

  if (failed.length > 0) {
    console.error('FAILED EXPORTS:')
    for (const e of failed) {
      console.error(`  - ${e.symbol} → ${e.importPath} :: ${e.exportName}`)
      console.error(`    ${e.detail}`)
    }
    process.exit(1)
  }

  console.log('All lazy route exports validated successfully.')
}

main()
