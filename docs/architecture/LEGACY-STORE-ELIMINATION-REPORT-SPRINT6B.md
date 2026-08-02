# Legacy Store Elimination Report — Sprint 6B

**Generated:** 2026-08-02

---

## Eliminated in Sprint 6B

| Store | File | Replaced By |
|-------|------|-------------|
| `calendarStore[]` | `execution-platform-service.ts` | `productionCalendar` port |
| `calendarCounter` | `execution-platform-service.ts` | adapter counter |
| `timelineStore[]` | `enterprise-timeline-service.ts` | `enterpriseTimeline` port |
| `commentStore[]` | `comment-service.ts` | `comments` port |
| `tagStore[]` | `tag-service.ts` | `entityTags` port |
| `attachmentStore[]` | `attachment-service.ts` | `attachments` port |
| `watcherStore[]` | `watcher-service.ts` | `watchers` port |
| `notificationStore[]` | `watcher-service.ts` | `watcherNotifications` port |
| `memoryStore[]` | `ai-memory-service.ts` | `aiMemory` port |
| `feedbackStore[]` | `human-feedback-engine.ts` | `humanFeedback` port |
| `decisionStore[]` | `decision-memory-engine.ts` | `brainDecisionMemory` port |
| `calendarSlots[]` | `store-registry.ts` | removed (consolidated) |

---

## Verification

```bash
grep -r '^const \w+Store' frontend/src/domain/
# Result: 0 matches ✅
```

---

## Dual Access Path Check

| Check | Result |
|-------|--------|
| Domain imports infrastructure | ❌ None |
| Store + port dual write | ❌ None |
| Generic Empty* in UoW | ❌ None (replaced with named adapters) |

---

## Intentionally Retained (Non-Persistence)

| Item | Location | Justification |
|------|----------|---------------|
| `handlers` Map | `event-bus.ts` | In-process pub/sub registry — not persisted state |
| `domain/data/*.ts` | Demo seed files | Chapter 1 demo data; domain services read via import (future: catalog port migration) |
| Local `const x: T[] = []` | Various services | Ephemeral computation buffers — not module-level stores |
