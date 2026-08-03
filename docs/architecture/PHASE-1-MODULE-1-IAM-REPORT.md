# Phase 1 Module 1 — IAM Report

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Module:** User & Role Management (RBAC, factory scope)

---

## Deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Domain IAM types & permission policy | DONE |
| 2 | User account domain service (auth, CRUD) | DONE |
| 3 | `IUserAccountRepository` port + in-memory write path | DONE |
| 4 | TX snapshot scope for userAccounts | DONE |
| 5 | Application layer (login, list, create, update) | DONE |
| 6 | AuthContext + role-based nav/route guards | DONE |
| 7 | User Management UI (`/settings/users`) | DONE |
| 8 | Backend JWT strategy + RBAC guards | DONE |
| 9 | Validation script (`validate:iam`) | DONE |

---

## Architecture

```
LoginPage / UserManagementPage
        ↓
application/platform/iam (hooks + application service)
        ↓
domain/platform/iam (user-account.service, permission-policy)
        ↓
IUserAccountRepository → UserAccountInMemoryRepository
        ↓
auditLog stream (CREATE/UPDATE on user changes)
```

Backend (NestJS) mirrors RBAC for API path when PostgreSQL is available:
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PATCH /api/users` (JWT + RolesGuard)

---

## Pilot Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@kepler-erp.com | Kepler2026! | ADMIN |
| manager@kepler-erp.com | Kepler2026! | MANAGER |
| planner@kepler-erp.com | Kepler2026! | PLANNER |
| operator@kepler-erp.com | Kepler2026! | SHOP_FLOOR_OPERATOR |
| viewer@kepler-erp.com | Kepler2026! | VIEWER |

Factory scope: `factory-ist-001`

---

## Validation

```bash
cd frontend && npm run validate:iam   # 30/30 PASS
cd frontend && npm run build        # PASS
```

---

## Next Module

**Phase 1 Module 2:** API scaffold (tenant context, domain command exposure)
