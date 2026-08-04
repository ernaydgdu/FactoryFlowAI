# TECHNICAL-DEBT-REPORT.md — Phase 5 Module 2 (Quality)

## Known follow-ups

1. Persist CAPA as a real aggregate when process ownership is defined (currently plan-only).
2. NCR is derived (`NCR-{evaluationId}`); a dedicated NCR stream may be needed for multi-gate workflows.
3. Hold Queue reason codes are simplified (`QUALITY-HOLD`); bundle hold metadata could carry disposition detail.
4. Legacy demo pages under `/quality/inline|midline|final` still use `QUALITY_INSPECTIONS` mocks — migrate or deprecate.
5. `completeRework` remains timeline-only (pre-existing execution-platform behavior).

## Performance impact

- +2 routes (timeline, ncr/:ncrId) on top of prior quality-management set
- No bootstrap seed cost
- `validate:quality` already in build chain
