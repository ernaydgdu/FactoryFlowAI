# Archive Management Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler constitution ve database spec **Archived/Closed status** pattern tanımlar; **Archive Management modülü yok**. Read-only davranış runtime'da enforce edilmiyor.

---

## Mevcut Durum

| Kaynak | Archive referansı |
|--------|-------------------|
| `ProductCard.status = 'Kapalı'` | Domain type only |
| Platform `RevisionStatus.Obsolete` | Versioning service |
| PRD gate library `Archived` | Design doc |
| Database spec | `shipment_record`, `line_allocation` archived |
| Persistence constitution | Soft delete / Archived status |
| Entity revision | Obsolete on activate |

**No:** archive job, archive UI, read-only middleware, cold storage tier.

---

## Archive Scope GAP

| Scope | Tier-1 | Kepler | P |
|-------|--------|--------|---|
| Style Archive | ProductCard + SO | ❌ | P0 |
| Product Archive | Same as style | ❌ | P0 |
| Sales Order Archive | SO + matrix frozen | ❌ | P0 |
| Production Archive | PO + execution context | ❌ | P0 |
| Document Archive | Attachments + commercial docs | ❌ | P0 |
| Revision Archive | All revision history retained | ⚠️ Platform P19 | P1 |

---

## Read Only Mode — Tanım (hedef)

| Katman | Davranış |
|--------|----------|
| Domain commands | `ArchiveGuard` reject mutations |
| Application | No create/update/delete hooks |
| UI | Edit buttons hidden; banner "Archived" |
| API | 403 on write |
| Search | Archived records searchable (role-gated) |
| Brain | Read-only ingest; no new decisions |
| Restore | Admin-only unarchive (audit required) |

Kepler: **hiçbiri uygulanmıyor**.

---

## Archive Pipeline (hedef)

```
Style Close Approved
  → Mark entities status=Archived
  → Set archivedAt, archivedBy
  → Detach from active dashboards/WIP
  → Retain in compliance search
  → Optional: cold storage export (S3/archive DB)
  → Enforce read-only on all layers
```

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| AR-P0-01 | Archive command + status transition | P0 |
| AR-P0-02 | Read-only enforcement (domain + UI) | P0 |
| AR-P0-03 | Multi-entity archive bundle (style pack) | P0 |
| AR-P1-01 | Document archive retention policy | P1 |
| AR-P2-01 | Cold storage tier | P2 |

---

## Sonuç

Archive **spec'te var, product'ta yok** — style close'un son adımı implemente edilemez.
