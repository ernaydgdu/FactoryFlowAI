# Phase 1 Module 2 — API Scaffold Report

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Module:** API layer (auth, tenant, domain command exposure başlangıç)

---

## Deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Tenant context runtime (domain) | DONE |
| 2 | `IIamRepository` + local/remote factory | DONE |
| 3 | Platform command gateway (local + remote) | DONE |
| 4 | API client with tenant/factory headers | DONE |
| 5 | Backend `PlatformModule` (health, context, commands) | DONE |
| 6 | Tenant middleware + JWT `tenantId` | DONE |
| 7 | Command registry (`platform.ping`, `platform.getContext`, `iam.listUsers`) | DONE |
| 8 | Settings UI — API status card + ping | DONE |
| 9 | Backend user seed script | DONE |
| 10 | Validation script (`validate:api-scaffold`) | DONE |

---

## Architecture

```
UI (Settings / IAM)
        ↓
application/platform/api + application/platform/iam
        ↓
IIamRepository / IPlatformCommandGateway
        ↓
local: domain + in-memory  |  remote: NestJS /api/*
        ↓
Backend: TenantContextMiddleware → CommandRegistry
```

### Runtime modes

| Mode | Env | IAM | Commands |
|------|-----|-----|----------|
| `local` (default) | — | In-memory domain repo | Local command registry |
| `remote` | `VITE_API_RUNTIME=remote` | Backend `/auth`, `/users` | Backend `/platform/commands` |

### API endpoints (backend)

- `GET /api/platform/health` — public health
- `GET /api/platform/context` — JWT + tenant context
- `GET /api/platform/commands` — list registered commands
- `POST /api/platform/commands` — execute command by key

---

## Validation

```bash
cd frontend && npm run validate:api-scaffold   # 28/28 PASS
cd frontend && npm run build                  # PASS
cd backend && npm run build                 # PASS
```

### Remote mode setup

```bash
# Backend
cd backend && npx prisma migrate dev && npm run db:seed
npm run start:dev

# Frontend (.env.local)
VITE_API_RUNTIME=remote
```

---

## Next Module

**Phase 1 Module 3:** Master Data CRUD (Customer, Supplier, Warehouse, Color Card, Size Set)
