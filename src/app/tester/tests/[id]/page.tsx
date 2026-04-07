'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, FileText, AlertTriangle, RotateCw, Download } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import TesterResultEntry from '@/components/tester/TesterResultEntry';
import type { PeriodicRunRow } from '@/components/clients/PeriodicScheduleDrawer';

const API = 'http://localhost:5000/api';

interface TestDetail {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  execution_type: string;
  inhouse_test_id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted';
  test_deadline: string | null;
  assigned_at: string | null;
  admin_notes: string | null;
  article_name: string;
  article_number: string;
  material_type: string;
  color: string;
  result: string | null;
  result_data: Record<string, unknown> | null;
  submitted_at: string | null;
  is_periodic?: boolean | null;
  periodic_schedule_id?: string | null;
  periodic_run_number?: number | null;
  periodic_frequency_type?: string | null;
  periodic_frequency_value?: number | null;
  periodic_total_occurrences?: number | null;
  periodic_schedule_next_due?: string | null;
  periodic_schedule_status?: string | null;
  periodic_run_due_date?: string | null;
  periodic_schedule_notes?: string | null;
}

export default function TesterTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodicRuns, setPeriodicRuns] = useState<PeriodicRunRow[]>([]);
  const [periodicRunsLoading, setPeriodicRunsLoading] = useState(false);
  const [creatingNextCycle, setCreatingNextCycle] = useState(false);

  const getCurrentTesterId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      const parsedUser = JSON.parse(storedUser);
      return parsedUser?.id ? String(parsedUser.id) : null;
    } catch {
      return null;
    }
  };

  const fetchTestDetail = async (testId: string) => {
    setLoading(true);
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${testId}`, {
        headers: testerId ? { 'x-user-id': testerId } : {},
      });
      if (response.ok) {
        const testData = await response.json();
        setTest(testData);
      } else if (response.status === 404) {
        setError('Test not found or not assigned to you');
      } else {
        setError('Failed to fetch test details');
      }
    } catch {
      setError('Error loading test details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTestDetail(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (!test?.periodic_schedule_id) {
      setPeriodicRuns([]);
      return;
    }
    const tid = getCurrentTesterId();
    setPeriodicRunsLoading(true);
    fetch(`${API}/tester/periodic-schedules/${test.periodic_schedule_id}/runs`, {
      headers: tid ? { 'x-user-id': tid } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPeriodicRuns(Array.isArray(data) ? data : []))
      .catch(() => setPeriodicRuns([]))
      .finally(() => setPeriodicRunsLoading(false));
  }, [test?.periodic_schedule_id, test?.id, test?.status, test?.submitted_at]);

  const handleStartTest = async () => {
    if (!test) return;

    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${test.id}/start`, {
        method: 'POST',
        headers: testerId ? { 'x-user-id': testerId } : {},
      });
      
      if (response.ok) {
        setTest((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
      } else {
        alert('Failed to start test');
      }
    } catch {
      alert('Error starting test');
    }
  };

  const handleCreateNextPeriodicCycle = async () => {
    if (!test) return;
    try {
      setCreatingNextCycle(true);
      const tid = getCurrentTesterId();
      const res = await fetch(`${API}/tester/my-tests/${test.id}/advance-periodic`, {
        method: 'POST',
        headers: tid ? { 'x-user-id': tid } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to create next periodic cycle');
        return;
      }
      if (data.periodicNextTestId) {
        router.push(`/tester/tests/${data.periodicNextTestId}`);
        return;
      }
      alert(
        data.periodicScheduleEnded
          ? 'Periodic schedule has ended; no further cycles remain.'
          : 'No new periodic cycle created yet.'
      );
      fetchTestDetail(test.id);
    } catch {
      alert('Failed to create next periodic cycle');
    } finally {
      setCreatingNextCycle(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getDeadlineInfo = (deadline: string | null, status: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let color = 'text-black/70';
    let urgency = '';

    if (diffDays < 0 && status !== 'submitted') {
      color = 'text-black font-semibold';
      urgency = 'Overdue';
    } else if (diffDays <= 3) {
      color = 'text-green-800 font-medium';
      urgency = `${diffDays} days remaining`;
    } else if (diffDays <= 7) {
      color = 'text-black/80';
      urgency = `${diffDays} days remaining`;
    } else {
      urgency = `${diffDays} days remaining`;
    }

    return {
      color,
      urgency,
      formattedDate: deadlineDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
  };

  const formatAssignedDate = (assignedAt: string | null | undefined) => {
    if (!assignedAt) return 'Not on record';
    const d = new Date(assignedAt);
    if (Number.isNaN(d.getTime())) return 'Not on record';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-black/70">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="w-12 h-12 text-black mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">Test Not Found</h2>
          <p className="text-black/70 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/tester/dashboard')}
            className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
          >
            Back to My Tests
          </button>
        </div>
      </div>
    );
  }

  const deadlineInfo = getDeadlineInfo(test.test_deadline, test.status);
  const resultData = test.result_data && typeof test.result_data === 'object' ? test.result_data : null;
  const isPeriodic = !!(test.is_periodic || test.periodic_schedule_id);
  const periodicDueStr =
    test.periodic_run_due_date || test.periodic_schedule_next_due || test.test_deadline;
  const periodicDueInfo = periodicDueStr ? getDeadlineInfo(periodicDueStr, test.status) : null;
  /** Next cycle = different article_tests row that is still open (not this submitted one). Never use ptr.run status alone — it can stay "scheduled" after submit. */
  const nextPendingPeriodicRun =
    isPeriodic && test.status === 'submitted'
      ? [...periodicRuns]
          .filter((r) => r.article_test_id !== test.id)
          .filter((r) =>
            ['pending', 'assigned', 'in_progress'].includes(
              String(r.article_test_status || '').toLowerCase()
            )
          )
          .sort((a, b) => a.run_number - b.run_number)[0] ?? null
      : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-black/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => router.push('/tester/dashboard')}
                className="flex items-center space-x-2 text-black/70 hover:text-black"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to My Tests</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {isPeriodic && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border border-violet-400 bg-violet-100 text-violet-900">
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  PERIODIC
                </span>
              )}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(test.status)}`}>
                {test.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {isPeriodic && (
            <div className="rounded-lg border border-violet-300 bg-violet-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-violet-950 mb-3 flex items-center gap-2">
                <RotateCw className="h-5 w-5 text-violet-800" aria-hidden />
                Periodic testing
              </h2>
              <p className="text-sm text-violet-900 mb-4">
                This assignment is part of a repeating schedule. Complete and submit this run like any other test; the lab
                will plan the next run from the schedule.
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-violet-800/90">This run</dt>
                  <dd className="font-medium text-violet-950">
                    {typeof test.periodic_run_number === 'number' ? test.periodic_run_number : '—'}
                    {test.periodic_total_occurrences != null
                      ? ` of ${test.periodic_total_occurrences}`
                      : ' (ongoing)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-violet-800/90">Interval</dt>
                  <dd className="font-medium text-violet-950">
                    {test.periodic_frequency_value != null
                      ? `Every ${test.periodic_frequency_value} day${test.periodic_frequency_value === 1 ? '' : 's'}`
                      : '—'}
                    {test.periodic_frequency_type ? ` (${test.periodic_frequency_type})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-violet-800/90">Schedule status</dt>
                  <dd className="capitalize font-medium text-violet-950">
                    {test.periodic_schedule_status || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-violet-800/90">Due for this run</dt>
                  <dd className="font-medium text-violet-950">
                    {periodicDueStr ? (
                      <>
                        {periodicDueInfo?.formattedDate}
                        {periodicDueInfo?.urgency && (
                          <span className={`ml-2 text-xs ${periodicDueInfo.color}`}>
                            ({periodicDueInfo.urgency})
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
              {test.periodic_schedule_notes && (
                <div className="mt-4 rounded border border-violet-200 bg-white/80 p-3 text-sm text-violet-950">
                  <span className="font-medium text-violet-900">Notes from admin: </span>
                  {test.periodic_schedule_notes}
                </div>
              )}
            </div>
          )}

          {isPeriodic && test.periodic_schedule_id && (
            <div className="rounded-lg border border-violet-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-black mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-800" aria-hidden />
                All runs &amp; CoA reports (this schedule)
              </h2>
              <p className="text-sm text-black/70 mb-4">
                Each completed cycle has its own assignment and report. When you finish a run, the next cycle appears on
                your dashboard as a new assignment. Download past CoA documents here anytime.
              </p>
              {periodicRunsLoading ? (
                <p className="text-sm text-black/60">Loading run history…</p>
              ) : periodicRuns.length === 0 ? (
                <p className="text-sm text-black/60">No run rows found yet.</p>
              ) : (
                <div className="overflow-x-auto rounded border border-black/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/5 text-xs text-black/70">
                      <tr>
                        <th className="px-3 py-2">Run</th>
                        <th className="px-3 py-2">Due</th>
                        <th className="px-3 py-2">Run status</th>
                        <th className="px-3 py-2">Result</th>
                        <th className="px-3 py-2">CoA report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {periodicRuns.map((r) => (
                        <tr key={r.id} className={r.article_test_id === test.id ? 'bg-violet-50/80' : ''}>
                          <td className="px-3 py-2 font-medium text-black">
                            {r.run_number}
                            {r.article_test_id === test.id ? (
                              <span className="ml-2 text-xs font-normal text-violet-800">(this page)</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-black/80">{String(r.due_date).slice(0, 10)}</td>
                          <td className="px-3 py-2 capitalize text-black/80">{r.status}</td>
                          <td className="px-3 py-2">
                            {r.result ? (
                              <span className={r.result === 'PASS' ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                                {r.result}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {r.article_report_url ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const tid = getCurrentTesterId();
                                  const q = tid ? `?tester_id=${encodeURIComponent(tid)}` : '';
                                  window.open(`${API}/tester/my-tests/${r.article_test_id}/download-report${q}`, '_blank');
                                }}
                                className="inline-flex items-center gap-1 text-violet-800 hover:underline"
                              >
                                <Download className="h-4 w-4" />
                                {r.article_report_number || 'Download'}
                              </button>
                            ) : (
                              <span className="text-black/40">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg border border-black/10 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black mb-4">Test Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Library / mapping ID</label>
                <div className="text-sm font-mono bg-green-50/50 px-3 py-2 rounded border border-black/10 text-black">
                  {test.inhouse_test_id || '—'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Category</label>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    test.category === 'Finished Good' ? 'bg-green-100 text-black border-green-800/30' : 'bg-white text-black border-black/15'
                  }`}>
                    {test.category}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black/70 mb-1">Test Name</label>
                <div className="text-lg font-semibold text-black">{test.test_name}</div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black/70 mb-1">Standard Method</label>
                <div className="text-sm font-mono bg-green-50/50 px-3 py-2 rounded border border-black/10 text-black">
                  {test.test_standard}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-black/10 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black mb-4">Assignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Assigned on</label>
                <div className="text-sm text-black">{formatAssignedDate(test.assigned_at)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Deadline</label>
                <div className="text-sm">
                  {test.test_deadline ? (
                    <div>
                      <div className="font-medium text-black">
                        {deadlineInfo?.formattedDate}
                      </div>
                      <div className={`text-xs ${deadlineInfo?.color}`}>
                        {deadlineInfo?.urgency}
                      </div>
                    </div>
                  ) : (
                    <span className="text-black/60">No deadline set</span>
                  )}
                </div>
              </div>
              {test.admin_notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black/70 mb-1">Notes from admin</label>
                  <div className="text-sm text-black bg-green-50/50 p-3 rounded border border-black/10">
                    {test.admin_notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-black/10 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black mb-4">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Product Name</label>
                <div className="text-sm font-medium text-black">{test.article_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Article Number</label>
                <div className="text-sm font-mono bg-green-50/50 px-3 py-2 rounded border border-black/10 text-black">
                  {test.article_number}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Material Type</label>
                <div className="text-sm text-black">{test.material_type}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Color</label>
                <div className="text-sm text-black">{test.color}</div>
              </div>
            </div>
          </div>

          {test.status !== 'in_progress' && (
            <div className="bg-white rounded-lg border border-black/10 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-black mb-4">Client Requirement</h2>
              <div className="bg-green-50/50 p-4 rounded border border-green-800/20">
                <div className="text-sm text-black leading-relaxed whitespace-pre-wrap">
                  {test.client_requirement}
                </div>
              </div>
            </div>
          )}

          {test.status === 'submitted' && (
            <div className="rounded-lg border border-green-800/30 bg-green-50 p-6">
              <h2 className="text-lg font-semibold text-black mb-2">Submitted result</h2>
              <p className="text-2xl font-bold text-green-800">{test.result || '—'}</p>
              {test.submitted_at && (
                <p className="mt-2 text-sm text-black/80">
                  Submitted {new Date(test.submitted_at).toLocaleString()}
                </p>
              )}
              {resultData?.calculated_results != null && (
                <details className="mt-4 text-sm text-black">
                  <summary className="cursor-pointer font-medium">Calculation details</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-white p-3 text-xs text-black border border-black/10">
                    {JSON.stringify(resultData.calculated_results, null, 2)}
                  </pre>
                </details>
              )}
              {isPeriodic && periodicRunsLoading ? (
                <p className="mt-4 text-sm text-black/70">Checking for your next periodic assignment…</p>
              ) : nextPendingPeriodicRun ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/tester/tests/${nextPendingPeriodicRun.article_test_id}`)}
                    className="inline-flex items-center gap-2 rounded-md border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                  >
                    <RotateCw className="h-4 w-4" />
                    Go to next periodic run (Run {nextPendingPeriodicRun.run_number})
                  </button>
                </div>
              ) : isPeriodic ? (
                <div className="mt-4 space-y-2 rounded border border-violet-200 bg-white/90 p-3 text-sm text-violet-900">
                  <p>
                    The next cycle is not listed yet (or it is only visible on your list). Open <strong>My Tests</strong>{' '}
                    and look for the same test name with the next run number.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateNextPeriodicCycle}
                    disabled={creatingNextCycle}
                    className="inline-flex items-center gap-2 rounded-md border border-violet-500 bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                  >
                    <RotateCw className="h-4 w-4" />
                    {creatingNextCycle ? 'Creating next cycle…' : 'Create next cycle now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/tester/dashboard')}
                    className="inline-flex items-center gap-2 rounded-md border border-violet-400 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50"
                  >
                    Open My Tests
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {test.status === 'in_progress' && (
            <TesterResultEntry
              articleTestId={test.id}
              inhouseTestId={test.inhouse_test_id}
              testStandard={test.test_standard}
              clientRequirement={test.client_requirement}
              onSubmitted={(payload) => {
                if (payload?.periodicNextTestId) {
                  router.push(`/tester/tests/${payload.periodicNextTestId}`);
                  return;
                }
                fetchTestDetail(test.id);
              }}
            />
          )}

          <div className="bg-white rounded-lg border border-black/10 p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-black/70">
                Test Status:{' '}
                <span className="font-medium text-black">{test.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-3">
                {(test.status === 'pending' || test.status === 'assigned') && (
                  <button
                    type="button"
                    onClick={handleStartTest}
                    className="px-6 py-2 bg-green-700 text-white font-medium rounded-md hover:bg-green-800 flex items-center space-x-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start test</span>
                  </button>
                )}
                {test.status === 'submitted' && (
                  <div className="flex items-center space-x-2 text-green-800">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
