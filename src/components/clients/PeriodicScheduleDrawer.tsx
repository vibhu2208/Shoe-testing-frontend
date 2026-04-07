'use client';

import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

const API = 'http://localhost:5000/api';

export interface PeriodicScheduleRow {
  id: string;
  frequency_type: string;
  frequency_value: number;
  total_occurrences: number | null;
  completed_occurrences: number;
  next_due_date: string | null;
  schedule_start_date: string;
  alert_days_before: number;
  assigned_tester_id: number | null;
  is_active: boolean;
  schedule_status: string;
  test_name: string | null;
  client_name?: string;
  article_number?: string;
  article_name?: string;
}

export interface PeriodicRunRow {
  id: string;
  run_number: number;
  article_test_id: string;
  due_date: string;
  status: string;
  result: string | null;
  assigned_tester_id: number | null;
  tester_name?: string | null;
  report_url?: string | null;
  article_report_url?: string | null;
  article_report_number?: string | null;
  article_report_generated_at?: string | null;
  article_test_status?: string | null;
}

interface PeriodicScheduleDrawerProps {
  scheduleId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function PeriodicScheduleDrawer({ scheduleId, onClose, onUpdated }: PeriodicScheduleDrawerProps) {
  const [schedule, setSchedule] = useState<PeriodicScheduleRow | null>(null);
  const [runs, setRuns] = useState<PeriodicRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!scheduleId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [sRes, rRes] = await Promise.all([
          fetch(`${API}/periodic/schedules/${scheduleId}/detail`),
          fetch(`${API}/periodic/schedules/${scheduleId}/runs`)
        ]);
        if (!sRes.ok) throw new Error('Failed to load schedule');
        const sData = await sRes.json();
        const rData = rRes.ok ? await rRes.json() : [];
        if (!cancelled) {
          setSchedule(sData);
          setRuns(Array.isArray(rData) ? rData : []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);

  const patchSchedule = async (body: { scheduleStatus?: string; isActive?: boolean }) => {
    if (!scheduleId) return;
    const res = await fetch(`${API}/periodic/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Update failed');
      return;
    }
    onUpdated();
    onClose();
  };

  const handlePause = () => {
    if (!confirm('Pause this schedule? New runs and alerts will stop until resumed.')) return;
    patchSchedule({ scheduleStatus: 'paused', isActive: false });
  };

  const handleResume = () => {
    patchSchedule({ scheduleStatus: 'active', isActive: true });
  };

  const handleEnd = () => {
    if (!confirm('End this schedule permanently after the current state?')) return;
    patchSchedule({ scheduleStatus: 'ended', isActive: false });
  };

  if (!scheduleId) return null;

  return (
    <div className="fixed inset-0 z-[70] flex">
      <button type="button" className="flex-1 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Periodic schedule — {schedule?.test_name || '…'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && <p className="p-5 text-sm text-slate-600">Loading…</p>}
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {!loading && schedule && (
          <div className="space-y-6 p-5 text-sm text-slate-800">
            <section>
              <h3 className="mb-2 font-medium text-slate-900">Schedule overview</h3>
              <dl className="space-y-1 text-slate-600">
                <div>
                  <dt className="text-slate-500">Client</dt>
                  <dd>{schedule.client_name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Article</dt>
                  <dd>
                    {schedule.article_number} — {schedule.article_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Frequency</dt>
                  <dd>
                    Every {schedule.frequency_value} days ({schedule.frequency_type})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Runs</dt>
                  <dd>
                    {schedule.completed_occurrences} completed
                    {schedule.total_occurrences != null
                      ? ` of ${schedule.total_occurrences}`
                      : ' — ongoing'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Next due</dt>
                  <dd>{schedule.next_due_date?.slice(0, 10) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="capitalize">{schedule.schedule_status}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 font-medium text-slate-900">Run history</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-2 py-2">Run</th>
                      <th className="px-2 py-2">Due</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Tester</th>
                      <th className="px-2 py-2">Result</th>
                      <th className="px-2 py-2">CoA report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {runs.map((r) => (
                      <tr key={r.id}>
                        <td className="px-2 py-2">{r.run_number}</td>
                        <td className="px-2 py-2">{String(r.due_date).slice(0, 10)}</td>
                        <td className="px-2 py-2 capitalize">{r.status}</td>
                        <td className="px-2 py-2">{r.tester_name || '—'}</td>
                        <td className="px-2 py-2">
                          {r.result ? (
                            <span className={r.result === 'PASS' ? 'text-green-700' : 'text-red-600'}>{r.result}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {r.article_report_url ? (
                            <a
                              href={`${API}/article-tests/${r.article_test_id}/download-report`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-violet-600 hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              {r.article_report_number || 'Download'}
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              {schedule.schedule_status === 'active' && schedule.is_active && (
                <button
                  type="button"
                  onClick={handlePause}
                  className="rounded-lg border border-amber-600 px-3 py-2 text-xs text-amber-800 hover:bg-amber-50"
                >
                  Pause schedule
                </button>
              )}
              {schedule.schedule_status === 'paused' && (
                <button
                  type="button"
                  onClick={handleResume}
                  className="rounded-lg border border-green-600 px-3 py-2 text-xs text-green-800 hover:bg-green-50"
                >
                  Resume schedule
                </button>
              )}
              {schedule.schedule_status !== 'ended' && (
                <button
                  type="button"
                  onClick={handleEnd}
                  className="rounded-lg border border-red-600 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                >
                  End schedule
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
