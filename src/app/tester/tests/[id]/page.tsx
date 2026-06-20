'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, AlertTriangle, RotateCw, Download, Play } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TesterResultEntry from '@/components/tester/TesterResultEntry';
import TesterReportActions from '@/components/tester/TesterReportActions';
import { getCurrentTesterId, getTesterReportDownloadUrl } from '@/lib/testerReportApi';
import type { PeriodicRunRow } from '@/components/clients/PeriodicScheduleDrawer';
import {
  AssignmentPanel,
  getDeadlineDisplay,
  LAB_CARD,
  PeriodicBadge,
  ProductInfoCard,
  ProgressTracker,
  StickyTestHeader,
  TestIdentityGrid,
} from '@/components/tester/TestExecutionWorkspace';

const API = publicApiUrl('/api');

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
  periodic_schedule_notes?: string | null;
}

export default function TesterTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodicRuns, setPeriodicRuns] = useState<PeriodicRunRow[]>([]);
  const [periodicRunsLoading, setPeriodicRunsLoading] = useState(false);
  const [creatingNextCycle, setCreatingNextCycle] = useState(false);

  const getCurrentTesterIdLocal = (): string | null => getCurrentTesterId();

  const fetchTestDetail = useCallback(async (testId: string) => {
    setLoading(true);
    try {
      const testerId = getCurrentTesterIdLocal();
      const response = await fetch(publicApiUrl(`/api/tester/my-tests/${testId}`), {
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
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchTestDetail(params.id as string);
    }
  }, [params.id, fetchTestDetail]);

  useEffect(() => {
    if (!test?.periodic_schedule_id) {
      setPeriodicRuns([]);
      return;
    }
    const tid = getCurrentTesterIdLocal();
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
      const testerId = getCurrentTesterIdLocal();
      const response = await fetch(publicApiUrl(`/api/tester/my-tests/${test.id}/start`), {
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
      const tid = getCurrentTesterIdLocal();
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

  const deadlineInfo = getDeadlineDisplay(test.test_deadline, test.status);
  const resultData = test.result_data && typeof test.result_data === 'object' ? test.result_data : null;
  const isPeriodic = !!(test.is_periodic || test.periodic_schedule_id);
  const periodicDueStr =
    test.periodic_run_due_date || test.periodic_schedule_next_due || test.test_deadline;
  const periodicDueInfo = periodicDueStr ? getDeadlineDisplay(periodicDueStr, test.status) : null;
  const technicianName = user?.name || 'Assigned technician';
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

  const sidebar = (
    <aside className="space-y-3 lg:sticky lg:top-[120px] lg:self-start">
      <AssignmentPanel
        assignedAt={formatAssignedDate(test.assigned_at)}
        deadline={test.test_deadline}
        deadlineInfo={deadlineInfo}
        technicianName={technicianName}
      />
      <ProductInfoCard
        articleName={test.article_name}
        articleNumber={test.article_number}
        material={test.material_type}
        color={test.color}
        productCategory={test.category}
      />
      <ProgressTracker status={test.status} />
      {test.admin_notes && (
        <div className={`${LAB_CARD} p-4`}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
            Admin Notes
          </h3>
          <p className="mt-2 text-sm text-[#111111]">{test.admin_notes}</p>
        </div>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      <StickyTestHeader
        testName={test.test_name}
        testStandard={test.test_standard}
        status={test.status}
        deadlineInfo={deadlineInfo}
        onBack={() => router.push('/tester/dashboard')}
        trailing={isPeriodic ? <PeriodicBadge /> : null}
      />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {isPeriodic && (
          <div className={`${LAB_CARD} mb-4 p-4`}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#111111]">
              <RotateCw className="h-4 w-4 text-[#2E7D32]" aria-hidden />
              Periodic testing
            </h2>
            <p className="mb-3 text-xs text-[#111111]/65">
              This assignment is part of a repeating schedule. Complete and submit this run like any
              other test; the lab will plan the next run from the schedule.
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-2 py-1.5">
                <dt className="text-[10px] uppercase text-[#111111]/45">This run</dt>
                <dd className="font-medium text-[#111111]">
                  {typeof test.periodic_run_number === 'number' ? test.periodic_run_number : '—'}
                  {test.periodic_total_occurrences != null
                    ? ` of ${test.periodic_total_occurrences}`
                    : ' (ongoing)'}
                </dd>
              </div>
              <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-2 py-1.5">
                <dt className="text-[10px] uppercase text-[#111111]/45">Interval</dt>
                <dd className="font-medium text-[#111111]">
                  {test.periodic_frequency_value != null
                    ? `Every ${test.periodic_frequency_value} day${test.periodic_frequency_value === 1 ? '' : 's'}`
                    : '—'}
                </dd>
              </div>
              <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-2 py-1.5">
                <dt className="text-[10px] uppercase text-[#111111]/45">Schedule</dt>
                <dd className="capitalize font-medium text-[#111111]">
                  {test.periodic_schedule_status || '—'}
                </dd>
              </div>
              <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-2 py-1.5">
                <dt className="text-[10px] uppercase text-[#111111]/45">Due this run</dt>
                <dd className="font-medium text-[#111111]">
                  {periodicDueInfo?.formattedDate ?? '—'}
                </dd>
              </div>
            </dl>
            {test.periodic_schedule_notes && (
              <p className="mt-3 rounded-lg border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-2 text-xs text-[#111111]">
                <span className="font-semibold text-[#1B5E20]">Admin: </span>
                {test.periodic_schedule_notes}
              </p>
            )}
          </div>
        )}

        {isPeriodic && test.periodic_schedule_id && (
          <div className={`${LAB_CARD} mb-4 p-4`}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#111111]">
              <FileText className="h-4 w-4 text-[#2E7D32]" aria-hidden />
              All runs &amp; CoA reports
            </h2>
            {periodicRunsLoading ? (
              <p className="text-xs text-[#111111]/60">Loading run history…</p>
            ) : periodicRuns.length === 0 ? (
              <p className="text-xs text-[#111111]/60">No run rows found yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#E0E0E0]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#E8F5E9] text-xs text-[#1B5E20]">
                    <tr>
                      <th className="px-3 py-2">Run</th>
                      <th className="px-3 py-2">Due</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">CoA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {periodicRuns.map((r) => (
                      <tr
                        key={r.id}
                        className={r.article_test_id === test.id ? 'bg-[#E8F5E9]/60' : ''}
                      >
                        <td className="px-3 py-2 font-medium text-[#111111]">
                          {r.run_number}
                          {r.article_test_id === test.id ? (
                            <span className="ml-2 text-xs font-normal text-[#2E7D32]">
                              (this page)
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-[#111111]/80">
                          {String(r.due_date).slice(0, 10)}
                        </td>
                        <td className="px-3 py-2 capitalize text-[#111111]/80">{r.status}</td>
                        <td className="px-3 py-2">
                          {r.result ? (
                            <span
                              className={
                                r.result === 'PASS'
                                  ? 'font-medium text-[#2E7D32]'
                                  : 'font-medium text-[#111111]'
                              }
                            >
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
                                window.open(
                                  getTesterReportDownloadUrl(r.article_test_id),
                                  '_blank'
                                );
                              }}
                              className="inline-flex items-center gap-1 text-[#2E7D32] hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              {r.article_report_number || 'Download'}
                            </button>
                          ) : (
                            <span className="text-[#111111]/40">—</span>
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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-3">
            {test.status !== 'in_progress' && (
              <TestIdentityGrid
                libraryId={test.inhouse_test_id || '—'}
                category={test.category}
                testName={test.test_name}
                testStandard={test.test_standard}
                clientRequirement={test.client_requirement}
              />
            )}

            {test.status === 'submitted' && (
              <div className={`${LAB_CARD} p-4`}>
                <h2 className="text-sm font-semibold text-[#111111]">Submitted result</h2>
                <p className="mt-1 text-3xl font-bold text-[#2E7D32]">{test.result || '—'}</p>
                {test.submitted_at && (
                  <p className="mt-1 text-xs text-[#111111]/65">
                    Submitted {new Date(test.submitted_at).toLocaleString()}
                  </p>
                )}
                <div className="mt-4 border-t border-[#E0E0E0] pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#111111]/50">
                    Test report
                  </h3>
                  <TesterReportActions
                    testId={test.id}
                    status={test.status}
                    reportUrl={test.report_url}
                    reportGeneratedAt={test.report_generated_at}
                    onReportGenerated={() => fetchTestDetail(test.id)}
                  />
                  {test.report_generated_at && (
                    <p className="mt-2 text-xs text-[#111111]/55">
                      Last generated {new Date(test.report_generated_at).toLocaleString()}
                      {test.report_number ? ` · ${test.report_number}` : ''}
                    </p>
                  )}
                </div>
                {resultData?.calculated_results != null && (
                  <details className="mt-3 text-sm text-[#111111]">
                    <summary className="cursor-pointer font-medium">Calculation details</summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-xs">
                      {JSON.stringify(resultData.calculated_results, null, 2)}
                    </pre>
                  </details>
                )}
                {isPeriodic && periodicRunsLoading ? (
                  <p className="mt-3 text-xs text-[#111111]/65">
                    Checking for your next periodic assignment…
                  </p>
                ) : nextPendingPeriodicRun ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/tester/tests/${nextPendingPeriodicRun.article_test_id}`)
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B5E20]"
                  >
                    <RotateCw className="h-4 w-4" />
                    Next periodic run (Run {nextPendingPeriodicRun.run_number})
                  </button>
                ) : isPeriodic ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-[#C8E6C9] bg-[#E8F5E9] p-3 text-xs text-[#111111]">
                    <p>
                      The next cycle may appear on <strong>My Tests</strong> with the next run
                      number.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCreateNextPeriodicCycle}
                        disabled={creatingNextCycle}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-3 py-2 text-sm font-medium text-white hover:bg-[#1B5E20] disabled:opacity-60"
                      >
                        <RotateCw className="h-4 w-4" />
                        {creatingNextCycle ? 'Creating…' : 'Create next cycle'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/tester/dashboard')}
                        className="rounded-lg border border-[#C8E6C9] bg-white px-3 py-2 text-sm font-medium text-[#111111] hover:bg-[#E8F5E9]"
                      >
                        My Tests
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {test.status === 'in_progress' && (
              <>
                <TestIdentityGrid
                  libraryId={test.inhouse_test_id || '—'}
                  category={test.category}
                  testName={test.test_name}
                  testStandard={test.test_standard}
                  clientRequirement={test.client_requirement}
                />
                <TesterResultEntry
                  articleTestId={test.id}
                  inhouseTestId={test.inhouse_test_id}
                  testStandard={test.test_standard}
                  clientRequirement={test.client_requirement}
                  hideClientRequirement
                  onSubmitted={(payload) => {
                    if (payload?.periodicNextTestId) {
                      router.push(`/tester/tests/${payload.periodicNextTestId}`);
                      return;
                    }
                    fetchTestDetail(test.id);
                  }}
                />
              </>
            )}

            {(test.status === 'pending' || test.status === 'assigned') && (
              <div className={`${LAB_CARD} p-4`}>
                <p className="text-sm text-[#111111]/70">
                  Start the test to open the laboratory worksheet, enter measurements, upload
                  evidence, and submit results.
                </p>
              </div>
            )}
          </div>

          {sidebar}
        </div>
      </main>

      {test.status !== 'in_progress' && (
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E0E0E0] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6">
          {(test.status === 'pending' || test.status === 'assigned') && (
            <button
              type="button"
              onClick={handleStartTest}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B5E20] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2E7D32]"
            >
              <Play className="h-4 w-4" aria-hidden />
              Start Test
            </button>
          )}
          {test.status === 'submitted' && (
            <TesterReportActions
              testId={test.id}
              status={test.status}
              reportUrl={test.report_url}
              reportGeneratedAt={test.report_generated_at}
              onReportGenerated={() => fetchTestDetail(test.id)}
            />
          )}
          {test.status === 'submitted' && (
            <span className="mr-auto flex items-center gap-2 text-sm font-medium text-[#2E7D32]">
              <FileText className="h-4 w-4" aria-hidden />
              Completed
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
