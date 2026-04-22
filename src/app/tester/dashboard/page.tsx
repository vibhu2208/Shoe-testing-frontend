'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState, useEffect } from 'react';
import { User, Search, Filter, LogOut, RotateCw, CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, Clock3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AssignedTest {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  execution_type: string;
  inhouse_test_id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted';
  test_deadline: string | null;
  assigned_at: string;
  admin_notes: string | null;
  article_name: string;
  article_number: string;
  material_type: string;
  color: string;
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

interface TestStats {
  total: number;
  pending: number;
  in_progress: number;
  submitted: number;
  overdue: number;
  periodic: number;
}

export default function TesterDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TestStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    submitted: 0,
    overdue: 0,
    periodic: 0,
  });
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'submitted' | 'overdue' | 'periodic'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'deadline' | 'test_name' | 'status' | 'assigned_date'
  >('deadline');
  const [testerSection, setTesterSection] = useState<'upcoming' | 'completed' | 'calendar'>(
    'upcoming'
  );
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    fetchAssignedTests();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [tests]);

  useEffect(() => {
    if (testerSection === 'completed') {
      setFilter('all');
    }
    if (testerSection === 'upcoming' && filter === 'submitted') {
      setFilter('all');
    }
  }, [testerSection, filter]);

  const getCurrentTesterId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      const parsedUser = JSON.parse(storedUser);
      return parsedUser?.id ? String(parsedUser.id) : null;
    } catch (error) {
      console.error('Failed to read logged-in tester from storage:', error);
      return null;
    }
  };

  const fetchAssignedTests = async () => {
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(publicApiUrl('/api/tester/my-tests'), {
        headers: testerId ? { 'x-user-id': testerId } : {},
      });
      if (response.ok) {
        const testsData = await response.json();
        setTests(testsData);
      } else {
        console.error('Failed to fetch assigned tests');
      }
    } catch (error) {
      console.error('Error fetching assigned tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const stats = tests.reduce(
      (acc, test) => {
        acc.total++;
        if (test.status === 'assigned') {
          acc.pending++;
        } else {
          acc[test.status]++;
        }

        if (test.test_deadline) {
          const deadline = new Date(test.test_deadline);
          if (deadline < now && test.status !== 'submitted') {
            acc.overdue++;
          }
        }

        if (test.is_periodic || test.periodic_schedule_id) {
          acc.periodic++;
        }

        return acc;
      },
      { total: 0, pending: 0, in_progress: 0, submitted: 0, overdue: 0, periodic: 0 }
    );

    setStats(stats);
  };

  const handleStartTest = async (testId: string) => {
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(
        publicApiUrl(`/api/tester/my-tests/${testId}/start`),
        {
          method: 'POST',
          headers: testerId ? { 'x-user-id': testerId } : {},
        }
      );

      if (response.ok) {
        setTests((prev) =>
          prev.map((test) =>
            test.id === testId ? { ...test, status: 'in_progress' } : test
          )
        );
      } else {
        console.error('Failed to start test');
        alert('Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Error starting test');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-black/10 text-black border border-black/15';
      case 'assigned':
        return 'bg-green-100 text-black border border-green-800/30';
      case 'in_progress':
        return 'bg-green-600 text-white border border-green-800';
      case 'submitted':
        return 'bg-black text-white border border-black';
      default:
        return 'bg-black/10 text-black border border-black/15';
    }
  };

  const getDeadlineBadge = (deadline: string | null, status: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0 && status !== 'submitted') {
      return 'bg-black text-white border border-black';
    }
    if (diffDays <= 3) {
      return 'bg-green-200 text-black border border-green-800/40';
    }
    if (diffDays <= 7) {
      return 'bg-green-50 text-black border border-green-700/40';
    }
    return 'bg-white text-black border border-black/15';
  };

  const getDeadlineText = (deadline: string | null, status: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const formattedDate = deadlineDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    if (diffDays < 0 && status !== 'submitted') {
      return `Overdue: ${formattedDate}`;
    }
    if (diffDays <= 3) {
      return `Due: ${formattedDate} (urgent)`;
    }
    if (diffDays <= 7) {
      return `Due: ${formattedDate} (soon)`;
    }
    return `Due: ${formattedDate}`;
  };

  const isPeriodicTest = (t: AssignedTest) =>
    !!(t.is_periodic || t.periodic_schedule_id);

  const periodicDueDate = (t: AssignedTest): string | null =>
    t.periodic_run_due_date || t.periodic_schedule_next_due || t.test_deadline;

  const normalizeToDateOnly = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const buildTestByDateMap = () => {
    const byDate = new Map<string, AssignedTest[]>();
    for (const test of tests) {
      if (test.status === 'submitted') continue;
      const dueStr = periodicDueDate(test) || test.test_deadline;
      if (!dueStr) continue;

      const dueDate = normalizeToDateOnly(new Date(dueStr));
      const dateKey = dueDate.toISOString().slice(0, 10);
      const existing = byDate.get(dateKey) || [];
      existing.push(test);
      byDate.set(dateKey, existing);
    }
    return byDate;
  };

  const buildMonthCells = () => {
    const startOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const endOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);

    const startOffset = startOfMonth.getDay();
    const cells: Date[] = [];

    for (let i = startOffset; i > 0; i--) {
      const d = new Date(startOfMonth);
      d.setDate(startOfMonth.getDate() - i);
      cells.push(d);
    }

    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      cells.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }

    while (cells.length % 7 !== 0) {
      const d = new Date(endOfMonth);
      d.setDate(endOfMonth.getDate() + (cells.length % 7));
      cells.push(d);
    }

    return cells;
  };

  const sectionTests = tests.filter((test) => {
    if (testerSection === 'completed') return test.status === 'submitted';
    if (testerSection === 'upcoming') return test.status !== 'submitted';
    return true;
  });

  const filteredAndSortedTests = sectionTests
    .filter((test) => {
      if (filter === 'periodic') {
        return isPeriodicTest(test);
      }
      if (filter === 'overdue') {
        const now = new Date();
        const dueStr = periodicDueDate(test);
        const deadline = dueStr ? new Date(dueStr) : test.test_deadline
          ? new Date(test.test_deadline)
          : null;
        return deadline && deadline < now && test.status !== 'submitted';
      }
      if (filter !== 'all') {
        if (filter === 'pending')
          return test.status === 'pending' || test.status === 'assigned';
        return test.status === filter;
      }
      return true;
    })
    .filter((test) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchLower === 'periodic') {
        return isPeriodicTest(test);
      }
      return (
        test.test_name.toLowerCase().includes(searchLower) ||
        test.article_number.toLowerCase().includes(searchLower) ||
        test.article_name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'deadline': {
          const da = periodicDueDate(a) || a.test_deadline;
          const db = periodicDueDate(b) || b.test_deadline;
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
          return (
            new Date(b.assigned_at).getTime() -
            new Date(a.assigned_at).getTime()
          );
        default:
          return 0;
      }
    });

  const testsByDate = buildTestByDateMap();
  const monthCells = buildMonthCells();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = normalizeToDateOnly(new Date()).toISOString().slice(0, 10);
  const completedCount = tests.filter((test) => test.status === 'submitted').length;
  const upcomingCount = tests.filter((test) => test.status !== 'submitted').length;
  const agendaDays = [0, 1, 2].map((offset) => {
    const d = normalizeToDateOnly(new Date());
    d.setDate(d.getDate() + offset);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : 'Day After',
      dateText: d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
      tests: testsByDate.get(key) || [],
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-black/70">Loading your assigned tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-black/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <User className="w-6 h-6 text-green-700 shrink-0" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-black truncate">
                  My Assigned Tests
                </h1>
                <p className="text-sm text-black/60 hidden sm:block">
                  Tester Dashboard
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-medium text-black hover:bg-green-50"
            >
              <LogOut className="w-4 h-4" aria-hidden />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-green-900/15 bg-gradient-to-r from-white via-green-50/40 to-white shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-green-900/8 hidden sm:block" />
            <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-green-900/8 hidden sm:block" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5 p-1.5">
              <button
                type="button"
                onClick={() => setTesterSection('upcoming')}
                className={`group relative px-4 py-3.5 rounded-xl text-left border transition-all duration-200 ${
                  testerSection === 'upcoming'
                    ? 'bg-gradient-to-r from-green-700 to-green-600 text-white border-green-700 shadow-sm'
                    : 'bg-white/90 text-black border-black/10 hover:bg-green-50/80 hover:border-green-700/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                      testerSection === 'upcoming' ? 'bg-white/20' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <Clock3 className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="text-sm font-semibold tracking-tight">Upcoming Tests</div>
                </div>
                <div className={`text-xs ${testerSection === 'upcoming' ? 'text-white/90' : 'text-black/60'}`}>
                  {upcomingCount} pending or in progress
                </div>
                {testerSection === 'upcoming' && (
                  <div className="absolute left-4 right-4 -bottom-px h-0.5 bg-white/80 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setTesterSection('completed')}
                className={`group relative px-4 py-3.5 rounded-xl text-left border transition-all duration-200 ${
                  testerSection === 'completed'
                    ? 'bg-gradient-to-r from-green-700 to-green-600 text-white border-green-700 shadow-sm'
                    : 'bg-white/90 text-black border-black/10 hover:bg-green-50/80 hover:border-green-700/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                      testerSection === 'completed' ? 'bg-white/20' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="text-sm font-semibold tracking-tight">Completed Tests</div>
                </div>
                <div className={`text-xs ${testerSection === 'completed' ? 'text-white/90' : 'text-black/60'}`}>
                  {completedCount} submitted tests
                </div>
                {testerSection === 'completed' && (
                  <div className="absolute left-4 right-4 -bottom-px h-0.5 bg-white/80 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setTesterSection('calendar')}
                className={`group relative px-4 py-3.5 rounded-xl text-left border transition-all duration-200 ${
                  testerSection === 'calendar'
                    ? 'bg-gradient-to-r from-green-700 to-green-600 text-white border-green-700 shadow-sm'
                    : 'bg-white/90 text-black border-black/10 hover:bg-green-50/80 hover:border-green-700/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                      testerSection === 'calendar' ? 'bg-white/20' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="text-sm font-semibold tracking-tight">Calendar</div>
                </div>
                <div className={`text-xs ${testerSection === 'calendar' ? 'text-white/90' : 'text-black/60'}`}>
                  Date-wise schedule view
                </div>
                {testerSection === 'calendar' && (
                  <div className="absolute left-4 right-4 -bottom-px h-0.5 bg-white/80 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </section>

        {testerSection === 'calendar' && (
        <section className="mb-8">
          <div className="bg-white rounded-lg border border-black/10 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-green-700" aria-hidden />
                <h2 className="text-lg font-semibold text-black">Test Calendar</h2>
              </div>
              <div className="inline-flex items-center rounded-lg border border-black/15 p-1 bg-white">
                <button
                  type="button"
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    calendarView === 'month'
                      ? 'bg-green-700 text-white'
                      : 'text-black hover:bg-green-50'
                  }`}
                >
                  Date-wise Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarView('agenda')}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    calendarView === 'agenda'
                      ? 'bg-green-700 text-white'
                      : 'text-black hover:bg-green-50'
                  }`}
                >
                  Today / Next Days
                </button>
              </div>
            </div>
            {calendarView === 'month' ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                    className="inline-flex items-center gap-1 px-2 py-1.5 border border-black/15 rounded-md text-sm hover:bg-green-50"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden />
                    Prev
                  </button>
                  <div className="font-semibold text-black">
                    {calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                    className="inline-flex items-center gap-1 px-2 py-1.5 border border-black/15 rounded-md text-sm hover:bg-green-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" aria-hidden />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {dayLabels.map((label) => (
                    <div key={label} className="text-xs font-semibold text-black/60 text-center py-1">
                      {label}
                    </div>
                  ))}
                  {monthCells.map((cellDate) => {
                    const cellKey = normalizeToDateOnly(cellDate).toISOString().slice(0, 10);
                    const dayTests = testsByDate.get(cellKey) || [];
                    const inCurrentMonth = cellDate.getMonth() === calendarMonth.getMonth();
                    const isToday = cellKey === todayKey;

                    return (
                      <div
                        key={cellKey}
                        className={`min-h-[110px] rounded-lg border p-2 ${
                          isToday
                            ? 'border-green-700 bg-green-50/70'
                            : inCurrentMonth
                              ? 'border-black/10 bg-white'
                              : 'border-black/10 bg-black/[0.03]'
                        }`}
                      >
                        <div className={`text-xs font-semibold ${inCurrentMonth ? 'text-black' : 'text-black/40'}`}>
                          {cellDate.getDate()}
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayTests.slice(0, 2).map((test) => (
                            <button
                              type="button"
                              key={`${cellKey}-${test.id}`}
                              onClick={() => router.push(`/tester/tests/${test.id}`)}
                              className="block w-full text-left rounded border border-green-800/20 bg-green-100/60 px-1.5 py-1 text-[11px] text-black truncate hover:bg-green-100"
                              title={test.test_name}
                            >
                              {test.test_name}
                            </button>
                          ))}
                          {dayTests.length > 2 && (
                            <div className="text-[11px] text-black/60">+{dayTests.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {agendaDays.map((bucket) => (
                  <div key={bucket.key} className="rounded-lg border border-green-700/30 bg-green-50/70 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-black">{bucket.label}</div>
                      <span className="text-xs text-black/70">{bucket.dateText}</span>
                    </div>
                    {bucket.tests.length === 0 ? (
                      <p className="text-xs text-black/60">No tests due</p>
                    ) : (
                      <div className="space-y-2">
                        {bucket.tests.map((test) => (
                        <button
                          type="button"
                          key={test.id}
                          onClick={() => router.push(`/tester/tests/${test.id}`)}
                          className="w-full text-left rounded border border-black/10 bg-white px-2 py-1.5 hover:bg-green-50"
                        >
                          <div className="text-xs font-medium text-black truncate">{test.test_name}</div>
                          <div className="text-[11px] text-black/60 truncate">{test.article_number}</div>
                        </button>
                      ))}
                    </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-black/10 shadow-sm">
            <div className="text-2xl font-bold text-black">{stats.total}</div>
            <div className="text-sm text-black/70">Total Assigned</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-black/10 shadow-sm">
            <div className="text-2xl font-bold text-black">{stats.pending}</div>
            <div className="text-sm text-black/70">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-black/10 shadow-sm">
            <div className="text-2xl font-bold text-green-700">
              {stats.in_progress}
            </div>
            <div className="text-sm text-black/70">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-black/10 shadow-sm">
            <div className="text-2xl font-bold text-green-700">
              {stats.submitted}
            </div>
            <div className="text-sm text-black/70">Submitted</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-black/10 shadow-sm">
            <div className="text-2xl font-bold text-black">{stats.overdue}</div>
            <div className="text-sm text-black/70">Overdue</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-violet-200 bg-violet-50/80 shadow-sm">
            <div className="text-2xl font-bold text-violet-900">{stats.periodic}</div>
            <div className="text-sm text-violet-800">Periodic</div>
          </div>
        </div>

        {testerSection !== 'calendar' && (
        <div className="bg-white rounded-lg border border-black/10 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" />
                <input
                  type="text"
                  placeholder="Search by test name or article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-black/20 rounded-md text-sm text-black placeholder:text-black/40 bg-white focus:ring-2 focus:ring-green-600 focus:border-green-700 w-full sm:w-72"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-black/40" />
                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value as typeof filter)
                  }
                  className="px-3 py-2 border border-black/20 rounded-md text-sm text-black bg-white focus:ring-2 focus:ring-green-600 focus:border-green-700"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  {testerSection === 'completed' && <option value="submitted">Submitted</option>}
                  <option value="overdue">Overdue</option>
                  <option value="periodic">Periodic only</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-black/70 whitespace-nowrap">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as typeof sortBy)
                }
                className="px-3 py-2 border border-black/20 rounded-md text-sm text-black bg-white focus:ring-2 focus:ring-green-600 focus:border-green-700"
              >
                <option value="deadline">Deadline</option>
                <option value="test_name">Test Name</option>
                <option value="status">Status</option>
                <option value="assigned_date">Assigned Date</option>
              </select>
            </div>
          </div>
        </div>
        )}

        {testerSection !== 'calendar' && (
        <div className="space-y-4">
          {filteredAndSortedTests.length === 0 ? (
            <div className="bg-white rounded-lg border border-black/10 p-8 text-center shadow-sm">
              <User className="w-12 h-12 text-black/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                No tests found
              </h3>
              <p className="text-black/70">
                {filter === 'all' && !searchTerm
                  ? "You don't have any assigned tests yet."
                  : 'No tests match your current filters.'}
              </p>
            </div>
          ) : (
            filteredAndSortedTests.map((test) => {
              const periodic = isPeriodicTest(test);
              const periodicDue = periodicDueDate(test);
              return (
              <div
                key={test.id}
                className="bg-white rounded-lg border border-black/10 p-6 shadow-sm"
              >
                {periodic && (
                  <div className="mb-4 rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 text-sm text-violet-950">
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      <RotateCw className="h-4 w-4 shrink-0 text-violet-800" aria-hidden />
                      Periodic test assignment
                    </div>
                    <p className="mt-2 text-violet-900">
                      <span className="font-medium">This run:</span>{' '}
                      {typeof test.periodic_run_number === 'number'
                        ? `${test.periodic_run_number}`
                        : '—'}
                      {test.periodic_total_occurrences != null
                        ? ` of ${test.periodic_total_occurrences}`
                        : ' (ongoing schedule)'}
                      {test.periodic_frequency_value != null
                        ? ` · repeats every ${test.periodic_frequency_value} day${test.periodic_frequency_value === 1 ? '' : 's'}`
                        : ''}
                      {test.periodic_frequency_type
                        ? ` (${test.periodic_frequency_type})`
                        : ''}
                    </p>
                    {test.periodic_schedule_status && (
                      <p className="mt-1 text-xs text-violet-800">
                        Schedule: <span className="capitalize">{test.periodic_schedule_status}</span>
                      </p>
                    )}
                    {periodicDue && (
                      <p className="mt-2 text-violet-900">
                        <span className="font-medium">Due for this run:</span>{' '}
                        {new Date(periodicDue).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(test.status)}`}
                    >
                      {test.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {periodic && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full border border-violet-400 bg-violet-100 text-violet-900">
                        PERIODIC
                      </span>
                    )}
                    {(periodicDue || test.test_deadline) && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getDeadlineBadge(
                          periodicDue || test.test_deadline,
                          test.status
                        )}`}
                      >
                        {getDeadlineText(periodicDue || test.test_deadline, test.status)}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-black mb-2">
                  {test.test_name}
                </h3>
                <div className="text-sm text-black/70 mb-4">
                  {test.inhouse_test_id} — {test.test_standard}
                </div>

                <div className="border-t border-black/10 pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-black">Article No:</span>{' '}
                      <span className="text-black/80">{test.article_number}</span>
                    </div>
                    <div>
                      <span className="font-medium text-black">Product:</span>{' '}
                      <span className="text-black/80">{test.article_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-black">Material:</span>{' '}
                      <span className="text-black/80">{test.material_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-black">Category:</span>
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs rounded-full border ${
                          test.category === 'Finished Good'
                            ? 'bg-green-100 text-black border-green-800/30'
                            : 'bg-white text-black border-black/15'
                        }`}
                      >
                        {test.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-black/10 pt-4 mb-4">
                  <div className="font-medium text-black mb-2">
                    Client Requirement:
                  </div>
                  <div className="text-sm text-black/80 bg-green-50/80 p-3 rounded border border-green-800/20">
                    {test.client_requirement}
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-xs text-black/60">
                    Assigned:{' '}
                    {new Date(test.assigned_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/tester/tests/${test.id}`)
                      }
                      className="px-4 py-2 border-2 border-green-700 text-green-800 text-sm font-medium rounded-md hover:bg-green-50"
                    >
                      View Full Details
                    </button>
                    {test.status === 'pending' || test.status === 'assigned' ? (
                      <button
                        type="button"
                        onClick={() => handleStartTest(test.id)}
                        className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800"
                      >
                        Start Test
                      </button>
                    ) : test.status === 'in_progress' ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 bg-black/15 text-black/50 text-sm font-medium rounded-md cursor-not-allowed border border-black/10"
                        title="Open the test detail page to submit results"
                      >
                        Submit Result
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
        )}
      </main>
    </div>
  );
}
