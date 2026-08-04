#!/usr/bin/env node
/**
 * Phase 1 Module 2 — API scaffold validation.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BACKEND = path.resolve(ROOT, '..', 'backend')

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function backendRead(rel) {
  return readFileSync(path.join(BACKEND, rel), 'utf8')
}

function exists(rel) {
  return existsSync(path.join(ROOT, rel))
}

function backendExists(rel) {
  return existsSync(path.join(BACKEND, rel))
}

let pass = 0
let fail = 0

function check(ok, label) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (ok) pass += 1
  else fail += 1
}

console.log('=== Phase 1 Module 2 — API Scaffold Validation ===\n')

const frontendFiles = [
  'src/domain/platform/tenant/types.ts',
  'src/domain/platform/tenant/tenant-context.runtime.ts',
  'src/domain/ports/platform/iam.repository.port.ts',
  'src/domain/ports/platform/platform-command.port.ts',
  'src/infrastructure/api/api-runtime.config.ts',
  'src/infrastructure/api/platform-api.client.ts',
  'src/infrastructure/api/iam-api.repository.ts',
  'src/infrastructure/api/iam-repository.factory.ts',
  'src/infrastructure/platform/commands/local-command.registry.ts',
  'src/infrastructure/platform/commands/platform-command.gateway.ts',
  'src/application/platform/api/platform.application-service.ts',
  'src/modules/platform/components/PlatformApiStatusCard.tsx',
]

for (const file of frontendFiles) {
  check(exists(file), `Frontend file: ${file}`)
}

const backendFiles = [
  'src/platform/platform.module.ts',
  'src/platform/platform.controller.ts',
  'src/platform/middleware/tenant-context.middleware.ts',
  'src/platform/commands/command.registry.ts',
  'src/platform/commands/platform-commands.controller.ts',
  'prisma/seed.ts',
]

for (const file of backendFiles) {
  check(backendExists(file), `Backend file: ${file}`)
}

const iamMapper = read('src/application/platform/iam/iam.mapper.ts')
check(iamMapper.includes('resolveIamRepository'), 'Application IAM uses repository factory')

const apiSvc = read('src/application/platform/api/platform.application-service.ts')
check(apiSvc.includes('commandExecutePlatform'), 'Application command gateway exposed')

const localRegistry = read('src/infrastructure/platform/commands/local-command.registry.ts')
check(localRegistry.includes('platform.ping'), 'Local command: platform.ping')
check(localRegistry.includes('iam.listUsers'), 'Local command: iam.listUsers')

const apiClient = read('src/services/api.ts')
check(apiClient.includes('X-Tenant-Id'), 'API client sends tenant header')

const cmdRegistry = backendRead('src/platform/commands/command.registry.ts')
check(cmdRegistry.includes('platform.ping'), 'Backend command: platform.ping')
check(cmdRegistry.includes('platform.getContext'), 'Backend command: platform.getContext')

const platformModule = backendRead('src/platform/platform.module.ts')
check(platformModule.includes('TenantContextMiddleware'), 'Backend tenant middleware wired')

const authSvc = backendRead('src/auth/auth.service.ts')
check(authSvc.includes('tenantId'), 'JWT payload includes tenantId')

const registryKeys = (localRegistry.match(/handlers\.set\('([^']+)'/g) ?? []).length
check(registryKeys >= 3, `Local registry registers ${registryKeys} commands`)

console.log(`\n=== Summary: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
