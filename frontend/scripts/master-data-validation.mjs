#!/usr/bin/env node
/**
 * Phase 1 Module 3 — Master Data CRUD validation.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

let pass = 0
let fail = 0

function check(ok, label) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (ok) pass += 1
  else fail += 1
}

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function exists(rel) {
  return existsSync(path.join(ROOT, rel))
}

console.log('=== Phase 1 Module 3 — Master Data CRUD Validation ===\n')

const requiredFiles = [
  'src/domain/master-data/master-data-crud.registry.ts',
  'src/domain/master-data/master-data-crud.service.ts',
  'src/domain/master-data/master-data-cache.ts',
  'src/application/master-data/master-data.dto.ts',
  'src/application/master-data/master-data.mapper.ts',
  'src/application/master-data/master-data.application-service.ts',
  'src/application/master-data/use-master-data.ts',
  'src/modules/master-data/pages/MasterDataListPage.tsx',
  'src/modules/master-data/pages/MasterDataHubPage.tsx',
  'src/modules/master-data/pages/MasterDataRoutePage.tsx',
  'src/modules/master-data/config/master-data-ui.config.ts',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const crudService = read('src/domain/master-data/master-data-crud.service.ts')
const crudRegistry = read('src/domain/master-data/master-data-crud.registry.ts')
const appMapper = read('src/application/master-data/master-data.mapper.ts')
const useHooks = read('src/application/master-data/use-master-data.ts')
const listPage = read('src/modules/master-data/pages/MasterDataListPage.tsx')
const router = read('src/app/router.tsx')
const auditSvc = read('src/domain/master-data/enterprise/audit-service.ts')

const entities = [
  'customer',
  'supplier',
  'warehouse',
  'productionLine',
  'workshop',
  'brand',
  'season',
  'collection',
  'colorCard',
  'sizeSet',
]

for (const entity of entities) {
  check(crudRegistry.includes(`'${entity}'`), `Registry entity: ${entity}`)
}

check(crudService.includes('persistCreateMasterDataEntity'), 'Domain: persistCreate')
check(crudService.includes('persistUpdateMasterDataEntity'), 'Domain: persistUpdate')
check(crudService.includes('persistDeactivateMasterDataEntity'), 'Domain: persistDeactivate')
check(crudService.includes('persistReactivateMasterDataEntity'), 'Domain: persistReactivate')
check(crudService.includes('assertCodeUnique'), 'Domain: code uniqueness')
check(crudService.includes('assertVersion'), 'Domain: optimistic version')
check(crudService.includes('appendMasterDataChangeRecord'), 'Domain: audit append')
check(crudService.includes('scheduleMasterDataBrainChange'), 'Domain: outbox schedule')
check(auditSvc.includes('appendMasterDataChangeRecord'), 'Audit: TX-safe append')

check(appMapper.includes('executeCreateMasterData'), 'Application: executeCreate')
check(appMapper.includes('executeUpdateMasterData'), 'Application: executeUpdate')
check(appMapper.includes('executeDeactivateMasterData'), 'Application: executeDeactivate')
check(appMapper.includes('executeReactivateMasterData'), 'Application: executeReactivate')
check(appMapper.includes('runCommandInTransaction'), 'Application: transaction wrapper')

check(useHooks.includes('useCreateMasterDataMutation'), 'Hooks: useCreateMasterDataMutation')
check(useHooks.includes('useUpdateMasterDataMutation'), 'Hooks: useUpdateMasterDataMutation')
check(useHooks.includes('useDeactivateMasterDataMutation'), 'Hooks: useDeactivateMasterDataMutation')
check(useHooks.includes('useReactivateMasterDataMutation'), 'Hooks: useReactivateMasterDataMutation')
check(useHooks.includes('invalidateQueries'), 'Hooks: React Query invalidate')

check(listPage.includes('Pasif Yap'), 'UI: deactivate action')
check(listPage.includes('Aktif Et'), 'UI: reactivate action')
check(!listPage.includes('Sil'), 'UI: no hard delete')
check(!listPage.includes("from '@/domain/master-data/repositories'"), 'UI: no direct domain repository import')

check(router.includes('/master-data'), 'Router: master-data routes')

check(crudRegistry.includes('MASTER_DATA_CRUD_ENTITY_KEYS'), 'Registry: entity keys exported')
check(
  (crudRegistry.match(/entityType: 'customer'/)?.length ?? 0) >= 1 &&
    (crudRegistry.match(/entityType: 'sizeSet'/)?.length ?? 0) >= 1,
  'Registry: 10 CRUD entities',
)

console.log(`\n=== Summary: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
