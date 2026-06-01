/** The 9 in-house laboratory tests in the test library. */
export const LAB_TESTS = [
  { id: 'SATRA-TM-174', name: 'Sole Abrasion Test', standard: 'SATRA TM 174' },
  { id: 'SATRA-TM-92', name: 'Sole Flexing Test', standard: 'SATRA TM 92' },
  { id: 'SATRA-TM-161', name: 'Whole Shoe Flexing Test', standard: 'SATRA TM 161' },
  { id: 'SATRA-TM-281', name: 'Bond Strength Test', standard: 'SATRA TM 281' },
  { id: 'SATRA-TM-31', name: 'Material Abrasion Test', standard: 'SATRA TM 31' },
  { id: 'PH-001', name: 'pH Value Test', standard: 'PH-001' },
  { id: 'ISO-19574', name: 'Antifungal Test', standard: 'ISO 19574' },
  { id: 'FZ-001', name: 'Freezing Test', standard: 'FZ-001' },
  { id: 'HAO-001', name: 'Heat Ageing Oven Test', standard: 'HAO-001' },
] as const;

export type LabTestId = (typeof LAB_TESTS)[number]['id'];
