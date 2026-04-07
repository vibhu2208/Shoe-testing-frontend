/**
 * Best-effort extraction of numeric client spec fields from free-text client_requirement
 * (from spec sheet extraction). Values are hints; testers can still edit fields in the form.
 */

const firstFloat = (text: string): number | undefined => {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : undefined;
};

const allFloats = (text: string): number[] =>
  [...text.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => parseFloat(m[1]));

export function parseClientSpecsFromRequirement(
  libraryTestId: string,
  requirement: string
): { input: Record<string, number | boolean>; specs: Record<string, number> } {
  const t = (requirement || '').trim();
  const lower = t.toLowerCase();
  const input: Record<string, number | boolean> = {};
  const specs: Record<string, number> = {};

  switch (libraryTestId) {
    case 'SATRA-TM-174': {
      const vol = t.match(/(?:max|≤|<|under)\s*(\d+(?:\.\d+)?)\s*(?:mm³|mm3|cu\.?\s*mm)/i);
      if (vol) specs.client_spec_max_volume = parseFloat(vol[1]);
      else {
        const nums = allFloats(t);
        if (nums.length) specs.client_spec_max_volume = nums[0];
      }
      break;
    }
    case 'SATRA-TM-92':
    case 'SATRA-TM-161': {
      const cyc = t.match(/(\d+(?:,\d+)?)\s*(?:cycles|flex)/i);
      if (cyc) input.required_cycles = parseInt(cyc[1].replace(/,/g, ''), 10);
      else {
        const n = firstFloat(t);
        if (n !== undefined) input.required_cycles = Math.round(n);
      }
      break;
    }
    case 'SATRA-TM-281': {
      const bond = t.match(/(?:min|≥|>)\s*(\d+(?:\.\d+)?)\s*(?:n\/mm|n\s*\/\s*mm)/i);
      if (bond) input.client_spec_min_bond_strength = parseFloat(bond[1]);
      else {
        const nums = allFloats(t);
        if (nums.length) input.client_spec_min_bond_strength = nums[0];
      }
      break;
    }
    case 'PH-001': {
      const range = t.match(/p?h?\s*(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)/i);
      if (range) {
        const a = parseFloat(range[1]);
        const b = parseFloat(range[2]);
        input.client_spec_min_avg_ph = Math.min(a, b);
      } else {
        const nums = allFloats(t);
        if (nums.length >= 1) input.client_spec_min_avg_ph = nums[0];
        if (nums.length >= 2) input.client_spec_max_difference = nums[1];
      }
      if (input.client_spec_max_difference === undefined) {
        const diff = t.match(/(?:diff|difference|delta)\s*(?:≤|<)?\s*(\d+(?:\.\d+)?)/i);
        if (diff) input.client_spec_max_difference = parseFloat(diff[1]);
        else if (input.client_spec_max_difference === undefined) input.client_spec_max_difference = 0.5;
      }
      break;
    }
    case 'ISO-19574': {
      const dur = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hours?|days?)/i);
      if (dur) input.required_duration = parseFloat(dur[1]);
      break;
    }
    case 'FZ-001':
    case 'HAO-001': {
      const dur = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hours?|min|cycles?)/i);
      if (dur) input.required_duration = parseFloat(dur[1]);
      break;
    }
    default:
      break;
  }

  return { input, specs };
}

export function resolveLibraryTestId(inhouseTestId: string | null | undefined, testStandard: string): string | null {
  if (inhouseTestId && String(inhouseTestId).trim()) {
    return String(inhouseTestId).trim();
  }
  const std = testStandard || '';
  const m = std.match(/(SATRA-TM-\d+|PH-001|ISO-19574|FZ-001|HAO-001)/i);
  if (!m) return null;
  const id = m[1];
  if (id.toUpperCase().startsWith('SATRA-TM-')) return id.toUpperCase();
  return id.toUpperCase();
}
