'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

const API = publicApiUrl('/api');

export type FrequencyType = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'custom';

interface TestContext {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
}

interface PeriodicScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleTest: TestContext;
  defaultTesterId?: string | null;
  testers: Array<{ id: string; name: string; department: string }>;
  onSaved: () => void;
}

function intervalDaysLabel(type: FrequencyType, customDays: number): number {
  switch (type) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'fortnightly':
      return 14;
    case 'monthly':
      return 30;
    case 'quarterly':
      return 90;
    case 'custom':
      return Math.min(365, Math.max(1, customDays));
    default:
      return 7;
  }
}

export default function PeriodicScheduleModal({
  isOpen,
  onClose,
  articleTest,
  defaultTesterId,
  testers,
  onSaved
}: PeriodicScheduleModalProps) {
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('monthly');
  const [customDays, setCustomDays] = useState(30);
  const [occurrenceMode, setOccurrenceMode] = useState<'fixed' | 'indefinite'>('indefinite');
  const [totalOccurrences, setTotalOccurrences] = useState(12);
  const [scheduleStartDate, setScheduleStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [alertDaysBefore, setAlertDaysBefore] = useState(3);
  const [assignedTesterId, setAssignedTesterId] = useState<string>(defaultTesterId || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const everyDays = useMemo(() => intervalDaysLabel(frequencyType, customDays), [frequencyType, customDays]);

  const frequencyPreview = useMemo(() => {
    if (frequencyType === 'custom') {
      return `This test will be performed every ${everyDays} days.`;
    }
    const labels: Record<string, string> = {
      daily: 'every day',
      weekly: 'every 7 days',
      fortnightly: 'every 14 days',
      monthly: 'every 30 days',
      quarterly: 'every 90 days',
      custom: `every ${everyDays} days`
    };
    return `This test will be performed ${labels[frequencyType] || 'on the selected interval'}.`;
  }, [frequencyType, everyDays]);

  const firstAlertDate = useMemo(() => {
    const d = new Date(`${scheduleStartDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - alertDaysBefore);
    return d.toISOString().slice(0, 10);
  }, [scheduleStartDate, alertDaysBefore]);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        articleTestId: articleTest.id,
        frequencyType,
        scheduleStartDate,
        alertDaysBefore,
        assignedTesterId: assignedTesterId ? parseInt(assignedTesterId, 10) : null,
        notes: notes.trim() || null,
        indefinite: occurrenceMode === 'indefinite'
      };
      if (frequencyType === 'custom') {
        body.frequencyValue = customDays;
      }
      if (occurrenceMode === 'fixed') {
        body.totalOccurrences = Math.max(1, totalOccurrences);
      }

      const res = await fetch(`${API}/periodic/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save schedule');
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const testerName = testers.find((t) => t.id === assignedTesterId)?.name || '—';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Set periodic testing schedule — {articleTest.test_name}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-4 text-slate-900">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-800">Schedule overview</p>
            <p className="mt-1 text-slate-600">
              <span className="text-slate-500">Standard:</span> {articleTest.test_standard || '—'}
            </p>
            <p className="mt-1 text-slate-600">
              <span className="text-slate-500">Client requirement:</span> {articleTest.client_requirement || '—'}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">How often should this test be performed?</label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value as FrequencyType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (every 7 days)</option>
              <option value="fortnightly">Fortnightly (every 14 days)</option>
              <option value="monthly">Monthly (every 30 days)</option>
              <option value="quarterly">Quarterly (every 90 days)</option>
              <option value="custom">Custom</option>
            </select>
            {frequencyType === 'custom' && (
              <div className="mt-2">
                <label className="text-xs text-slate-600">Every X days (1–365)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}
            <p className="mt-2 text-xs text-slate-600">{frequencyPreview}</p>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">How many times should this test be performed?</span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="occ"
                  checked={occurrenceMode === 'fixed'}
                  onChange={() => setOccurrenceMode('fixed')}
                />
                Fixed number
              </label>
              {occurrenceMode === 'fixed' && (
                <input
                  type="number"
                  min={1}
                  value={totalOccurrences}
                  onChange={(e) => setTotalOccurrences(parseInt(e.target.value, 10) || 1)}
                  className="ml-6 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="occ"
                  checked={occurrenceMode === 'indefinite'}
                  onChange={() => setOccurrenceMode('indefinite')}
                />
                Indefinite (until stopped manually)
              </label>
            </div>
            {occurrenceMode === 'fixed' && (
              <p className="mt-1 text-xs text-slate-500">
                Example: {totalOccurrences} runs total (approx. {everyDays * totalOccurrences} days if evenly spaced).
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">First run due date</label>
            <input
              type="date"
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-600">First test due on {scheduleStartDate}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Alert tester how many days before due date?</label>
            <input
              type="number"
              min={1}
              max={30}
              value={alertDaysBefore}
              onChange={(e) => setAlertDaysBefore(Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-600">
              Tester alert date for first run (in-app): {firstAlertDate} (informational; email not wired yet).
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Assign tester for all runs (default)</label>
            <select
              value={assignedTesterId}
              onChange={(e) => setAssignedTesterId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {testers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Notes for tester (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Instructions about periodic testing..."
            />
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-slate-800">
            <p className="font-medium text-green-900">Summary</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
              <li>Test: {articleTest.test_name}</li>
              <li>Frequency: every {everyDays} days</li>
              <li>Total runs: {occurrenceMode === 'indefinite' ? 'Indefinite' : String(totalOccurrences)}</li>
              <li>First due: {scheduleStartDate}</li>
              <li>Alert: {alertDaysBefore} days before</li>
              <li>Tester: {testerName}</li>
            </ul>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
