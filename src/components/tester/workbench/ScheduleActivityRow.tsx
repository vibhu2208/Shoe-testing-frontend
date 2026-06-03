'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ActivityItem, AssignedTest } from '@/types/testerWorkbench';
import {
  buildMonthCalendarCells,
  isFutureScheduleDate,
  scheduleDateForTest,
  toLocalDateKey,
} from '@/lib/testerWorkbenchUtils';

interface ScheduleActivityRowProps {
  tests: AssignedTest[];
  activity: ActivityItem[];
  onSelectTest: (test: AssignedTest) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleActivityRow({
  tests,
  activity,
  onSelectTest,
}: ScheduleActivityRowProps) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

  const tomorrowKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalDateKey(d);
  }, []);

  const testsByDate = useMemo(() => {
    const map = new Map<string, AssignedTest[]>();
    for (const test of tests) {
      const scheduleOn = scheduleDateForTest(test);
      if (!scheduleOn) continue;
      const key = toLocalDateKey(scheduleOn);
      const list = map.get(key) || [];
      list.push(test);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.test_name.localeCompare(b.test_name));
    }
    return map;
  }, [tests]);

  const futureTests = useMemo(
    () =>
      tests.filter((t) => {
        const d = scheduleDateForTest(t);
        return d && isFutureScheduleDate(d);
      }),
    [tests]
  );

  const todayTests = testsByDate.get(todayKey) || [];
  const tomorrowTests = testsByDate.get(tomorrowKey) || [];

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toLocalDateKey(d);
      return { date: d, key, tests: testsByDate.get(key) || [] };
    });
  }, [testsByDate]);

  const upcomingDeadlines = useMemo(
    () =>
      [...futureTests].sort((a, b) => {
        const da = scheduleDateForTest(a)!;
        const db = scheduleDateForTest(b)!;
        return new Date(da).getTime() - new Date(db).getTime();
      }),
    [futureTests]
  );

  const monthCells = useMemo(() => buildMonthCalendarCells(calendarMonth), [calendarMonth]);

  const selectedTests = selectedDateKey ? testsByDate.get(selectedDateKey) || [] : [];

  const futureCount = futureTests.length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-black">
          <CalendarDays className="h-4 w-4 text-green-700" aria-hidden />
          Calendar &amp; Schedule
        </h2>
        <p className="mb-3 text-xs text-black/50">
          {futureCount} upcoming assignment{futureCount === 1 ? '' : 's'} on your calendar
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <ScheduleBucket title="Today's Tests" tests={todayTests} onSelect={onSelectTest} />
          <ScheduleBucket title="Tomorrow's Tests" tests={tomorrowTests} onSelect={onSelectTest} />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">Weekly Schedule</p>
        <div className="mb-4 grid grid-cols-7 gap-1">
          {weekDays.map(({ date, key, tests: dayTests }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDateKey(key)}
              className={`rounded-md border p-1.5 text-center transition-colors ${
                key === todayKey ? 'border-green-600 bg-green-50' : 'border-black/10 bg-black/[0.02]'
              } ${selectedDateKey === key ? 'ring-2 ring-green-600 ring-offset-1' : 'hover:bg-green-50/60'}`}
            >
              <p className="text-[10px] font-medium text-black/60">
                {date.toLocaleDateString('en-GB', { weekday: 'narrow' })}
              </p>
              <p className="text-xs font-bold tabular-nums text-black">{date.getDate()}</p>
              <p className="text-[10px] font-semibold text-green-700">
                {dayTests.length > 0 ? dayTests.length : '—'}
              </p>
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">
          Upcoming Assignments
        </p>
        <ul className="mb-4 max-h-40 space-y-1.5 overflow-y-auto">
          {upcomingDeadlines.map((test) => {
            const due = scheduleDateForTest(test)!;
            return (
              <li key={test.id}>
                <button
                  type="button"
                  onClick={() => onSelectTest(test)}
                  className="flex w-full items-center justify-between rounded-lg border border-black/10 px-2 py-1.5 text-left text-xs hover:bg-green-50"
                >
                  <span className="truncate font-medium text-black">{test.test_name}</span>
                  <span className="shrink-0 tabular-nums text-black/50">
                    {formatShortDate(toLocalDateKey(due))}
                  </span>
                </button>
              </li>
            );
          })}
          {upcomingDeadlines.length === 0 && (
            <li className="text-xs text-black/40">No upcoming assignments scheduled</li>
          )}
        </ul>

        <div className="border-t border-black/10 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
              }
              className="rounded p-1 hover:bg-black/5"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="text-xs font-semibold text-black">
              {calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
              }
              className="rounded p-1 hover:bg-black/5"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-black/45">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
            {monthCells.map((cell) => {
              const key = toLocalDateKey(cell);
              const dayTests = testsByDate.get(key) || [];
              const count = dayTests.length;
              const inMonth = cell.getMonth() === calendarMonth.getMonth();
              const isToday = key === todayKey;
              const isSelected = selectedDateKey === key;
              const hasFuture = dayTests.some((t) => {
                const d = scheduleDateForTest(t);
                return d && isFutureScheduleDate(d);
              });

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDateKey(key)}
                  title={
                    count > 0
                      ? `${count} test${count === 1 ? '' : 's'}: ${dayTests.map((t) => t.test_name).join(', ')}`
                      : undefined
                  }
                  className={`relative min-h-[2rem] rounded p-0.5 transition-colors ${
                    inMonth ? 'text-black' : 'text-black/25'
                  } ${isToday ? 'bg-green-100 font-bold' : ''} ${
                    isSelected ? 'ring-2 ring-green-600 ring-offset-1' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  {cell.getDate()}
                  {count > 0 && (
                    <div className="mt-0.5 flex justify-center gap-px">
                      {count <= 3 ? (
                        Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              hasFuture && inMonth ? 'bg-green-600' : 'bg-black/35'
                            }`}
                          />
                        ))
                      ) : (
                        <span className="text-[9px] font-bold leading-none text-green-700">
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50/50 p-2.5">
              <p className="mb-1.5 text-xs font-semibold text-black">
                {parseDisplayDate(selectedDateKey)}
                {selectedTests.length > 0 && (
                  <span className="font-normal text-black/50">
                    {' '}
                    · {selectedTests.length} test{selectedTests.length === 1 ? '' : 's'}
                  </span>
                )}
              </p>
              {selectedTests.length === 0 ? (
                <p className="text-[11px] text-black/45">No tests scheduled for this day</p>
              ) : (
                <ul className="space-y-1">
                  {selectedTests.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onSelectTest(t)}
                        className="w-full truncate text-left text-[11px] font-medium text-black hover:underline"
                      >
                        {t.test_name}
                        {t.article_number ? (
                          <span className="text-black/45"> · {t.article_number}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-black">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-black/50">No recent activity recorded.</p>
        ) : (
          <ol className="relative border-l border-black/10 pl-4">
            {activity.map((item) => (
              <li key={item.id} className="mb-4 ml-1 last:mb-0">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-green-600" />
                <p className="text-sm text-black">{item.message}</p>
                <time className="text-xs text-black/45">
                  {new Date(item.timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseDisplayDate(dateKey: string): string {
  return dateFromKey(dateKey).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(dateKey: string): string {
  return dateFromKey(dateKey).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function ScheduleBucket({
  title,
  tests,
  onSelect,
}: {
  title: string;
  tests: AssignedTest[];
  onSelect: (t: AssignedTest) => void;
}) {
  return (
    <div className="rounded-lg border border-green-300 bg-green-50 p-2.5">
      <p className="mb-1.5 text-xs font-semibold text-black">{title}</p>
      {tests.length === 0 ? (
        <p className="text-[11px] text-black/45">None scheduled</p>
      ) : (
        <ul className="space-y-1">
          {tests.slice(0, 4).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t)}
                className="w-full truncate text-left text-[11px] font-medium text-black hover:underline"
              >
                {t.test_name}
              </button>
            </li>
          ))}
          {tests.length > 4 && (
            <li className="text-[10px] text-black/45">+{tests.length - 4} more</li>
          )}
        </ul>
      )}
    </div>
  );
}
