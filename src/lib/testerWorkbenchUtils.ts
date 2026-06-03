import type {
  ActivityItem,
  AssignedTest,
  EquipmentItem,
  PriorityLevel,
  TestDetailEnrichment,
  TestStatus,
  WorkbenchMetrics,
  WorkflowStep,
} from '@/types/testerWorkbench';

export const LAB_EQUIPMENT: Omit<EquipmentItem, 'status' | 'runningTestName'>[] = [
  { id: 'bond-strength', name: 'Bond Strength Tester', testIds: ['SATRA-TM-281'] },
  { id: 'flexing', name: 'Flexing Machine', testIds: ['SATRA-TM-92', 'SATRA-TM-161'] },
  { id: 'abrasion', name: 'Abrasion Tester', testIds: ['SATRA-TM-174', 'SATRA-TM-31'] },
  { id: 'tensile', name: 'Tensile Tester', testIds: [] },
  { id: 'water', name: 'Water Resistance Unit', testIds: [] },
];

export function getCurrentShift(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Morning Shift (06:00–14:00)';
  if (hour >= 14 && hour < 22) return 'Afternoon Shift (14:00–22:00)';
  return 'Night Shift (22:00–06:00)';
}

export function getLabStatus(tests: AssignedTest[]): { label: string; tone: 'green' | 'black' | 'neutral' } {
  const overdue = tests.filter((t) => isOverdue(t)).length;
  const running = tests.filter((t) => t.status === 'in_progress').length;
  if (overdue > 0) return { label: 'Attention Required', tone: 'black' };
  if (running > 0) return { label: 'Active Testing', tone: 'green' };
  return { label: 'Standby', tone: 'neutral' };
}

export function periodicDueDate(test: AssignedTest): string | null {
  return test.periodic_run_due_date || test.periodic_schedule_next_due || test.test_deadline;
}

export function effectiveDueDate(test: AssignedTest): string | null {
  return periodicDueDate(test) || test.test_deadline;
}

/** Parse API date strings as local calendar dates (avoids UTC day-shift on YYYY-MM-DD). */
export function parseScheduleDate(dateStr: string): Date {
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (isoDate) {
    return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  }
  return new Date(dateStr);
}

export function toLocalDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseScheduleDate(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date used to place a test on the schedule calendar (deadline, else assignment date). */
export function scheduleDateForTest(test: AssignedTest): string | null {
  if (test.status === 'submitted') return null;
  return effectiveDueDate(test) || test.assigned_at || null;
}

export function buildMonthCalendarCells(month: Date): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = new Date(year, monthIndex, 1).getDay();
  const cells: Date[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(new Date(year, monthIndex, 1 - (startOffset - i)));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    cells.push(new Date(year, monthIndex + 1, i));
  }
  return cells;
}

export function isFutureScheduleDate(dateStr: string): boolean {
  const d = parseScheduleDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}

export function isOverdue(test: AssignedTest): boolean {
  if (test.status === 'submitted') return false;
  const due = effectiveDueDate(test);
  if (!due) return false;
  return new Date(due) < new Date();
}

export function isDueToday(test: AssignedTest): boolean {
  if (test.status === 'submitted') return false;
  const due = effectiveDueDate(test);
  if (!due) return false;
  const dueDate = new Date(due);
  const today = new Date();
  return (
    dueDate.getFullYear() === today.getFullYear() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getDate() === today.getDate()
  );
}

