import { Test } from '@/types/test';
import { SATRA_TM_31_FALLBACK } from '@/lib/materialAbrasion';

type ParamDef = { type: string; default?: number | boolean | string | null; notes?: string };
type TestMetadata = {
  input_parameters: Record<string, ParamDef>;
  calculation_steps: Array<{ step: number; formula: string; description: string }>;
  pass_fail_logic: {
    pass_condition: string;
    fail_condition: string;
    notes?: string;
  };
};

const param = (type: ParamDef['type'], defaultValue: ParamDef['default'], notes: string): ParamDef => ({
  type,
  default: defaultValue,
  notes
});

/** Mirrors backend/data/testLibraryMetadata.js — used when API/DB fields are empty. */
export const TEST_LIBRARY_METADATA: Record<string, TestMetadata> = {
  'SATRA-TM-174': {
    input_parameters: {
      reference_rubber_run_1: param('number', 0, 'Reference rubber mass loss — run 1 (g)'),
      reference_rubber_run_2: param('number', 0, 'Reference rubber mass loss — run 2 (g)'),
      reference_rubber_run_3: param('number', 0, 'Reference rubber mass loss — run 3 (g)'),
      sample_initial_weight: param('number', 0, 'Sample mass before abrasion (g)'),
      sample_final_weight: param('number', 0, 'Sample mass after abrasion (g)'),
      density: param('number', 1.3, 'Rubber density (g/cm³)'),
      client_spec_max_volume: param('number', 200, 'Client maximum corrected volume (mm³)')
    },
    calculation_steps: [
      { step: 1, formula: 'reference_rubber_avg = AVG(run_1, run_2, run_3)', description: 'Average reference rubber mass loss.' },
      { step: 2, formula: 'weight_loss = sample_initial_weight − sample_final_weight', description: 'Sample mass loss.' },
      { step: 3, formula: 'volume_loss = (400 × reference_rubber_avg) / weight_loss', description: 'Uncorrected abrasion volume.' },
      { step: 4, formula: 'corrected_volume = volume_loss / density', description: 'Density-corrected result.' },
      { step: 5, formula: 'PASS if corrected_volume ≤ client_spec_max_volume', description: 'Compare to client spec.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Corrected volume ≤ client maximum volume.',
      fail_condition: 'Corrected volume exceeds client maximum or inputs invalid.',
      notes: 'Client spec set per order.'
    }
  },
  'SATRA-TM-92': {
    input_parameters: {
      required_cycles: param('number', 30000, 'Required flexing cycles'),
      actual_cycles_completed: param('number', 0, 'Cycles completed'),
      crack_observed: param('boolean', false, 'Crack observed')
    },
    calculation_steps: [
      { step: 1, formula: 'cycles_met = actual ≥ required', description: 'Verify cycle count.' },
      { step: 2, formula: 'PASS if cycles_met AND NOT crack_observed', description: 'Final result.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Required cycles completed, no crack.',
      fail_condition: 'Insufficient cycles or crack observed.'
    }
  },
  'SATRA-TM-161': {
    input_parameters: {
      required_cycles: param('number', 30000, 'Required flexing cycles'),
      actual_cycles_completed: param('number', 0, 'Cycles completed'),
      upper_crack: param('boolean', false, 'Upper crack'),
      sole_crack: param('boolean', false, 'Sole crack'),
      sole_separation: param('boolean', false, 'Sole separation'),
      stitch_failure: param('boolean', false, 'Stitch failure')
    },
    calculation_steps: [
      { step: 1, formula: 'cycles_met = actual ≥ required', description: 'Verify cycles.' },
      { step: 2, formula: 'failure_detected = any failure flag', description: 'Visual inspection.' },
      { step: 3, formula: 'PASS if cycles_met AND NOT failure_detected', description: 'Final result.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Required cycles with no structural failures.',
      fail_condition: 'Insufficient cycles or any failure flag.'
    }
  },
  'SATRA-TM-281': {
    input_parameters: {
      client_spec_min_bond_strength: param('number', 2.5, 'Minimum bond strength (N/mm)'),
      point_data: param('object', null, '16 points: force (N) and width (mm)')
    },
    calculation_steps: [
      { step: 1, formula: 'bond_strength = force / width', description: 'Per-point calculation.' },
      { step: 2, formula: 'PASS if all points ≥ client minimum', description: 'All 16 points must pass.' }
    ],
    pass_fail_logic: {
      pass_condition: 'All 16 points meet client minimum bond strength.',
      fail_condition: 'Any point below minimum.'
    }
  },
  'PH-001': {
    input_parameters: {
      beaker_1_ph: param('number', 0, 'pH beaker 1'),
      beaker_2_ph: param('number', 0, 'pH beaker 2'),
      client_spec_min_avg_ph: param('number', 6, 'Minimum average pH'),
      client_spec_max_difference: param('number', 0.5, 'Max beaker difference')
    },
    calculation_steps: [
      { step: 1, formula: 'average_pH = (b1 + b2) / 2', description: 'Average pH.' },
      { step: 2, formula: 'difference = |b1 − b2|', description: 'Beaker difference.' },
      { step: 3, formula: 'PASS if avg ≥ min AND diff ≤ max', description: 'Both limits required.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Average and difference within client limits.',
      fail_condition: 'Average too low or difference too high.'
    }
  },
  'ISO-19574': {
    input_parameters: {
      required_duration: param('number', 24, 'Required hours'),
      actual_duration: param('number', 0, 'Actual hours'),
      fungus_growth_observed: param('boolean', false, 'Fungus growth')
    },
    calculation_steps: [
      { step: 1, formula: 'duration_met = actual ≥ required', description: 'Duration check.' },
      { step: 2, formula: 'PASS if duration_met AND NOT fungus', description: 'Final result.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Duration met, no fungus growth.',
      fail_condition: 'Short duration or fungus observed.'
    }
  },
  'FZ-001': {
    input_parameters: {
      required_duration: param('number', 24, 'Required freezing hours'),
      actual_duration: param('number', 0, 'Actual hours'),
      cracking_observed: param('boolean', false, 'Cracking'),
      hardening_observed: param('boolean', false, 'Hardening'),
      material_failure_observed: param('boolean', false, 'Material failure'),
      flexibility_loss_observed: param('boolean', false, 'Flexibility loss')
    },
    calculation_steps: [
      { step: 1, formula: 'duration_met = actual ≥ required', description: 'Duration check.' },
      { step: 2, formula: 'PASS if duration_met AND no failures', description: 'Final result.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Duration met with no freezing failures.',
      fail_condition: 'Short duration or failure observed.'
    }
  },
  'HAO-001': {
    input_parameters: {
      required_duration: param('number', 24, 'Required oven hours'),
      actual_duration: param('number', 0, 'Actual hours'),
      deformation_observed: param('boolean', false, 'Deformation'),
      shrinkage_observed: param('boolean', false, 'Shrinkage'),
      adhesive_failure_observed: param('boolean', false, 'Adhesive failure'),
      color_change_observed: param('boolean', false, 'Color change')
    },
    calculation_steps: [
      { step: 1, formula: 'duration_met = actual ≥ required', description: 'Duration check.' },
      { step: 2, formula: 'PASS if duration_met AND no failures', description: 'Final result.' }
    ],
    pass_fail_logic: {
      pass_condition: 'Duration met with no heat failures.',
      fail_condition: 'Short duration or failure observed.'
    }
  },
  'SATRA-TM-31': SATRA_TM_31_FALLBACK as TestMetadata
};

function isEmptyObject(value: unknown): boolean {
  return value == null || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
}

function isEmptyArray(value: unknown): boolean {
  return value == null || (Array.isArray(value) && value.length === 0);
}

export function enrichTestForDisplay(test: Test): Test {
  const defaults = TEST_LIBRARY_METADATA[test.id];
  if (!defaults) return test;

  return {
    ...test,
    input_parameters: isEmptyObject(test.input_parameters) ? defaults.input_parameters : test.input_parameters,
    calculation_steps: isEmptyArray(test.calculation_steps) ? defaults.calculation_steps : test.calculation_steps,
    pass_fail_logic: isEmptyObject(test.pass_fail_logic) ? defaults.pass_fail_logic : test.pass_fail_logic
  };
}

/** Input parameter defs for TestCalculator (type + default). */
export function getCalculatorInputParameters(
  test: Test
): Record<string, { type: 'number' | 'boolean' | 'text'; default?: number | boolean | string }> {
  const enriched = enrichTestForDisplay(test);
  const params = enriched.input_parameters || {};
  const result: Record<string, { type: 'number' | 'boolean' | 'text'; default?: number | boolean | string }> = {};

  for (const [key, def] of Object.entries(params)) {
    if (!def || typeof def !== 'object') continue;
    const t = def.type === 'boolean' ? 'boolean' : def.type === 'text' ? 'text' : 'number';
    result[key] = { type: t, default: def.default ?? (t === 'boolean' ? false : 0) };
  }
  return result;
}
