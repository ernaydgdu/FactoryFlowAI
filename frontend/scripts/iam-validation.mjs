#!/usr/bin/env node
/**
 * Phase 1 Module 1 — IAM validation (static + runtime).
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FRONTEND_SRC = path.join(ROOT, 'src')

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function exists(rel) {
  return existsSync(path.join(ROOT, rel))
}

let pass = 0
let fail = 0

function check(ok, label) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (ok) pass += 1
  else fail += 1
}

console.log('=== Phase 1 Module 1 — IAM Validation ===\n')

// --- Static: domain layer ---
const iamFiles = [
  'src/domain/platform/iam/types.ts',
  'src/domain/platform/iam/password-hash.ts',
  'src/domain/platform/iam/permission-policy.ts',
  'src/domain/platform/iam/user-account.service.ts',
  'src/domain/ports/persistence/aggregates/user-account.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/user-account.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/user-account-seed.bootstrap.ts',
  'src/application/platform/iam/iam.application-service.ts',
  'src/application/platform/iam/auth-context.tsx',
  'src/modules/platform/pages/UserManagementPage.tsx',
  'src/components/auth/RequireRole.tsx',
]

for (const file of iamFiles) {
  check(exists(file), `File exists: ${file}`)
}

const uowSrc = read('src/domain/ports/persistence/unit-of-work.port.ts')
check(uowSrc.includes('userAccounts: IUserAccountRepository'), 'UoW port: userAccounts')

const snapshotSrc = read('src/infrastructure/persistence/transaction/persistence-snapshot.ts')
check(snapshotSrc.includes('userAccounts:'), 'TX snapshot: userAccounts scope')

const bootstrapSrc = read('src/infrastructure/persistence/bootstrap.ts')
check(bootstrapSrc.includes('ensureUserAccountsSeeded'), 'Bootstrap: user account seed')

const domainSvc = read('src/domain/platform/iam/user-account.service.ts')
check(domainSvc.includes('persistCreateUserAccount'), 'Domain: persistCreateUserAccount write path')
check(domainSvc.includes('logCreate'), 'Domain: audit log on create')

const appMapper = read('src/application/platform/iam/iam.mapper.ts')
check(appMapper.includes('resolveIamRepository'), 'Application IAM: repository factory')

const loginPage = read('src/pages/LoginPage.tsx')
check(loginPage.includes('useLoginMutation'), 'UI: LoginPage → Application layer')

const authSvc = read('src/services/auth.ts')
check(authSvc.includes('normalizeKeplerRole'), 'Auth: getStoredUser validates role')
check(authSvc.includes('coerceKeplerRole'), 'Auth: legacy role fallback')

const iamTypes = read('src/domain/platform/iam/types.ts')
check(iamTypes.includes('normalizeKeplerRole'), 'Domain: legacy role normalization')

const userPage = read('src/modules/platform/pages/UserManagementPage.tsx')
check(userPage.includes('useCreateUserMutation'), 'UI: UserManagement → Application mutations')

// --- Static: backend RBAC ---
const backendRoot = path.resolve(ROOT, '..', 'backend')
const backendFiles = [
  'src/auth/strategies/jwt.strategy.ts',
  'src/auth/guards/jwt-auth.guard.ts',
  'src/auth/guards/roles.guard.ts',
  'src/auth/decorators/roles.decorator.ts',
]

for (const file of backendFiles) {
  check(existsSync(path.join(backendRoot, file)), `Backend file: ${file}`)
}

const usersSvc = readFileSync(path.join(backendRoot, 'src/users/users.service.ts'), 'utf8')
check(usersSvc.includes('bcrypt.hash'), 'Backend: bcrypt on user create')

const usersCtrl = readFileSync(path.join(backendRoot, 'src/users/users.controller.ts'), 'utf8')
check(usersCtrl.includes('JwtAuthGuard'), 'Backend: protected users routes')

// --- Runtime: permission policy ---
const { canAccessRoute, canManageUsers, roleHasPermission } = await import(
  path.join(FRONTEND_SRC, 'domain/platform/iam/permission-policy.ts')
)
const { normalizeKeplerRole, coerceKeplerRole } = await import(
  path.join(FRONTEND_SRC, 'domain/platform/iam/types.ts')
)

check(canManageUsers('ADMIN'), 'Policy: ADMIN can manage users')
check(!canManageUsers('PLANNER'), 'Policy: PLANNER cannot manage users')
check(canAccessRoute('PLANNER', '/orders'), 'Policy: PLANNER → /orders')
check(!canAccessRoute('VIEWER', '/orders'), 'Policy: VIEWER blocked from /orders')
check(canAccessRoute('SHOP_FLOOR_OPERATOR', '/execution-platform/dashboard'), 'Policy: operator → execution')

// --- Runtime: legacy role normalization ---
check(normalizeKeplerRole('admin') === 'ADMIN', 'Legacy: admin → ADMIN')
check(normalizeKeplerRole('USER') === 'SHOP_FLOOR_OPERATOR', 'Legacy: USER → SHOP_FLOOR_OPERATOR')
check(normalizeKeplerRole('manager') === 'MANAGER', 'Legacy: manager → MANAGER')
check(coerceKeplerRole('bogus') === 'VIEWER', 'Legacy: unknown role → VIEWER fallback')

let policyThrows = false
try {
  roleHasPermission('admin', 'dashboard.view')
  roleHasPermission('UNKNOWN_ROLE', 'dashboard.view')
} catch {
  policyThrows = true
}
check(!policyThrows, 'Policy: invalid role never throws on permission lookup')
check(canManageUsers('admin'), 'Policy: legacy admin → ADMIN permissions')

console.log(`\n=== Summary: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
