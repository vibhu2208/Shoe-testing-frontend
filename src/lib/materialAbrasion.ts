/** SATRA-TM-31 Material Abrasion cycle checkpoints (Martindale). */
export const MATERIAL_ABRASION_CYCLE_STAGES = [1600, 3200, 6400, 12800, 25600] as const;

export type MaterialAbrasionStage = {
  required: boolean;
  status: 'OK' | 'FAIL';
  damage_type: string;
  remarks: string;
};

export function createEmptyMaterialAbrasionStages(): {
  dry_stages: Record<number, MaterialAbrasionStage>;
  wet_stages: Record<number, MaterialAbrasionStage>;
} {
  const dry_stages: Record<number, MaterialAbrasionStage> = {};
  const wet_stages: Record<number, MaterialAbrasionStage> = {};
  for (const stage of MATERIAL_ABRASION_CYCLE_STAGES) {
    const empty: MaterialAbrasionStage = {
      required: false,
      status: 'OK',
      damage_type: '',
      remarks: ''
    };
    dry_stages[stage] = { ...empty };
    wet_stages[stage] = { ...empty };
  }
  return { dry_stages, wet_stages };
}

export const SATRA_TM_31_FALLBACK = {
  input_parameters: {
    dry_stages: {
      type: 'object',
      default: null,
      notes: 'Per-cycle dry abrasion checkpoints (1600–25600 cycles). Mark stages required per client spec.'
    },
    wet_stages: {
      type: 'object',
      default: null,
      notes: 'Per-cycle wet abrasion checkpoints. Mark stages required per client spec.'
    }
  },
  calculation_steps: [
    {
      step: 1,
      formula: 'required_dry_stages → all status OK',
      description: 'Evaluate each client-required dry cycle stage.'
    },
    {
      step: 2,
      formula: 'required_wet_stages → all status OK',
      description: 'Evaluate each client-required wet cycle stage.'
    },
    {
      step: 3,
      formula: 'PASS if dry_passes AND wet_passes',
      description: 'Overall pass only when all required stages pass.'
    }
  ],
  pass_fail_logic: {
    pass_condition: 'All client-required dry and wet cycle stages show status OK.',
    fail_condition: 'Any required stage shows FAIL, or no required stages are selected.',
    notes: 'Required cycle counts are set per order/client specification.'
  }
};
