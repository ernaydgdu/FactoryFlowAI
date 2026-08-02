# Kepler Brain Architecture Bible

## Volume 1 — Chapter 1

### Enterprise Decision Platform

> **Status:** Locked — v1 (domain-only, no LLM)  
> **Authority:** Constitutional extension of [`FOUNDATION.md`](FOUNDATION.md)  
> **Path:** `docs/architecture/KEPLER-BRAIN-FOUNDATION.md`  
> **Code:** `frontend/src/domain/brain/`

---

## Kepler Brain Nedir?

Kepler Brain bir chatbot değildir. Bir arama motoru değildir. Bir metin üreticisi değildir.

**Kepler Brain = Enterprise Decision Platform**

Görevi: ERP içindeki verileri analiz etmek, ilişkilendirmek, yorumlamak, risk hesaplamak, simülasyon yapmak ve karar desteği vermektir.

---

## Anayasal Sınırlar

| Yasak | Açıklama |
|---|---|
| Business Rule Engine yerine geçmez | Kuralları okur, çalıştırmaz |
| Planning Engine yerine geçmez | Planlama çıktısını okur, plan oluşturmaz |
| Stock Ledger işlem yapmaz | Yalnızca read-only snapshot |
| Database mutation yok | Hiçbir katman yazma yapmaz |
| External fetch yok | İnternet, LLM, 3rd party ERP yok |
| Cross-tenant yok | Şirket dışı veri/öğrenme yok |
| Otomatik karar yok | Son karar her zaman `USER` |

---

## Mimari Katmanlar

```
Brain Kernel          ← pipeline orchestrator
    ↓
Knowledge Layer     ← ERP kaynaklarından read-only snapshot
    ↓
Memory Layer          ← oturum + platform AI memory
    ↓
Reasoning Layer       ← deterministik analiz (LLM yok)
    ↓
Decision Layer        ← karar çerçevesi (DecisionFrame)
    ↓
Recommendation Layer← öneri + confidence + evidence
    ↓
Simulation Layer      ← what-if projeksiyon (sideEffects: NONE)
    ↓
Security Layer        ← tenant, operasyon, read-only doğrulama
    ↓
Configuration Layer ← şirket Brain ayarları
```

Her katman bağımsız servis. Katmanlar birbirinin iç yapısını bilmez — yalnızca kontrat üzerinden iletişim kurar.

---

## Bilgi Kaynakları (Allowlist)

Yalnızca şu ERP kaynaklarından veri alınır:

| Source ID | Adapter | Mode |
|---|---|---|
| `BUSINESS_RULE_ENGINE` | `business-rule-adapter` | READ_ONLY |
| `PLANNING_ENGINE` | `planning-engine-adapter` | READ_ONLY |
| `MASTER_DATA` | `master-data-adapter` | READ_ONLY |
| `STOCK_LEDGER` | `stock-ledger-adapter` | READ_ONLY |
| `TIMELINE` | `timeline-adapter` | READ_ONLY |
| `APPROVAL` | `approval-adapter` | READ_ONLY |
| `AUDIT` | `audit-adapter` | READ_ONLY |
| `VERSIONING` | `versioning-adapter` | READ_ONLY |
| `KPI_ENGINE` | `kpi-adapter` | READ_ONLY |
| `WORKFLOW` | `workflow-adapter` | READ_ONLY |
| `LOCALIZATION` | `localization-adapter` | READ_ONLY |
| `EVENT_BUS` | `event-bus-adapter` | READ_ONLY |
| `CONFIGURATION` | `configuration-adapter` | READ_ONLY |

Adapter'lar ERP servislerine erişen **tek entegrasyon noktasıdır**. Brain katmanları doğrudan ERP servislerini çağırmaz.

---

## Servis Kontratları

```typescript
BrainKnowledgeSourceAdapter  // fetch(), isAvailable(), mode: READ_ONLY
KnowledgeLayerContract       // assembleSnapshot()
MemoryLayerContract          // getOrCreateSession(), recordEntry()
ReasoningLayerContract       // analyze()
DecisionLayerContract        // buildFrames()
RecommendationLayerContract  // generate()
SimulationLayerContract      // runScenario(), createScenario()
SecurityLayerContract        // authorize(), assertReadOnly()
ConfigurationLayerContract   // getCompanyConfiguration()
BrainKernelContract          // analyze(), recommend(), simulate()
```

---

## Pipeline Akışı

### ANALYZE
`SECURITY → CONFIGURATION → KNOWLEDGE → MEMORY → REASONING → DECISION`

### RECOMMEND
`SECURITY → CONFIGURATION → KNOWLEDGE → MEMORY → REASONING → DECISION → RECOMMENDATION`

### SIMULATE
`SECURITY → CONFIGURATION → KNOWLEDGE → MEMORY → REASONING → SIMULATION`

---

## Karar Modeli

```typescript
DecisionFrame {
  question: string
  options: DecisionOption[]
  finalDecisionOwner: 'USER'  // her zaman
}

BrainRecommendation {
  confidence: number          // kural tabanlı, LLM değil
  evidence: BrainEvidence[]   // kaynak referanslı
  finalDecisionBy: 'USER'     // her zaman
  disclaimers: string[]
}
```

---

## Offline First

Brain, ERP erişilebilir olduğu sürece internet bağlantısı olmadan çalışır. Tüm bilgi kaynakları lokal domain servislerinden okunur.

---

## Gelecek Fazlar (henüz yapılmadı)

- LLM entegrasyonu (Reasoning Layer genişlemesi)
- UI Decision Console
- API endpoint'leri
- Gerçek tenant-scoped persistence

---

## İlgili Dokümanlar

- [`KEPLER-BRAIN-CHAPTER-2.md`](KEPLER-BRAIN-CHAPTER-2.md) — Knowledge & Reasoning Engine
- [`FOUNDATION.md`](FOUNDATION.md) — Kepler ERP Anayasası
- [`KEPLER-ERP-FOUNDATION-PRINCIPLES.md`](../KEPLER-ERP-FOUNDATION-PRINCIPLES.md)
