# QUALITY-VALIDATION-REPORT.md

Script: `frontend/scripts/quality-validation.mjs`  
Pipeline: `validate:quality` in `npm run build`

Checks cover:

- Domain files (inspection, qc-plan, ncr-capa, query/timeline)
- Application commands (`executeInspection/Accept/Reject/Rework/Hold`)
- Hooks (mutations + NCR detail + timeline)
- UI pages (Dashboard, Inspection, Rework, Hold, NCR Detail, Timeline)
- Router/nav wiring + startup `:ncrId` mapping
- Architecture Freeze (no NCR/QC-plan aggregate ports)

Gate evidence is recorded at delivery commit (build / bootstrap / startup regression).