export function derivePriority(test: AssignedTest): PriorityLevel {
  if (isOverdue(test)) return 'critical';
  const due = effectiveDueDate(test);
  if (!due) return 'normal';
  const diffDays = Math.ceil((new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'high';
  if (diffDays <= 3) return 'normal';
  return 'low';
}

export function priorityLabel(priority: PriorityLevel): string {
  switch (priority) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'normal':
      return 'Normal';
    case 'low':
      return 'Low';
  }
}

export function priorityClass(priority: PriorityLevel): string {
  switch (priority) {
    case 'critical':
      return 'bg-black text-white border-black';
    case 'high':
      return 'bg-green-700 text-white border-green-800';
    case 'normal':
      return 'bg-green-100 text-green-900 border-green-300';
    case 'low':
      return 'bg-white text-black/60 border-black/15';
  }
}

export function statusProgress(status: TestStatus): number {
  switch (status) {
    case 'pending':
    case 'assigned':
      return 20;
    case 'in_progress':
      return 60;
    case 'submitted':
      return 100;
    default:
      return 0;
  }
}

export function kanbanColumn(test: AssignedTest): 'pending' | 'in_progress' | 'review' | 'submitted' {
  if (test.status === 'submitted') return 'submitted';
  if (test.status === 'in_progress') {
    if (test.report_url || test.report_generated_at) return 'review';
    return 'in_progress';
  }
  return 'pending';
}

export function isPendingStatus(status: TestStatus): boolean {
  return status === 'pending' || status === 'assigned';
}

export function computeMetrics(tests: AssignedTest[]): WorkbenchMetrics {
  const active = tests.filter((t) => t.status !== 'submitted');
  const pending = tests.filter((t) => isPendingStatus(t.status)).length;
  const inProgress = tests.filter((t) => t.status === 'in_progress').length;
  return {
    assigned: tests.length,
    pending,
    inProgress,
    waitingResults: inProgress,
    submitted: tests.filter((t) => t.status === 'submitted').length,
    overdue: active.filter(isOverdue).length,
    dueToday: active.filter(isDueToday).length,
    running: inProgress,
    pendingSubmission: inProgress,
  };
}

export function buildActivityFeed(
  tests: AssignedTest[],
  enrichments: Record<string, TestDetailEnrichment>
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const test of tests) {
    const detail = enrichments[test.id];
    if (test.status === 'in_progress') {
      items.push({
        id: `start-${test.id}`,
        message: `Testing in progress: ${test.test_name} (${test.article_number})`,
        timestamp: test.assigned_at,
        type: 'started',
      });
    }
    if (test.status === 'submitted' && detail?.submitted_at) {
      items.push({
        id: `submit-${test.id}`,
        message: `Submitted ${test.test_name} report${detail.result ? ` — ${detail.result}` : ''}`,
        timestamp: detail.submitted_at,
        type: 'submitted',
      });
    }
    if (detail?.result_data && typeof detail.result_data === 'object') {
      const photos = (detail.result_data as { photos?: unknown[] }).photos;
      if (Array.isArray(photos) && photos.length > 0) {
        items.push({
          id: `photo-${test.id}`,
          message: `Added sample photos for ${test.test_name}`,
          timestamp: detail.submitted_at || test.assigned_at,
          type: 'photo',
        });
      }
    }
    if (test.report_generated_at) {
      items.push({
        id: `report-${test.id}`,
        message: `Generated report for ${test.test_name}`,
        timestamp: test.report_generated_at,
        type: 'report',
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);
}

export function buildEquipmentStatus(tests: AssignedTest[]): EquipmentItem[] {
  const runningTests = tests.filter((t) => t.status === 'in_progress');
  return LAB_EQUIPMENT.map((eq) => {
    const match = runningTests.find((t) => eq.testIds.includes(t.inhouse_test_id));
    if (match) {
      return { ...eq, status: 'running' as const, runningTestName: match.test_name };
    }
    return { ...eq, status: 'available' as const };
  });
}

export function buildWorkflowSteps(test: AssignedTest, hasDraft: boolean): WorkflowStep[] {
  const steps = [
    { key: 'assigned', label: 'Assigned' },
    { key: 'sample_ready', label: 'Sample Ready' },
    { key: 'testing', label: 'Testing' },
    { key: 'review', label: 'Review' },
    { key: 'submitted', label: 'Submitted' },
  ];

  let activeIndex = 0;
  if (test.status === 'pending') activeIndex = 0;
  else if (test.status === 'assigned') activeIndex = 1;
  else if (test.status === 'in_progress') activeIndex = 2;
  else if (test.status === 'submitted' && test.report_url) activeIndex = 3;
  else if (test.status === 'submitted') activeIndex = 4;

  return steps.map((step, i) => ({
    ...step,
    completed: i < activeIndex || test.status === 'submitted',
    active: i === activeIndex && test.status !== 'submitted',
  }));
}

export function selectDefaultActiveTest(tests: AssignedTest[]): AssignedTest | null {
  const active = tests.filter((t) => t.status !== 'submitted');
  if (active.length === 0) return null;

  const inProgress = active.find((t) => t.status === 'in_progress');
  if (inProgress) return inProgress;

  const overdue = active.filter(isOverdue).sort((a, b) => {
    const da = effectiveDueDate(a);
    const db = effectiveDueDate(b);
    if (!da || !db) return 0;
    return new Date(da).getTime() - new Date(db).getTime();
  });
  if (overdue.length > 0) return overdue[0];

  const sorted = [...active].sort((a, b) => {
    const da = effectiveDueDate(a);
    const db = effectiveDueDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(da).getTime() - new Date(db).getTime();
  });
  return sorted[0];
}

export function formatDueTime(dateStr: string | null): string {
  if (!dateStr) return 'No deadline';
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCountdown(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) {
    const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    return `${hours}h overdue`;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${mins}m left`;
}

export function shortSampleId(test: AssignedTest): string {
  return test.article_number || test.id.slice(0, 8).toUpperCase();
}

export function getPriorityQueue(tests: AssignedTest[]): AssignedTest[] {
  return tests
    .filter((t) => t.status !== 'submitted')
    .sort((a, b) => {
      const pa = derivePriority(a);
      const pb = derivePriority(b);
      const order: Record<PriorityLevel, number> = { critical: 0, high: 1, normal: 2, low: 3 };
      if (order[pa] !== order[pb]) return order[pa] - order[pb];
      const da = effectiveDueDate(a);
      const db = effectiveDueDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return new Date(da).getTime() - new Date(db).getTime();
    })
    .slice(0, 8);
}

export function draftStorageKey(testId: string): string {
  return `tester-workbench-draft-${testId}`;
}
