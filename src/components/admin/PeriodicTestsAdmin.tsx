'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import PeriodicScheduleDrawer from '@/components/clients/PeriodicScheduleDrawer';

const API = publicApiUrl('/api');

interface ScheduleListRow {
  id: string;
  frequency_type: string;
  frequency_value: number;
  total_occurrences: number | null;
  completed_occurrences: number;
  next_due_date: string | null;
  schedule_status: string;
  is_active: boolean;
  test_name: string | null;
  client_name?: string;
  article_number?: string;
  article_name?: string;
}

export default function PeriodicTestsAdmin() {
  const [rows, setRows] = useState<ScheduleListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/periodic/schedules`);
      if (!res.ok) throw new Error('Failed to load schedules');
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Periodic tests</h1>
            <p className="mt-1 text-sm text-slate-600">
              All periodic schedules across clients. Open a row to pause, resume, or end a schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RotateCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading && <p className="p-8 text-center text-sm text-slate-600">Loading…</p>}
          {error && <p className="p-8 text-center text-sm text-red-600">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-600">No periodic schedules yet.</p>
          )}
          {!loading && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Runs</th>
                    <th className="px-4 py-3">Next due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800">{r.client_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.article_number ? (
                          <span>
                            {r.article_number}
                            {r.article_name ? ` — ${r.article_name}` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.test_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        Every {r.frequency_value}d ({r.frequency_type})
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.completed_occurrences}
                        {r.total_occurrences != null ? ` / ${r.total_occurrences}` : ' — ongoing'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.next_due_date ? String(r.next_due_date).slice(0, 10) : '—'}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-700">{r.schedule_status}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDrawerId(r.id)}
                          className="rounded-md border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-50"
                        >
                          View schedule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PeriodicScheduleDrawer
        scheduleId={drawerId}
        onClose={() => setDrawerId(null)}
        onUpdated={load}
      />
    </div>
  );
}
