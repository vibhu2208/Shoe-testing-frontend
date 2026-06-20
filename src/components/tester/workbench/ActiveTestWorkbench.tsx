'use client';

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Pause,
  Play,
} from 'lucide-react';
import type { AssignedTest, WorkflowStep } from '@/types/testerWorkbench';
import TesterReportActions from '@/components/tester/TesterReportActions';
import {
  derivePriority,
  effectiveDueDate,
  formatCountdown,
  priorityClass,
  priorityLabel,
  shortSampleId,
  statusProgress,
} from '@/lib/testerWorkbenchUtils';

interface ActiveTestWorkbenchProps {
  test: AssignedTest | null;
  testerName: string;
  workflowSteps: WorkflowStep[];
  isPaused: boolean;
  actionLoading: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onOpenTestDetail?: () => void;
  onReportGenerated?: () => void;
}

export default function ActiveTestWorkbench({
  test,
  testerName,
  workflowSteps,
  isPaused,
  actionLoading,
  onStart,
  onPause,
  onResume,
  onOpenTestDetail,
  onReportGenerated,
}: ActiveTestWorkbenchProps) {
  if (!test) {
    return (
      <section className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-center shadow-sm">
        <FileText className="mx-auto mb-3 h-10 w-10 text-black/20" aria-hidden />
        <h2 className="text-lg font-semibold text-black">Active Test Workbench</h2>
        <p className="mt-1 text-sm text-black/50">
          Select a test from the priority queue or kanban board to begin execution.
        </p>
      </section>
    );
  }

  const due = effectiveDueDate(test);
  const countdown = formatCountdown(due);
  const priority = derivePriority(test);
  const progress = statusProgress(test.status);

  return (
    <section className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-black/10 bg-green-50 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60">
            Active Test Workbench
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass(priority)}`}
            >
              {priorityLabel(priority)}
            </span>
            {countdown && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  countdown.includes('overdue')
                    ? 'bg-black text-white'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {countdown}
              </span>
            )}
            {isPaused && (
              <span className="rounded-full border border-black/20 bg-white px-2 py-0.5 text-xs font-semibold text-black">
                Paused
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/50">
            Test Information
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="col-span-2">
              <dt className="text-black/50">Test Name</dt>
              <dd className="font-medium text-black">{test.test_name}</dd>
            </div>
            <InfoRow label="Method Number" value={test.inhouse_test_id} />
            <InfoRow label="Standard" value={test.test_standard} />
            <InfoRow label="Sample ID" value={shortSampleId(test)} mono />
            <InfoRow label="Article Number" value={test.article_number} />
            <InfoRow label="Client" value={test.client_name || test.client_code || '—'} />
            <InfoRow label="Material" value={test.material_type || '—'} />
            <InfoRow label="Product Type" value={test.category || '—'} />
            <InfoRow
              label="Assigned Date"
              value={new Date(test.assigned_at).toLocaleDateString('en-GB')}
            />
            <InfoRow
              label="Due Date"
              value={due ? new Date(due).toLocaleDateString('en-GB') : '—'}
            />
            <InfoRow label="Technician" value={testerName} />
          </dl>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/50">
            Test Progress
          </h3>
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs text-black/60">
              <span>Completion</span>
              <span className="font-semibold tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-green-700 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {workflowSteps.map((step) => (
              <div
                key={step.key}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                  step.active
                    ? 'bg-green-600 text-white'
                    : step.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-black/5 text-black/40'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                ) : (
                  <Circle className="h-3 w-3 shrink-0" aria-hidden />
                )}
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 px-4 py-4 sm:px-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">
          Test Requirements
        </h3>
        <div className="rounded-lg border border-green-200 bg-green-50/80 p-3 text-sm text-black/80">
          {test.client_requirement || 'No specific client requirements documented.'}
        </div>
        {test.admin_notes && (
          <p className="mt-2 text-xs text-black/50">
            <span className="font-medium">Admin notes:</span> {test.admin_notes}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex flex-wrap gap-2">
          {(test.status === 'pending' || test.status === 'assigned') && (
            <ActionButton
              icon={Play}
              label="Start Test"
              primary
              loading={actionLoading}
              onClick={onStart}
            />
          )}
          {test.status === 'in_progress' && !isPaused && (
            <ActionButton icon={Pause} label="Pause Test" onClick={onPause} />
          )}
          {test.status === 'in_progress' && isPaused && (
            <ActionButton icon={Play} label="Resume Test" primary onClick={onResume} />
          )}
          {test.status === 'in_progress' && onOpenTestDetail && (
            <ActionButton
              icon={ExternalLink}
              label="Open Test Worksheet"
              primary
              onClick={onOpenTestDetail}
            />
          )}
          {test.status === 'submitted' && (
            <TesterReportActions
              testId={test.id}
              status={test.status}
              reportUrl={test.report_url}
              reportGeneratedAt={test.report_generated_at}
              onReportGenerated={onReportGenerated}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-black/50">{label}</dt>
      <dd className={`font-medium text-black ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
  primary,
  loading,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        primary
          ? 'bg-green-700 text-white hover:bg-green-800'
          : 'border border-black/15 bg-white text-black hover:bg-green-50'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
