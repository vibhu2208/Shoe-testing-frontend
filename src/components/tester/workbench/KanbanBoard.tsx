'use client';

import { GripVertical } from 'lucide-react';
import type { AssignedTest } from '@/types/testerWorkbench';
import {
  effectiveDueDate,
  kanbanColumn,
  shortSampleId,
  statusProgress,
} from '@/lib/testerWorkbenchUtils';

const COLUMNS = [
  { id: 'pending' as const, label: 'Pending', color: 'border-t-black/30' },
  { id: 'in_progress' as const, label: 'In Progress', color: 'border-t-green-600' },
  { id: 'review' as const, label: 'Review', color: 'border-t-black' },
  { id: 'submitted' as const, label: 'Submitted', color: 'border-t-black/40' },
];

interface KanbanBoardProps {
  tests: AssignedTest[];
  selectedId: string | null;
  onSelect: (test: AssignedTest) => void;
  onMoveToInProgress: (testId: string) => void;
}

export default function KanbanBoard({
  tests,
  selectedId,
  onSelect,
  onMoveToInProgress,
}: KanbanBoardProps) {
  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = tests.filter((t) => kanbanColumn(t) === col.id);
      return acc;
    },
    {} as Record<(typeof COLUMNS)[number]['id'], AssignedTest[]>
  );

  const handleDrop = (e: React.DragEvent, targetCol: (typeof COLUMNS)[number]['id']) => {
    e.preventDefault();
    const testId = e.dataTransfer.getData('text/test-id');
    if (!testId) return;
    const test = tests.find((t) => t.id === testId);
    if (!test) return;
    if (targetCol === 'in_progress' && (test.status === 'pending' || test.status === 'assigned')) {
      onMoveToInProgress(testId);
    }
  };

  return (
    <section className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-black">Running Tests Pipeline</h2>
        <p className="text-xs text-black/50">Drag cards to In Progress to start a test</p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`min-h-[180px] rounded-lg border border-black/10 border-t-4 bg-black/[0.02] ${col.color}`}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-black/60">
                {col.label}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-black/70 shadow-sm">
                {grouped[col.id].length}
              </span>
            </div>
            <div className="space-y-2 px-2 pb-2">
              {grouped[col.id].map((test) => (
                <KanbanCard
                  key={test.id}
                  test={test}
                  selected={selectedId === test.id}
                  draggable={test.status === 'pending' || test.status === 'assigned'}
                  onSelect={() => onSelect(test)}
                />
              ))}
              {grouped[col.id].length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-black/30">No tests</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KanbanCard({
  test,
  selected,
  draggable,
  onSelect,
}: {
  test: AssignedTest;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
}) {
  const due = effectiveDueDate(test);
  const progress = statusProgress(test.status);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (draggable) e.dataTransfer.setData('text/test-id', test.id);
      }}
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md ${
        selected ? 'border-green-700 ring-1 ring-green-200' : 'border-black/10'
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-1">
        <span className="font-mono text-[10px] font-bold text-black/70">{shortSampleId(test)}</span>
        {draggable && <GripVertical className="h-3.5 w-3.5 shrink-0 text-black/25" aria-hidden />}
      </div>
      <p className="text-xs font-semibold leading-tight text-black">{test.test_name}</p>
      <p className="mt-0.5 truncate text-[11px] text-black/50">
        {test.client_name || test.client_code || '—'}
      </p>
      {due && (
        <p className="mt-1 text-[10px] tabular-nums text-black/45">
          Due {new Date(due).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </p>
      )}
      <div className="mt-2">
        <div className="h-1 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-green-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-0.5 text-right text-[10px] tabular-nums text-black/40">{progress}%</p>
      </div>
    </div>
  );
}
