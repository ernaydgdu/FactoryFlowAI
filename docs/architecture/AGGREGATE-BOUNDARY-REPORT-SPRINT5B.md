# Aggregate Boundary Report — Sprint 5b

**Generated:** 2026-08-02  
**Authority:** [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md) §2

---

## AR vs Stream vs Read Model — Final Mapping

| Domain Entity | Classification | Port | TX Inside | TX Outside |
|---------------|---------------|------|-----------|------------|
| **ExecutionContext** | Aggregate Root | P06 | init, rollup save | — |
| **OperationExecution** | Child of P06 | *(no port)* | with ExecutionContext | — |
| **Bundle** | Aggregate Root | P08 | move, hold, split | — |
| **BundleTicket** | Child of P08 | *(no port)* | with Bundle | — |
| **OperationWorkSession** | Stream | P09 | append | — |
| **QualityGateEvaluation** | Stream | P10 | append (+ Bundle save same TX) | — |
| **ExecutionTimelineEvent** | Stream | P12 | append | — |
| **AuditLogEntry** | Stream | P20 | append (mandatory) | — |
| **Order TimelineEntry** | Stream | P21 | append | — |
| **WipTransfer** | Stream | P11 | append | — |
| **WipPosition** | Read Model | P23 | — | refresh |
| **ProductionOrder** | Aggregate Root | P03 | lifecycle commands | — |
| **SplitExecution** | Aggregate Root | P13 | BR-11 split | — |
| **StockLedger** | Aggregate Root | P14 | reserve, consume | — |
| **StockMovement** | Stream | P15 | append with ledger | — |

---

## Removed Ports (Constitution Correction)

| Removed | Reason | Replacement |
|---------|--------|-------------|
| `IOperationExecutionRepository` | Child entity — violates one-AR-one-port | `IExecutionContextRepository` includes `operationExecutions[]` |
| `IQualityGateRepository` (aggregate) | Evaluations are immutable append | `IQualityGateEvaluationStreamRepository` |

---

## Transaction Boundary Validation

### ✅ Correct: Bundle Move (isolated hot path)

```
TX: Bundle.save → WipTransfer.append → ExecutionEvent.append → Audit.append → Outbox.enqueue
POST-COMMIT: WipPosition.refresh → Brain → Dashboard
```

ExecutionContext **NOT** in Bundle move TX.

### ✅ Correct: Quality Gate

```
TX: QualityGateEvaluation.append → Bundle.save (hold/release) → ExecutionEvent.append → Audit.append
```

### ✅ Correct: Work Session

```
TX-1 (hot): WorkSession.append → ExecutionEvent.append → Audit.append
TX-2 (warm, optional/outbox): ExecutionContext.save (rollup)
```

### ✅ Correct: Audit & Timeline

Always **inside** command TX. Audit failure = rollback.

---

## 18 Aggregate Roots — Port Assignment

All 18 AR from Constitution §2.5 have exactly **one** repository interface:

| # | AR | Port |
|---|-----|------|
| 1–18 | SalesOrder … BrainConfiguration | See Repository Coverage Report |

No AR shares a port. No port manages multiple ARs.

---

## Integrity Score

| Check | Result |
|-------|--------|
| One AR = one port | ✅ 18/18 |
| Child entities excluded from separate ports | ✅ |
| Stream entities not promoted to AR | ✅ |
| Read model not persisted as source of truth | ✅ |
| Constitution §2.3 TX matrix aligned | ✅ |

**Boundary Integrity: 100%**
