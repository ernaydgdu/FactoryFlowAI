# Enterprise Hardening Report — Phase 8

**Status:** Delivered (enterprise maturity surfaces)  
**Scope:** Bootstrap resiliency · PostgreSQL cutover readiness · permission hardening · performance · reliability audit · AI foundation (no LLM) · observability dashboards  
**Architecture Freeze:** Preserved (no new aggregate ports; memory default unchanged)

---

## Architecture Decision Records

### ADR-EH-001 — Bootstrap never white-screens
- **Decision:** UI uses `ensurePersistenceBootstrappedSafe` + `BootstrapStatusScreen`; seed phases run via `runIsolatedBootstrapPhase`.
- **Consequence:** Partial seed failures degrade, critical wiring failures show Retry — `#root` always renders status.

### ADR-EH-002 — PostgreSQL cutover catalog before activation
- **Decision:** `getPostgresCutoverReport()` inventories ports as `ready|skeleton|stub|missing`; `cutoverBlocked` remains true until stubs cleared.
- **Consequence:** In-memory mode stays production path; Postgres factory continues throw-on-use.

### ADR-EH-003 — Write permissions on command path
- **Decision:** `assertCommandPermission` / `runPermittedWriteCommand` applied to Product Card and Production Order lifecycle writes (in addition to existing finance/cost/style guards).
- **Consequence:** Route-only IAM is insufficient for those write surfaces.

### ADR-EH-004 — AI Foundation without LLM
- **Decision:** `queryEnterpriseAiFoundation` exposes Brain read-model refs, twin completeness, event catalog, recommendation/prediction interfaces with `llmEnabled: false` and `sideEffects: 'NONE'`.
- **Consequence:** Deterministic AI-ready contracts; no vendor SDK, no mutate-from-model.

### ADR-EH-005 — Observability as read models
- **Decision:** Health / Bootstrap / Performance / Audit dashboards query existing diagnostics, performance monitor, audit stream, and Postgres cutover report — no parallel persistence.
- **Consequence:** Operator visibility without new stores.

---

## Technical Debt Review

| Item | Severity | Notes |
|------|----------|-------|
| Remaining Postgres stubs | High (cutover) | Catalogued; blocked by design |
| Outbox cursor ignores filter | Medium | Health uses approximate pending count |
| Not all write mappers migrated to `runPermittedWriteCommand` | Medium | Product Card + Production Order done; prior modules retain own guards |
| Client-only performance metrics | Low | Sufficient for Phase 8 foundation |
| Twin graph on empty Brain snapshot | Low | Completeness score reflects seed/graph health |

---

## Performance Review

- Narrowed React Query invalidations for Finance Integration, Cost Closing, Style Closing (no `.all` blast radius).
- Bootstrap diagnostics record per-phase `durationMs` for operator review.
- Performance Dashboard surfaces `getPerformanceSummary` + slowest services (bounded ring buffer, max 500).
- Enterprise AI foundation queries are read-only aggregations — no N+1 writes.

---

## Security Review

- `/enterprise/*` gated by `platform.settings`.
- Command-path permission helpers prevent UI-only write bypass for hardened modules.
- Bootstrap safe path does not weaken TX/outbox wiring for critical phases.
- AI surfaces explicitly forbid side effects; no LLM credentials introduced.

---

## Reliability Review

| Concern | Finding |
|---------|---------|
| Optimistic locking | Aggregates continue `expectedVersion` / conflict on mismatch |
| Transaction boundary | Writes via UoW TX + outbox flush (`runCommandInTransaction` / permitted wrapper) |
| Idempotency | Command keys retained on Finance/Cost/Style/Export/Shipment; seeds idempotent |
| Recovery | Safe bootstrap recovers degraded ready state when non-critical seeds fail; fatal wiring shows Retry |

---

## AI Readiness Review

| Surface | Status |
|---------|--------|
| Unified Brain Read Models | Finance / Cost / Style / Export refs exposed |
| Digital Twin graph completeness | Via `buildFactoryGraph` + `assessDigitalTwinHealth` |
| Domain event catalog | Curated catalog with explainability strings |
| AI query surface | `queryEnterpriseAiFoundation` |
| Recommendation interfaces | Deterministic, `sideEffects: 'NONE'` |
| Prediction interfaces | Deterministic metrics from Brain read models |
| Explainability metadata | `deterministicOnly`, `llmEnabled: false`, audit hint |

**LLM features:** Not implemented (by design).

---

## Observability Routes

| Route | Purpose |
|-------|---------|
| `/enterprise/health` | Overall health + Postgres cutover + reliability notes |
| `/enterprise/bootstrap` | Phase diagnostics |
| `/enterprise/performance` | Client performance summary |
| `/enterprise/audit` | Last 100 audit entries |
| `/enterprise/ai` | AI Foundation surfaces |

---

## Validation

```bash
npm run validate:enterprise
```

Integrated into `frontend` `build` script before `tsc -b`.

---

## Gates

- Build · Bootstrap integrity · `validate:enterprise` · Smoke `/enterprise` · Console/ErrorBoundary 0 · ≤30 files
