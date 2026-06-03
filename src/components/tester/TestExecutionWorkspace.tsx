'use client';

import {
  ChevronLeft,
  Calendar,
  Clock,
  Package,
  Palette,
  Layers,
  Hash,
  User,
  RotateCw,
} from 'lucide-react';
import type { ReactNode } from 'react';

export const LAB_CARD =
  'rounded-xl border border-[#E0E0E0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]';

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'assigned':
      return 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]';
    case 'in_progress':
      return 'bg-[#2E7D32] text-white border border-[#1B5E20]';
    case 'submitted':
      return 'bg-[#1B5E20] text-white border border-[#1B5E20]';
    default:
      return 'bg-[#E8F5E9] text-[#111111] border border-[#C8E6C9]';
  }
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').toUpperCase();
}

export interface DeadlineDisplay {
  formattedDate: string;
  urgency: string;
  color: string;
  diffDays: number;
}

export function getDeadlineDisplay(
  deadline: string | null,
  status: string
): DeadlineDisplay | null {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  let color = 'text-[#111111]/70';
  let urgency = `${diffDays} days remaining`;

  if (diffDays < 0 && status !== 'submitted') {
    color = 'text-[#111111] font-semibold';
    urgency = 'Overdue';
  } else if (diffDays <= 3) {
    color = 'text-[#2E7D32] font-medium';
    urgency = `${diffDays} days remaining`;
  }

  return {
    color,
    urgency,
    diffDays,
    formattedDate: deadlineDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };
}

const WORKFLOW_STEPS = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'sample', label: 'Sample Received' },
  { key: 'testing', label: 'Testing' },
  { key: 'entry', label: 'Result Entry' },
  { key: 'submitted', label: 'Submitted' },
] as const;

export function workflowStepState(
  status: string,
  stepKey: (typeof WORKFLOW_STEPS)[number]['key']
): 'done' | 'active' | 'pending' {
  const stepIndex: Record<string, number> = {
    assigned: 0,
    sample: 1,
    testing: 2,
    entry: 3,
    submitted: 4,
  };
  const current = stepIndex[stepKey];
  if (status === 'submitted') return 'done';
  if (status === 'pending') {
    return stepKey === 'assigned' ? 'active' : 'pending';
  }
  if (status === 'assigned') {
    if (current <= 0) return current === 0 ? 'active' : 'done';
    return 'pending';
  }
  if (status === 'in_progress') {
    if (current < 2) return 'done';
    if (current === 2) return 'active';
    return 'pending';
  }
  return 'pending';
}

