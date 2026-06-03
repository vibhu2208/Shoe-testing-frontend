'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AssignedTest,
  TestDetailEnrichment,
  WorkbenchSectionId,
} from '@/types/testerWorkbench';
import {
  buildActivityFeed,
  buildEquipmentStatus,
  buildWorkflowSteps,
  computeMetrics,
  getCurrentShift,
  getLabStatus,
  getPriorityQueue,
  selectDefaultActiveTest,
} from '@/lib/testerWorkbenchUtils';
import {
  isTestsStatusFilter,
  isWorkbenchSectionId,
  type TestsStatusFilter,
} from '@/lib/workbenchSections';
import WorkbenchHeader from '@/components/tester/workbench/WorkbenchHeader';
import WorkbenchSidebar from '@/components/tester/workbench/WorkbenchSidebar';
import WorkbenchSectionShell from '@/components/tester/workbench/WorkbenchSectionShell';
import DailyOverview from '@/components/tester/workbench/DailyOverview';
import PriorityQueue from '@/components/tester/workbench/PriorityQueue';
import ActiveTestWorkbench from '@/components/tester/workbench/ActiveTestWorkbench';
import KanbanBoard from '@/components/tester/workbench/KanbanBoard';
import SampleEquipmentRow from '@/components/tester/workbench/SampleEquipmentRow';
import ScheduleActivityRow from '@/components/tester/workbench/ScheduleActivityRow';
import LabAssistantSection from '@/components/tester/workbench/LabAssistantSection';
import AllTestsList from '@/components/tester/workbench/AllTestsList';

function getCurrentTesterId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    const parsedUser = JSON.parse(storedUser);
    return parsedUser?.id ? String(parsedUser.id) : null;
  } catch {
    return null;
  }
}

