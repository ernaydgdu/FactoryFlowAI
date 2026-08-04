# STARTUP-AUDIT.md — Smoke vs Full

**Tool:** `frontend/scripts/startup-audit.mjs`  
**Application behaviour:** unchanged (audit tooling only)

## Modes

| Mode | When | Behaviour |
|------|------|-----------|
| **SMOKE** (default) | Every module gate | Login → Dashboard → module routes only (max **20**). **Fail-fast** on first error boundary, console error, or page error. |
| **FULL** | Sprint end / release / explicit ask | All router routes. Existing crawl behaviour (no fail-fast mid-run). |

FULL requires:

```bash
STARTUP_AUDIT_FULL=true
```

Without that flag, the script always runs **SMOKE**.

## Smoke route selection

First match wins:

1. `STARTUP_AUDIT_ROUTES=/path-a,/path-b`
2. `STARTUP_AUDIT_PREFIX=/module-root` (all extracted routes under prefix)
3. Git diff discovery of absolute `path="/…"` additions on `frontend/src/app/router.tsx` (working tree + `STARTUP_AUDIT_BASE_REF`, default `HEAD~1`)

## Examples

```bash
# Module gate (smoke)
cd frontend
STARTUP_AUDIT_BASE=http://localhost:5173 \
STARTUP_AUDIT_PREFIX=/barcode-mobile \
node scripts/startup-audit.mjs

# Full regression (rare)
STARTUP_AUDIT_FULL=true \
STARTUP_AUDIT_BASE=http://localhost:5173 \
node scripts/startup-audit.mjs
```

## Outputs

- Console summary (`Mode: SMOKE|FULL`)
- `frontend/startup-audit-result.json` (includes `mode`, `smokeAbort`)
