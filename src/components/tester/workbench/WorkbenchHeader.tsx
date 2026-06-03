'use client';

import { Activity, Clock } from 'lucide-react';
import type { WorkbenchMetrics } from '@/types/testerWorkbench';

interface WorkbenchHeaderProps {
  testerName: string;
  shift: string;
  currentTime: Date;
  labStatus: { label: string; tone: 'green' | 'black' | 'neutral' };
  metrics: WorkbenchMetrics;
}

const toneStyles = {
  green: 'bg-green-100 text-green-800 border-green-300',
  black: 'bg-black text-white border-black',
  neutral: 'bg-white text-black border-black/20',
};

export default function WorkbenchHeader({
  testerName,
  shift,
  currentTime,
  labStatus,
  metrics,
}: WorkbenchHeaderProps) {
  return (
    <header className="shrink-0 border-b border-black/10 bg-white shadow-sm">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 pl-12 lg:flex-row lg:items-center lg:justify-between lg:pl-0">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-black sm:text-xl">
              Tester Workbench
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/60">
              <span className="font-medium text-black/80">{testerName}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{shift}</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline">
                {currentTime.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="h-3 w-3" aria-hidden />
                {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneStyles[labStatus.tone]}`}
              >
                <Activity className="h-3 w-3" aria-hidden />
                {labStatus.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <HeaderMetric label="Due Today" value={metrics.dueToday} variant="green" />
            <HeaderMetric label="Running" value={metrics.running} variant="green-dark" />
            <HeaderMetric label="Pending" value={metrics.pending} variant="outline" />
            <HeaderMetric label="Overdue" value={metrics.overdue} variant="black" />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderMetric({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'green' | 'green-dark' | 'outline' | 'black';
}) {
  const colors = {
    green: 'border-green-200 bg-green-50 text-green-800',
    'green-dark': 'border-green-700 bg-green-700 text-white',
    outline: 'border-black/20 bg-white text-black',
    black: 'border-black bg-black text-white',
  };
  return (
    <div className={`rounded-lg border px-2 py-1.5 text-center sm:px-3 sm:py-2 ${colors[variant]}`}>
      <div className="text-base font-bold tabular-nums leading-none sm:text-lg">{value}</div>
      <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wide opacity-80 sm:text-[10px]">
        {label}
      </div>
    </div>
  );
}
