# Execution Platform — UI Architecture Report

**Tarih:** 2026-08-02  
**Kapsam:** `frontend/src/modules/execution-platform/`  
**Routes:** 69/69 PASS (+12 execution-platform)

---

## Mimari Uyum

| Kural | Durum |
|-------|-------|
| UI → Application → Domain | ✅ PASS |
| Domain servis çağrısı yok | ✅ PASS (1 type-only import) |
| Business logic UI'da yok | ✅ PASS |
| Aggregate hesaplama UI'da yok | ✅ PASS |
| Brain READ ONLY | ✅ PASS |
| Permission via Application guard | ✅ PASS |

---

## Modül Yapısı

```
modules/execution-platform/
├── layout/ExecutionPlatformLayout.tsx
├── context/ExecutionWorkspaceContext.tsx   # UE + Rol workspace
├── components/
│   ├── ExecutionPageFrame.tsx              # Operasyon odaklı shell
│   ├── WorkspaceBar.tsx                    # UE seçici + rol + tema
│   ├── RequireProductionOrder.tsx
│   └── ThemeToggle.tsx
├── hooks/
│   ├── use-theme.ts
│   └── use-execution-full-state.ts
└── pages/ (11 ekran)
```

---

## Ekran → Application Hook Haritası

| Ekran | Route | Application Hooks |
|-------|-------|-------------------|
| Execution Dashboard | `/execution-platform/dashboard` | useExecutionDashboard, useExecutionContextList, useGlobalWipDensity, useExecutionBrainSummary |
| Bundle Board | `/execution-platform/bundles` | useBundleManagement, useBundleScan, useIssueBundle, useMoveBundle, useHoldBundle |
| Operation Board | `/execution-platform/operations` | useOperationExecutionView, useStartOperation, usePauseOperation, useResumeOperation, useCompleteOperation |
| Work Session Monitor | `/execution-platform/work-sessions` | useWorkSessionView |
| Daily Production Entry | `/execution-platform/daily-entry` | useDailyProductionEntries, usePostDailyProductionEntry |
| WIP Monitor | `/execution-platform/wip` | useWipMonitoring |
| Quality Gate Console | `/execution-platform/quality` | useQualityGateView, useEvaluateQualityGate |
| Execution Timeline | `/execution-platform/timeline` | useExecutionTimeline |
| Split Production | `/execution-platform/split` | useSplitProductionView, useExecuteSplitProduction |
| Production Calendar | `/execution-platform/calendar` | useExecutionCalendar |
| Brain Console | `/execution-platform/brain` | useExecutionBrainView |

---

## Tema Sistemi

| Token | Kullanım |
|-------|----------|
| `--primary` | Kurumsal mavi — nav active, CTA |
| `--critical` | Kepler bordo — Brain, darboğaz KPI, kritik uyarı |
| `--background`, `--card`, `--border` | Light/Dark semantic |
| `.dark` class | ThemeToggle + localStorage |

Hardcoded hex yok — tüm renkler CSS variable.

---

## Lazy Loading

Tüm 11 sayfa + layout `lazyPage()` ile yüklenir. Execution bundle ~2–4 KB/sayfa (gzip).

---

## Architecture Freeze

Domain ve Application katmanına **dokunulmadı**.
