'use client';

import { ExternalLink, Filter, Play, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TestsStatusFilter } from '@/lib/workbenchSections';
import type { AssignedTest } from '@/types/testerWorkbench';
import {
  derivePriority,
  effectiveDueDate,
  formatDueTime,
  isOverdue,
  isPendingStatus,
  priorityClass,
  priorityLabel,
  shortSampleId,
} from '@/lib/testerWorkbenchUtils';

type SortKey = 'deadline' | 'test_name' | 'status' | 'assigned_date';

interface AllTestsListProps {
  tests: AssignedTest[];
  selectedId: string | null;
  statusFilter: TestsStatusFilter;
  onStatusFilterChange: (filter: TestsStatusFilter) => void;
  onSelect: (test: AssignedTest) => void;
  onStartTest: (testId: string) => void;
  onOpenDetail: (testId: string) => void;
}

function statusBadge(status: AssignedTest['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-white text-black border-black/20';
    case 'assigned':
      return 'bg-green-50 text-black border-green-300';
    case 'in_progress':
      return 'bg-green-700 text-white border-green-800';
    case 'submitted':
      return 'bg-black text-white border-black';
    default:
      return 'bg-white text-black border-black/20';
  }
}

export default function AllTestsList({
  tests,
  selectedId,
  statusFilter,
  onStatusFilterChange,
  onSelect,
  onStartTest,
  onOpenDetail,
}: AllTestsListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('deadline');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tests
      .filter((test) => {
        if (statusFilter === 'overdue') return isOverdue(test);
        if (statusFilter === 'pending') return isPendingStatus(test.status);
        if (statusFilter !== 'all') return test.status === statusFilter;
        return true;
      })
      .filter((test) => {
        if (!q) return true;
        return (
          test.test_name.toLowerCase().includes(q) ||
          test.article_number.toLowerCase().includes(q) ||
          test.article_name.toLowerCase().includes(q) ||
          (test.client_name || '').toLowerCase().includes(q) ||
          test.inhouse_test_id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'deadline': {
            const da = effectiveDueDate(a);
            const db = effectiveDueDate(b);
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return new Date(da).getTime() - new Date(db).getTime();
          }
          case 'test_name':
            return a.test_name.localeCompare(b.test_name);
          case 'status':
            return a.status.localeCompare(b.status);
          case 'assigned_date':
            return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
          default:
            return 0;
        }
      });
  }, [tests, search, statusFilter, sortBy]);

  const counts = useMemo(
    () => ({
      all: tests.length,
      pending: tests.filter((t) => isPendingStatus(t.status)).length,
      in_progress: tests.filter((t) => t.status === 'in_progress').length,
      submitted: tests.filter((t) => t.status === 'submitted').length,
      overdue: tests.filter(isOverdue).length,
    }),
    [tests]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['all', 'All'],
            ['pending', 'Pending'],
            ['in_progress', 'In Progress'],
            ['submitted', 'Submitted'],
            ['overdue', 'Overdue'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onStatusFilterChange(key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              statusFilter === key
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-black/15 bg-white text-black hover:bg-green-50'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search test, article, client, method…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-black placeholder:text-black/40 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-black/40" aria-hidden />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm text-black focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
          >
            <option value="deadline">Sort: Due date</option>
            <option value="test_name">Sort: Test name</option>
            <option value="status">Sort: Status</option>
            <option value="assigned_date">Sort: Assigned date</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-black/50">
        Showing {filtered.length} of {tests.length} assigned tests
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="font-medium text-black">No tests match your filters</p>
          <p className="mt-1 text-sm text-black/50">Try clearing search or changing the status filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-green-50 text-left text-xs uppercase tracking-wide text-black/60">
                  <th className="px-4 py-3 font-medium">Sample ID</th>
                  <th className="px-4 py-3 font-medium">Test Name</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Article</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((test) => {
                  const due = effectiveDueDate(test);
                  const overdue = isOverdue(test);
                  const priority = derivePriority(test);
                  const selected = selectedId === test.id;
                  return (
                    <tr
                      key={test.id}
                      className={`border-b border-black/5 transition-colors hover:bg-green-50/50 ${
                        selected ? 'bg-green-50' : overdue ? 'bg-black/[0.03]' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-black">
                        {shortSampleId(test)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-black">{test.test_name}</p>
                        <p className="text-xs text-black/50">{test.inhouse_test_id}</p>
                      </td>
                      <td className="px-4 py-3 text-black/70">
                        {test.client_name || test.client_code || '—'}
                      </td>
                      <td className="px-4 py-3 text-black/70">
                        <p>{test.article_number}</p>
                        <p className="truncate text-xs text-black/45">{test.article_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadge(test.status)}`}
                        >
                          {test.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 tabular-nums text-xs ${overdue ? 'font-bold text-black' : 'text-black/60'}`}
                      >
                        {due ? formatDueTime(due) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityClass(priority)}`}
                        >
                          {priorityLabel(priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelect(test)}
                            className="rounded-md border border-green-700 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
                          >
                            Select
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(test.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-black/15 px-2 py-1 text-xs font-medium text-black hover:bg-green-50"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            Open
                          </button>
                          {(test.status === 'pending' || test.status === 'assigned') && (
                            <button
                              type="button"
                              onClick={() => onStartTest(test.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-green-700 px-2 py-1 text-xs font-medium text-white hover:bg-green-800"
                            >
                              <Play className="h-3 w-3" aria-hidden />
                              Start
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
