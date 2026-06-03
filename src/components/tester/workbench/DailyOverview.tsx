'use client';

import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Send } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import type { TestsStatusFilter } from '@/lib/workbenchSections';
import type { WorkbenchMetrics } from '@/types/testerWorkbench';

interface DailyOverviewProps {
  metrics: WorkbenchMetrics;
  onFilterClick?: (filter: TestsStatusFilter) => void;
}

export default function DailyOverview({ metrics, onFilterClick }: DailyOverviewProps) {
  const navigate = onFilterClick;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
        Today&apos;s Workload
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title="Pending"
          value={metrics.pending}
          icon={ClipboardList}
          accent="green"
          subtitle="Not started yet"
          onClick={navigate ? () => navigate('pending') : undefined}
        />
        <MetricCard
          title="In Progress"
          value={metrics.inProgress}
          icon={Loader2}
          accent="green"
          subtitle="Currently running"
          onClick={navigate ? () => navigate('in_progress') : undefined}
        />
        <MetricCard
          title="Awaiting Submit"
          value={metrics.pendingSubmission}
          icon={Send}
          accent="green"
          subtitle="Need result entry"
          onClick={navigate ? () => navigate('in_progress') : undefined}
        />
        <MetricCard
          title="Submitted"
          value={metrics.submitted}
          icon={CheckCircle2}
          accent="green"
          subtitle="Completed reports"
          onClick={navigate ? () => navigate('submitted') : undefined}
        />
        <MetricCard
          title="Overdue"
          value={metrics.overdue}
          icon={AlertTriangle}
          accent="green"
          subtitle="Requires attention"
          onClick={navigate ? () => navigate('overdue') : undefined}
        />
      </div>
    </section>
  );
}
