'use client';

import { AlertCircle } from 'lucide-react';
import type { AssignedTest } from '@/types/testerWorkbench';
import {
  derivePriority,
  effectiveDueDate,
  formatDueTime,
  isOverdue,
  priorityClass,
  priorityLabel,
  shortSampleId,
} from '@/lib/testerWorkbenchUtils';

interface PriorityQueueProps {
  tests: AssignedTest[];
  selectedId: string | null;
  onSelect: (test: AssignedTest) => void;
}

export default function PriorityQueue({ tests, selectedId, onSelect }: PriorityQueueProps) {
  if (tests.length === 0) {
    return (
      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-black">High Priority Tests</h2>
        <p className="text-sm text-black/50">No urgent tests in queue.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-black/10 bg-green-50 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-black">
          <AlertCircle className="h-4 w-4 text-green-800" aria-hidden />
          High Priority Tests
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/50">
              <th className="px-4 py-2.5 font-medium">Sample ID</th>
              <th className="px-4 py-2.5 font-medium">Test Name</th>
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="px-4 py-2.5 font-medium">Due Time</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => {
              const overdue = isOverdue(test);
              const priority = derivePriority(test);
              const due = effectiveDueDate(test);
              return (
                <tr
                  key={test.id}
                  onClick={() => onSelect(test)}
                  className={`cursor-pointer border-b border-black/5 transition-colors hover:bg-green-50/60 ${
                    selectedId === test.id ? 'bg-green-100/80' : overdue ? 'bg-black/[0.04]' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-black">
                    {shortSampleId(test)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-black">{test.test_name}</td>
                  <td className="px-4 py-2.5 text-black/70">
                    {test.client_name || test.client_code || '—'}
                  </td>
                  <td className={`px-4 py-2.5 tabular-nums ${overdue ? 'font-bold text-black' : 'text-black/70'}`}>
                    {formatDueTime(due)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass(priority)}`}
                    >
                      {priorityLabel(priority)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
