# Technical Debt Report — Phase 1 Module 1 (IAM)

**Date:** 2026-08-03  
**Baseline:** TECHNICAL-DEBT-REPORT-SPRINT7.md

---

## Resolved in This Module

| ID | Item | Resolution |
|----|------|------------|
| TD-P1-M1-01 | No RBAC / open routes | Role-based nav + route guards via `permission-policy` |
| TD-P1-M1-02 | Login bypasses domain layer | LoginPage → Application → Domain → Repository |
| TD-P1-M1-03 | No user admin UI | `/settings/users` with create + role update |
| TD-P1-M1-04 | Backend plaintext password on create | bcrypt hash in UsersService |
| TD-P1-M1-05 | Unprotected `/users` endpoints | JwtAuthGuard + RolesGuard |
| TD-P1-M1-06 | Settings page mock buttons | Users section wired; other sections marked Phase 1 pending |

---

## Remaining Debt (Carry Forward)

| ID | Priority | Item | Target Module |
|----|----------|------|---------------|
| TD-P1-M2-01 | P0 | Frontend IAM uses in-memory; backend API not wired to UI | Module 2 API scaffold |
| TD-P1-M2-02 | P1 | No SSO / MFA | Phase 8 Enterprise |
| TD-P1-M2-03 | P1 | Factory scope filter not enforced on business data queries | Phase 1 MD + later modules |
| TD-P1-M2-04 | P2 | Password reset / email invite flow missing | Phase 8 |
| TD-P1-M2-05 | P2 | User disable/delete UI not exposed (domain supports status) | Phase 1 Admin skeleton |
| TD-P1-M2-06 | P2 | PostgreSQL userAccounts adapter not implemented | Sprint 7+ PG wiring |
| TD-P1-M2-07 | P2 | Backend requires `prisma migrate` + seed for production auth | Module 2 |

---

## Build & Validation Status

- Frontend build: **PASS**
- IAM validation: **30/30 PASS**
- Architecture constitution: **preserved** (ports, UoW, TX, audit)
