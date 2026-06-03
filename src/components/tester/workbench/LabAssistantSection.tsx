'use client';

import { Bell, Wrench } from 'lucide-react';
import type { AssignedTest, EquipmentItem } from '@/types/testerWorkbench';
import { effectiveDueDate, formatDueTime, isOverdue, shortSampleId } from '@/lib/testerWorkbenchUtils';

interface LabAssistantSectionProps {
  tests: AssignedTest[];
  equipment: EquipmentItem[];
  pendingSubmission: number;
}

export default function LabAssistantSection({
  tests,
  equipment,
  pendingSubmission,
}: LabAssistantSectionProps) {
  const deadlines = tests
    .filter((t) => t.status !== 'submitted' && effectiveDueDate(t))
    .sort((a, b) => {
      const da = effectiveDueDate(a)!;
      const db = effectiveDueDate(b)!;
      return new Date(da).getTime() - new Date(db).getTime();
    })
    .slice(0, 8);

  const runningEquipment = equipment.filter((e) => e.status === 'running');
  const waitingSubmit = tests.filter((t) => t.status === 'in_progress');

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AssistantCard title="Upcoming Deadlines" count={deadlines.length} icon={Bell}>
        {deadlines.length === 0 ? (
          <p className="text-sm text-black/45">All clear for now.</p>
        ) : (
          <ul className="space-y-2">
            {deadlines.map((test) => {
              const overdue = isOverdue(test);
              return (
                <li
                  key={test.id}
                  className={`rounded-lg border px-3 py-2.5 text-sm ${overdue ? 'border-black bg-black/[0.04]' : 'border-black/10 bg-white'}`}
                >
                  <p className="font-semibold text-black">{test.test_name}</p>
                  <p className="text-black/50">{shortSampleId(test)}</p>
                  <p
                    className={`mt-0.5 tabular-nums ${overdue ? 'font-bold text-black' : 'text-black/60'}`}
                  >
                    {formatDueTime(effectiveDueDate(test))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </AssistantCard>

      <AssistantCard title="Equipment Alerts" count={runningEquipment.length} icon={Wrench}>
        {runningEquipment.length === 0 ? (
          <p className="text-sm text-black/45">No equipment currently running.</p>
        ) : (
          <ul className="space-y-2">
            {runningEquipment.map((eq) => (
              <li
                key={eq.id}
                className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm"
              >
                <Wrench className="h-4 w-4 shrink-0 text-green-800" aria-hidden />
                <div>
                  <p className="font-semibold text-black">{eq.name}</p>
                  <p className="text-green-800">{eq.runningTestName}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AssistantCard>

      <AssistantCard title="Awaiting Submission" count={pendingSubmission}>
        {waitingSubmit.length === 0 ? (
          <p className="text-sm text-black/45">No tests waiting for results.</p>
        ) : (
          <ul className="space-y-2">
            {waitingSubmit.map((test) => (
              <li
                key={test.id}
                className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm"
              >
                <p className="font-semibold text-black">{test.test_name}</p>
                <p className="text-black/50">{test.client_name || '—'}</p>
              </li>
            ))}
          </ul>
        )}
      </AssistantCard>

      <AssistantCard title="Calibration Reminders" count={0}>
        <p className="text-sm text-black/45">
          No calibration alerts from active test assignments.
        </p>
      </AssistantCard>
    </div>
  );
}

function AssistantCard({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-green-700" aria-hidden />}
          <h3 className="text-sm font-semibold text-black">{title}</h3>
        </div>
        {count > 0 && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
