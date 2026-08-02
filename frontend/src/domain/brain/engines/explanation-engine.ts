/**
 * Explanation Engine — Explainable AI bileşen puanları.
 */
import type { BrainFact } from '../types/knowledge-reasoning'
import type { ExplanationBreakdown, ExplanationComponent } from '../types/knowledge-reasoning'

export function buildTerminRiskExplanation(
  facts: BrainFact[],
  totalScore: number,
): ExplanationBreakdown {
  const components: ExplanationComponent[] = []

  const fabricFact = facts.find((f) => f.statement.includes('blocker') || f.statement.includes('kumaş'))
  if (fabricFact) {
    components.push({
      label: 'Kumaş',
      points: 25,
      sourceId: fabricFact.sourceId,
      fact: fabricFact.statement,
    })
  }

  const capacityFact = facts.find((f) => f.statement.includes('doluluk') || f.statement.includes('kapasite'))
  if (capacityFact) {
    components.push({
      label: 'Atölye Doluluk',
      points: 20,
      sourceId: capacityFact.sourceId,
      fact: capacityFact.statement,
    })
  }

  const washFact = facts.find((f) => f.statement.includes('yıkama'))
  if (washFact) {
    components.push({
      label: 'Yıkama',
      points: 15,
      sourceId: washFact.sourceId,
      fact: washFact.statement,
    })
  }

  const exfFact = facts.find((f) => f.statement.includes('EXF') || f.statement.includes('termin risk'))
  if (exfFact) {
    components.push({
      label: 'EXF Yakınlığı',
      points: 22,
      sourceId: exfFact.sourceId,
      fact: exfFact.statement,
    })
  }

  if (components.length === 0) {
    components.push({
      label: 'Genel Risk',
      points: totalScore,
      sourceId: 'PLANNING_ENGINE',
      fact: 'Planlama verisi baz alınarak hesaplandı',
    })
  }

  const computedTotal = components.reduce((s, c) => s + c.points, 0)
  const formula = components.map((c) => c.label).join(' + ') + ` = ${computedTotal}`

  return {
    title: 'Termin Riski',
    totalScore: computedTotal || totalScore,
    components,
    formula,
  }
}

export function buildGenericExplanation(
  title: string,
  facts: BrainFact[],
  totalScore: number,
): ExplanationBreakdown {
  const pointsEach = facts.length > 0 ? Math.round(totalScore / facts.length) : totalScore
  const components: ExplanationComponent[] = facts.slice(0, 5).map((f, i) => ({
    label: `Fact ${i + 1}`,
    points: pointsEach,
    sourceId: f.sourceId,
    fact: f.statement,
  }))

  return {
    title,
    totalScore,
    components,
    formula: components.map((c) => `${c.points}`).join(' + ') || String(totalScore),
  }
}
