# WORK-SESSION-REPORT.md

Work sessions remain the MES labor/machine runtime source of truth (`operation-work-session` stream).

Shop Floor wires:

- `executeStartWorkSession` / `executeFinishWorkSession` on Operator Dashboard
- Machine Status / Labor Tracking derived from session statuses (`InProgress` → Running, `Paused` → Paused, else Idle)
- Operation Start optionally creates a session when machine/operator/shift are supplied (existing domain behavior)

No new work-session repository.
