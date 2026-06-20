export type WorkbenchSectionId =
  | 'overview'
  | 'all-tests'
  | 'workbench'
  | 'pipeline'
  | 'samples'
  | 'schedule'
  | 'assistant';

export type TestStatus = 'pending' | 'assigned' | 'in_progress' | 'submitted';

export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low';

export type KanbanColumn = 'pending' | 'in_progress' | 'review' | 'submitted';

export interface AssignedTest {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  execution_type: string;
  inhouse_test_id: string;
  status: TestStatus;
  test_deadline: string | null;
  assigned_at: string;
  admin_notes: string | null;
  article_name: string;
  article_number: string;
  material_type: string;
  color: string;
  description?: string | null;
  client_name?: string | null;
  client_code?: string | null;
  report_url?: string | null;
  report_number?: string | null;
  report_generated_at?: string | null;
  template_key?: string | null;
  template_name?: string | null;
  is_periodic?: boolean | null;
  periodic_schedule_id?: string | null;
  periodic_run_number?: number | null;
  periodic_frequency_type?: string | null;
  periodic_frequency_value?: number | null;
  periodic_total_occurrences?: number | null;
  periodic_schedule_next_due?: string | null;
  periodic_schedule_status?: string | null;
  periodic_run_due_date?: string | null;
}

export interface TestDetailEnrichment {
  result?: string | null;
  result_data?: Record<string, unknown> | null;
  submitted_at?: string | null;
}

export interface WorkbenchMetrics {
  assigned: number;
  pending: number;
  inProgress: number;
  waitingResults: number;
  submitted: number;
  overdue: number;
  dueToday: number;
  running: number;
  pendingSubmission: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type: 'started' | 'submitted' | 'updated' | 'photo' | 'report';
}

export interface EquipmentItem {
  id: string;
  name: string;
  status: 'available' | 'running' | 'maintenance' | 'calibration_due';
  runningTestName?: string;
  testIds: string[];
}

export interface WorkflowStep {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
}

export interface QuickResultDraft {
  observation1: string;
  observation2: string;
  reading1: string;
  reading2: string;
  remarks: string;
}
