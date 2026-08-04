/**
 * Seeded what-if scenario definitions (deterministic catalog).
 */
import type { ScenarioDefinition } from './types'

export const SCENARIO_CATALOG: ScenarioDefinition[] = [
  {
    slot: 'CURRENT',
    code: 'BASELINE',
    name: 'Current baseline',
    question: 'What happens if we keep the preferred plan with no shocks?',
    shocks: [],
  },
  {
    slot: 'A',
    code: 'MACHINE_STOP_6H',
    name: 'Machine downtime 6h',
    question: 'What if machine AUTO_CUTTER stops for 6 hours?',
    shocks: [
      { type: 'MACHINE_DOWNTIME', target: 'AUTO_CUTTER', magnitude: 6, unit: 'hours' },
    ],
  },
  {
    slot: 'B',
    code: 'SUPPLIER_DELAY_3D',
    name: 'Supplier fabric delay 3d',
    question: 'What if supplier fabric delivery slips by 3 days?',
    shocks: [
      { type: 'SUPPLIER_DELAY', target: 'fabric-primary', magnitude: 3, unit: 'days' },
    ],
  },
  {
    slot: 'C',
    code: 'URGENT_OVERTIME_YIELD',
    name: 'Urgent order + overtime + yield drop',
    question: 'What if Order A becomes urgent, overtime is enabled, and cutting yield drops 2%?',
    shocks: [
      { type: 'ORDER_URGENT', target: 'Order-A', magnitude: 1, unit: 'flag' },
      { type: 'OVERTIME_ENABLED', target: 'plant', magnitude: 1, unit: 'flag' },
      { type: 'OPERATOR_AVAILABILITY', target: 'sewing', magnitude: -0.1, unit: 'ratio' },
      { type: 'CUTTING_YIELD_DROP', target: 'cutting', magnitude: 2, unit: 'percent' },
    ],
  },
]
