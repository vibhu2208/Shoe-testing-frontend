'use client';

import { CheckCircle2, Play } from 'lucide-react';
import TesterResultEntry from '@/components/tester/TesterResultEntry';
import type { AssignedTest } from '@/types/testerWorkbench';
import { isPendingStatus } from '@/lib/testerWorkbenchUtils';

interface TestExecutionPanelProps {
  test: AssignedTest | null;
  onStartTest: () => void;
  onSubmitted: (payload?: {
    periodicNextTestId?: string | null;
    periodicScheduleEnded?: boolean;
  }) => void;
  startLoading?: boolean;
}

export default function TestExecutionPanel({
  test,
  onStartTest,
  onSubmitted,
  startLoading,
}: TestExecutionPanelProps) {
  if (!test) {
    return (
      <div className="rounded-xl border border-dashed border-[#C8E6C9] bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="font-medium text-[#111111]">No test selected</p>
        <p className="mt-1 text-sm text-[#111111]/50">
          Choose a test from <strong>All Tests</strong> or the priority queue, then return here to
          enter measurements.
        </p>
      </div>
    );
  }

  if (isPendingStatus(test.status)) {
    return (
      <div className="rounded-xl border border-[#E0E0E0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="text-base font-semibold text-[#111111]">{test.test_name}</h3>
        <p className="mt-0.5 font-mono text-xs text-[#2E7D32]">
          {test.inhouse_test_id} · {test.test_standard}
        </p>
        <p className="mt-3 text-sm text-[#111111]/70">
          Start the test to open the laboratory worksheet and input fields for this method.
        </p>
        <button
          type="button"
          onClick={onStartTest}
          disabled={startLoading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B5E20] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2E7D32] disabled:opacity-60"
        >
          <Play className="h-4 w-4" aria-hidden />
          {startLoading ? 'Starting…' : 'Start Test & Open Form'}
        </button>
      </div>
    );
  }

  if (test.status === 'submitted') {
    return (
      <div className="rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] p-5">
        <div className="flex items-center gap-2 text-[#1B5E20]">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          <p className="font-semibold text-[#111111]">Results submitted for {test.test_name}</p>
        </div>
        <p className="mt-2 text-sm text-[#111111]/60">
          This test is complete. Select another test or view it under Submitted in All Tests.
        </p>
      </div>
    );
  }

  if (test.status === 'in_progress') {
    return (
      <TesterResultEntry
        articleTestId={test.id}
        inhouseTestId={test.inhouse_test_id}
        testStandard={test.test_standard}
        clientRequirement={test.client_requirement}
        onSubmitted={onSubmitted}
      />
    );
  }

  return null;
}
