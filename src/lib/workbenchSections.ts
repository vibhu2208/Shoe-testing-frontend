import {
  Bell,
  CalendarDays,
  ClipboardList,
  Columns3,
  FlaskConical,
  LayoutDashboard,
  Package,
  type LucideIcon,
} from 'lucide-react';
import type { WorkbenchSectionId } from '@/types/testerWorkbench';

export interface WorkbenchSectionConfig {
  id: WorkbenchSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const WORKBENCH_SECTIONS: WorkbenchSectionConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Daily workload and priority queue',
    icon: LayoutDashboard,
  },
  {
    id: 'all-tests',
    label: 'All Tests',
    description: 'Complete list of every assigned test',
    icon: ClipboardList,
  },
  {
    id: 'workbench',
    label: 'Active Test',
    description: 'Execute and track the current test',
    icon: FlaskConical,
  },
  {
    id: 'pipeline',
    label: 'Test Pipeline',
    description: 'Kanban view of all assigned tests',
    icon: Columns3,
  },
  {
    id: 'samples',
    label: 'Samples & Equipment',
    description: 'Sample details and machine status',
    icon: Package,
  },
  {
    id: 'schedule',
    label: 'Schedule & Activity',
    description: 'Calendar, deadlines, and recent actions',
    icon: CalendarDays,
  },
  {
    id: 'assistant',
    label: 'Lab Assistant',
    description: 'Alerts, deadlines, and reminders',
    icon: Bell,
  },
];

export function isWorkbenchSectionId(value: string | null): value is WorkbenchSectionId {
  return WORKBENCH_SECTIONS.some((s) => s.id === value);
}

export type TestsStatusFilter = 'all' | 'pending' | 'in_progress' | 'submitted' | 'overdue';

const TEST_STATUS_FILTERS: TestsStatusFilter[] = [
  'all',
  'pending',
  'in_progress',
  'submitted',
  'overdue',
];

export function isTestsStatusFilter(value: string | null): value is TestsStatusFilter {
  return value !== null && TEST_STATUS_FILTERS.includes(value as TestsStatusFilter);
}
