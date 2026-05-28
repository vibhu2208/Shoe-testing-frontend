export interface TesterLike {
  id: string | number;
  name: string;
  email?: string;
}

export const DEFAULT_TESTER_NAME =
  (process.env.NEXT_PUBLIC_DEFAULT_TESTER_NAME || 'Alok').trim();
export const DEFAULT_TESTER_EMAIL =
  (process.env.NEXT_PUBLIC_DEFAULT_TESTER_EMAIL || 'Testing@virola.com').trim();

/** Resolve Alok (or env-configured default) from a testers list. */
export function findDefaultTester(testers: TesterLike[]): TesterLike | undefined {
  if (!testers.length) return undefined;

  const nameNeedle = DEFAULT_TESTER_NAME.toLowerCase();
  const byName = testers.find((t) => t.name?.toLowerCase().includes(nameNeedle));
  if (byName) return byName;

  const emailNeedle = DEFAULT_TESTER_EMAIL.toLowerCase();
  return testers.find((t) => t.email?.toLowerCase() === emailNeedle);
}

export type ExecutionType = 'inhouse' | 'outsource' | 'both';

export const isInhouseExecution = (type: ExecutionType | string | undefined) =>
  type === 'inhouse' || type === 'both';

/**
 * Auto-assign default tester when switching to in-house or picking an in-house test.
 * Skips if a tester is already set or the update explicitly sets assigned_tester_id.
 */
export function withDefaultTesterAssignment<T extends { assigned_tester_id?: string | number | null }>(
  current: T,
  updates: Partial<T>,
  defaultTesterId: string | number | null,
  fields: { execution_type?: string; inhouse_test_id?: string | null }
): Partial<T> {
  if (!defaultTesterId) return updates;
  if ('assigned_tester_id' in updates) return updates;

  const executionType = (updates.execution_type ?? fields.execution_type) as ExecutionType | undefined;
  if (!isInhouseExecution(executionType)) return updates;

  const hasTester =
    current.assigned_tester_id != null && current.assigned_tester_id !== '';
  if (hasTester) return updates;

  const switchingToInhouse = updates.execution_type != null && isInhouseExecution(updates.execution_type);
  const selectingInhouseTest =
    'inhouse_test_id' in updates &&
    updates.inhouse_test_id != null &&
    updates.inhouse_test_id !== '';

  if (switchingToInhouse || selectingInhouseTest) {
    return { ...updates, assigned_tester_id: defaultTesterId as T['assigned_tester_id'] };
  }

  return updates;
}

/** Tester id to send when creating an article (standalone or client-linked). */
export function resolveTesterIdForPayload(
  test: { execution_type: string; assigned_tester_id?: string | number | null },
  defaultTesterId: string | number | null
): string | number | null | undefined {
  const hasAssigned =
    test.assigned_tester_id != null && test.assigned_tester_id !== '';
  if (hasAssigned) return test.assigned_tester_id as string | number;
  if (isInhouseExecution(test.execution_type) && defaultTesterId != null) {
    return defaultTesterId;
  }
  if (!isInhouseExecution(test.execution_type)) return null;
  return undefined;
}