export default function TesterDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, user } = useAuth();
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [enrichments, setEnrichments] = useState<Record<string, TestDetailEnrichment>>({});
  const [pausedTests, setPausedTests] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const sectionParam = searchParams.get('section');
  const activeSection: WorkbenchSectionId = isWorkbenchSectionId(sectionParam)
    ? sectionParam
    : 'overview';

  const filterParam = searchParams.get('filter');
  const testsStatusFilter: TestsStatusFilter = isTestsStatusFilter(filterParam)
    ? filterParam
    : 'all';

  const setActiveSection = (
    section: WorkbenchSectionId,
    options?: { filter?: TestsStatusFilter }
  ) => {
    const params = new URLSearchParams();
    params.set('section', section);
    if (section === 'all-tests' && options?.filter && options.filter !== 'all') {
      params.set('filter', options.filter);
    }
    router.replace(`/tester/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleTestsStatusFilterChange = (filter: TestsStatusFilter) => {
    setActiveSection('all-tests', { filter });
  };

  const handleOverviewFilterClick = (filter: TestsStatusFilter) => {
    setActiveSection('all-tests', { filter });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const fetchAssignedTests = useCallback(async () => {
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(publicApiUrl('/api/tester/my-tests'), {
        headers: testerId ? { 'x-user-id': testerId } : {},
      });
      if (response.ok) {
        const testsData: AssignedTest[] = await response.json();
        setTests(testsData);
        setActiveTestId((prev) => {
          if (prev && testsData.some((t) => t.id === prev)) return prev;
          return selectDefaultActiveTest(testsData)?.id ?? null;
        });
      }
    } catch (error) {
      console.error('Error fetching assigned tests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedTests();
  }, [fetchAssignedTests]);

  useEffect(() => {
    const submitted = tests.filter((t) => t.status === 'submitted');
    const inProgress = tests.filter((t) => t.status === 'in_progress');
    const toFetch = [...submitted.slice(0, 20), ...inProgress];
    if (toFetch.length === 0) return;

    const testerId = getCurrentTesterId();
    let cancelled = false;

    Promise.all(
      toFetch.map(async (test) => {
        try {
          const res = await fetch(publicApiUrl(`/api/tester/my-tests/${test.id}`), {
            headers: testerId ? { 'x-user-id': testerId } : {},
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: test.id,
            detail: {
              result: data.result,
              result_data: data.result_data,
              submitted_at: data.submitted_at,
            } as TestDetailEnrichment,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, TestDetailEnrichment> = {};
      for (const r of results) {
        if (r) next[r.id] = r.detail;
      }
      setEnrichments((prev) => ({ ...prev, ...next }));
    });

    return () => {
      cancelled = true;
    };
  }, [tests]);

  const activeTest = useMemo(
    () => tests.find((t) => t.id === activeTestId) ?? null,
    [tests, activeTestId]
  );

  const metrics = useMemo(() => computeMetrics(tests), [tests]);
  const priorityQueue = useMemo(() => getPriorityQueue(tests), [tests]);
  const equipment = useMemo(() => buildEquipmentStatus(tests), [tests]);
  const activity = useMemo(() => buildActivityFeed(tests, enrichments), [tests, enrichments]);
  const labStatus = useMemo(() => getLabStatus(tests), [tests]);

  const sidebarBadges = useMemo(
    (): Partial<Record<WorkbenchSectionId, number>> => ({
      overview: metrics.overdue,
      'all-tests': tests.length,
      workbench: metrics.inProgress,
      assistant: metrics.overdue + metrics.pendingSubmission,
      pipeline: metrics.pending + metrics.inProgress,
    }),
    [metrics, tests.length]
  );

  const workflowSteps = useMemo(
    () => (activeTest ? buildWorkflowSteps(activeTest, false) : []),
    [activeTest]
  );

  const samplePhotoUrl = useMemo(() => {
    if (!activeTest) return null;
    const detail = enrichments[activeTest.id];
    const photos = detail?.result_data?.photos;
    if (Array.isArray(photos) && photos.length > 0) {
      const first = photos[0] as { url?: string };
      return first.url || null;
    }
    return null;
  }, [activeTest, enrichments]);

  const handleSelectTest = (test: AssignedTest, navigateTo: WorkbenchSectionId = 'workbench') => {
    setActiveTestId(test.id);
    setActiveSection(navigateTo);
  };

  const handleStartTest = async (testId?: string) => {
    const id = testId || activeTest?.id;
    if (!id) return;
    setActionLoading(true);
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(publicApiUrl(`/api/tester/my-tests/${id}/start`), {
        method: 'POST',
        headers: testerId ? { 'x-user-id': testerId } : {},
      });
      if (response.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'in_progress' as const } : t))
        );
        setActiveTestId(id);
        setActiveSection('workbench');
        setPausedTests((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        alert('Failed to start test');
      }
    } catch {
      alert('Error starting test');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = () => {
    if (!activeTest) return;
    setPausedTests((prev) => new Set(prev).add(activeTest.id));
  };

  const handleResume = () => {
    if (!activeTest) return;
    setPausedTests((prev) => {
      const next = new Set(prev);
      next.delete(activeTest.id);
      return next;
    });
  };

  const handleGenerateReport = async () => {
    if (!activeTest) return;
    try {
      const response = await fetch(publicApiUrl(`/api/reports/generate/${activeTest.id}`), {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to generate report');
        return;
      }
      await fetchAssignedTests();
      alert('Report generated successfully');
    } catch {
      alert('Failed to generate report');
    }
  };

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  const testerName = user?.name || 'Technician';
  const mainOffsetClass = sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64';

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            <DailyOverview metrics={metrics} onFilterClick={handleOverviewFilterClick} />
            {tests.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSection('all-tests')}
                  className="text-sm font-semibold text-green-800 hover:underline"
                >
                  View all {tests.length} assigned tests →
                </button>
              </div>
            )}
            <PriorityQueue
              tests={priorityQueue}
              selectedId={activeTestId}
              onSelect={(t) => handleSelectTest(t, 'workbench')}
            />
          </>
        );
      case 'all-tests':
        return (
          <AllTestsList
            tests={tests}
            selectedId={activeTestId}
            statusFilter={testsStatusFilter}
            onStatusFilterChange={handleTestsStatusFilterChange}
            onSelect={(t) => handleSelectTest(t, 'workbench')}
            onStartTest={handleStartTest}
            onOpenDetail={(id) => router.push(`/tester/tests/${id}`)}
          />
        );
      case 'workbench':
        return (
          <>
            <ActiveTestWorkbench
              test={activeTest}
              testerName={testerName}
              workflowSteps={workflowSteps}
              isPaused={activeTest ? pausedTests.has(activeTest.id) : false}
              actionLoading={actionLoading}
              onStart={() => handleStartTest()}
              onPause={handlePause}
              onResume={handleResume}
              onOpenTestDetail={
                activeTest ? () => router.push(`/tester/tests/${activeTest.id}`) : undefined
              }
              onGenerateReport={handleGenerateReport}
            />
          </>
        );
      case 'pipeline':
        return (
          <KanbanBoard
            tests={tests}
            selectedId={activeTestId}
            onSelect={(t) => handleSelectTest(t, 'workbench')}
            onMoveToInProgress={handleStartTest}
          />
        );
      case 'samples':
        return (
          <SampleEquipmentRow
            test={activeTest}
            equipment={equipment}
            samplePhotoUrl={samplePhotoUrl}
          />
        );
      case 'schedule':
        return (
          <ScheduleActivityRow
            tests={tests}
            activity={activity}
            onSelectTest={(t) => handleSelectTest(t, 'workbench')}
          />
        );
      case 'assistant':
        return (
          <LabAssistantSection
            tests={tests}
            equipment={equipment}
            pendingSubmission={metrics.pendingSubmission}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-green-600 border-t-transparent" />
          <p className="text-black/70">Loading laboratory workbench…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-white">
      <WorkbenchSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        badges={sidebarBadges}
        mobileOpen={sidebarOpen}
        onMobileOpenChange={setSidebarOpen}
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleSidebarCollapsedChange}
        testerName={testerName}
        onLogout={logout}
      />

      <div
        className={`flex h-screen flex-col overflow-hidden transition-[margin-left] duration-200 ease-in-out ${mainOffsetClass}`}
      >
        <WorkbenchHeader
          testerName={testerName}
          shift={getCurrentShift()}
          currentTime={currentTime}
          labStatus={labStatus}
          metrics={metrics}
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            className={`mx-auto ${activeSection === 'workbench' ? 'max-w-5xl' : 'max-w-6xl'}`}
          >
            <WorkbenchSectionShell sectionId={activeSection}>{renderSection()}</WorkbenchSectionShell>
          </div>
        </main>
      </div>
    </div>
  );
}