export function ProgressTracker({ status }: { status: string }) {
  return (
    <div className={`${LAB_CARD} p-4`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
        Progress
      </h3>
      <ol className="mt-3 space-y-0">
        {WORKFLOW_STEPS.map((step, i) => {
          const state = workflowStepState(status, step.key);
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    state === 'done'
                      ? 'bg-[#2E7D32] text-white'
                      : state === 'active'
                        ? 'bg-[#2E7D32] text-white ring-4 ring-[#E8F5E9]'
                        : 'border-2 border-[#C8E6C9] bg-white text-[#111111]/30'
                  }`}
                >
                  {state === 'done' ? '✓' : state === 'active' ? '●' : '○'}
                </span>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <span
                    className={`my-0.5 w-0.5 flex-1 min-h-[20px] ${
                      state === 'done' ? 'bg-[#2E7D32]' : 'bg-[#C8E6C9]'
                    }`}
                  />
                )}
              </div>
              <div className="pb-4 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    state === 'active'
                      ? 'text-[#2E7D32]'
                      : state === 'done'
                        ? 'text-[#111111]'
                        : 'text-[#111111]/40'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MetaCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/45">
        {label}
      </dt>
      <dd className={`mt-0.5 text-sm font-medium text-[#111111] ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

export function TestIdentityGrid({
  libraryId,
  category,
  testName,
  testStandard,
  clientRequirement,
}: {
  libraryId: string;
  category: string;
  testName: string;
  testStandard: string;
  clientRequirement?: string;
}) {
  return (
    <div className={`${LAB_CARD} p-4`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
        Test Details
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <MetaCell label="Library ID" value={libraryId} mono />
        <MetaCell label="Category" value={category} />
        <div className="col-span-2 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/45">
            Method
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-[#111111]">{testName}</dd>
          <dd className="font-mono text-xs text-[#2E7D32]">{testStandard}</dd>
        </div>
      </dl>
      {clientRequirement?.trim() ? (
        <div className="mt-3">
          <ClientRequirementBox text={clientRequirement} />
        </div>
      ) : null}
    </div>
  );
}

export function ProductInfoCard({
  articleName,
  articleNumber,
  material,
  color,
  productCategory,
}: {
  articleName: string;
  articleNumber: string;
  material: string;
  color: string;
  productCategory: string;
}) {
  const rows = [
    { icon: Package, label: 'Product', value: articleName },
    { icon: Hash, label: 'Article No.', value: articleNumber, mono: true },
    { icon: Layers, label: 'Material', value: material },
    { icon: Palette, label: 'Color', value: color },
    { icon: Package, label: 'Category', value: productCategory },
  ];

  return (
    <div className={`${LAB_CARD} p-4`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
        Product
      </h3>
      <div className="mt-3 flex gap-3">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#C8E6C9] bg-[#E8F5E9] text-[#2E7D32]"
          aria-hidden
        >
          <Package className="h-7 w-7 opacity-60" />
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {rows.map(({ icon: Icon, label, value, mono }) => (
            <li key={label} className="flex items-start gap-2 text-sm">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2E7D32]" aria-hidden />
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/45">
                  {label}
                </span>
                <p className={`truncate font-medium text-[#111111] ${mono ? 'font-mono text-xs' : ''}`}>
                  {value || '—'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AssignmentPanel({
  assignedAt,
  deadline,
  deadlineInfo,
  technicianName,
}: {
  assignedAt: string;
  deadline: string | null;
  deadlineInfo: DeadlineDisplay | null;
  technicianName: string;
}) {
  const pct =
    deadlineInfo && deadlineInfo.diffDays >= 0
      ? Math.min(100, Math.max(8, 100 - deadlineInfo.diffDays * 8))
      : deadlineInfo
        ? 8
        : 0;

  return (
    <div className={`${LAB_CARD} p-4`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
        Assignment
      </h3>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[#2E7D32]" aria-hidden />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-[#111111]/45">Assigned</dt>
            <dd className="font-medium text-[#111111]">{assignedAt}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#2E7D32]" aria-hidden />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-[#111111]/45">Due</dt>
            <dd className="font-medium text-[#111111]">
              {deadlineInfo?.formattedDate ?? 'No deadline'}
            </dd>
            {deadlineInfo?.urgency && (
              <dd className={`text-xs ${deadlineInfo.color}`}>{deadlineInfo.urgency}</dd>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-[#2E7D32]" aria-hidden />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-[#111111]/45">Technician</dt>
            <dd className="font-medium text-[#111111]">{technicianName}</dd>
          </div>
        </div>
      </dl>
      {deadline && deadlineInfo && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-medium text-[#111111]/50">
            <span>Countdown</span>
            <span className={deadlineInfo.color}>{deadlineInfo.urgency}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E8F5E9]">
            <div
              className={`h-full rounded-full transition-all ${
                deadlineInfo.diffDays < 0 ? 'bg-[#111111]' : 'bg-[#2E7D32]'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientRequirementBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] p-4 shadow-[0_1px_3px_rgba(46,125,50,0.08)]">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#1B5E20]">
        Client Requirements
      </h3>
      <div className="mt-2 border-t border-[#C8E6C9] pt-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111111]">{text}</p>
      </div>
    </div>
  );
}

export function StickyTestHeader({
  testName,
  testStandard,
  status,
  deadlineInfo,
  onBack,
  trailing,
}: {
  testName: string;
  testStandard: string;
  status: string;
  deadlineInfo: DeadlineDisplay | null;
  onBack: () => void;
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E0E0E0] bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to My Tests"
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E0E0E0] bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:border-[#C8E6C9] hover:bg-[#E8F5E9] hover:text-[#1B5E20] active:scale-[0.98] sm:h-11 sm:w-11"
          >
            <ChevronLeft
              className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-[#111111] sm:text-xl">
              {testName}
            </h1>
            <p className="truncate font-mono text-xs text-[#2E7D32] sm:text-sm">{testStandard}</p>
            {deadlineInfo && (
              <p className="mt-0.5 text-xs text-[#111111]/55">
                Due{' '}
                <strong className="font-medium text-[#111111]">{deadlineInfo.formattedDate}</strong>
                <span className={`ml-1 ${deadlineInfo.color}`}>({deadlineInfo.urgency})</span>
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {trailing}
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${statusBadgeClass(status)}`}
            >
              {formatStatusLabel(status)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PeriodicBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-semibold text-[#1B5E20]">
      <RotateCw className="h-3 w-3" aria-hidden />
      PERIODIC
    </span>
  );
}
