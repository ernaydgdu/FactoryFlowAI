# Dependency Report — Sprint 5b

**Generated:** 2026-08-02  
**Scope:** `frontend/src/domain/ports/persistence/`

---

## Dependency Direction (Allowed)

```
domain/services/*          →  domain/ports/persistence/*     ✅ (Sprint 5d)
domain/ports/persistence/*  →  domain/*/types               ✅ (entity types only)
application/*              →  domain/ports/persistence/*     ✅ (UoW injection)

infrastructure/persistence/*  →  domain/ports/persistence/*  ✅ (Sprint 5c — implements)
```

## Dependency Direction (Forbidden)

```
domain/ports/persistence/*  →  infrastructure/*              ❌
domain/ports/persistence/*  →  application/*                 ❌
domain/ports/persistence/*  →  react / UI                    ❌
repository port A           →  repository port B             ❌
domain/ports/persistence/*  →  pg / prisma / typeorm         ❌
```

---

## Port File Import Analysis

| Import source | Files | Allowed |
|---------------|-------|---------|
| `./persistence.types` | all ports | ✅ |
| `./repository.base` | all ports | ✅ |
| `./persistence-aggregates` | aggregate/stream ports | ✅ |
| `domain/execution-platform/execution-types` | execution-event stream | ✅ (types only) |
| `domain/production-order/lifecycle-types` | production-order port | ✅ (types only) |
| `domain/platform/types` | entity-revision port | ✅ (types only) |
| `domain/brain/types` | persistence-aggregates | ✅ (types only) |
| `domain/master-data/types` | persistence-aggregates | ✅ (types only) |
| `infrastructure/*` | — | ✅ none found |
| Cross-port imports | — | ✅ none found |

---

## Layer Dependency Graph

```
┌─────────────┐
│     UI      │
└──────┬──────┘
       ↓
┌─────────────┐
│ Application │ ──→ IUnitOfWorkFactory (future inject)
└──────┬──────┘
       ↓
┌─────────────┐
│   Domain    │ ──→ IUnitOfWork / Repository Ports (5d)
│  Services   │
└──────┬──────┘
       ↓
┌─────────────┐
│    Ports    │ ← YOU ARE HERE (Sprint 5b)
└──────┬──────┘
       ↓
┌─────────────┐
│Infrastructure│ ← InMemory (5c) / PostgreSQL (6)
└─────────────┘
```

---

## Current Domain Service State (Pre-5d)

| Area | Still uses Map/Array | Port wired |
|------|---------------------|------------|
| execution-platform/* | ✅ yes | ❌ no |
| production-order/* | ✅ yes | ❌ no |
| platform/audit-service | ✅ yes | ❌ no |
| master-data/* | ✅ seed arrays | ❌ no |

**Expected:** Sprint 5b defines contracts only. Domain services migrate in Sprint 5d.

---

## Circular Dependency Check

| Pair | Risk | Status |
|------|------|--------|
| ports ↔ domain services | None — ports don't import services | ✅ |
| ports ↔ persistence-aggregates ↔ domain types | Acyclic | ✅ |
| UoW ↔ all ports | UoW imports port interfaces only | ✅ |

**Dependency Integrity: 100%**
