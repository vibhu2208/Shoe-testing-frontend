'use client';

import { Camera, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AssignedTest, QuickResultDraft } from '@/types/testerWorkbench';
import { draftStorageKey } from '@/lib/testerWorkbenchUtils';

interface QuickResultEntryProps {
  test: AssignedTest | null;
  onSave: (draft: QuickResultDraft) => void;
  onSubmit: () => void;
  onAttachPhotos: () => void;
}

const emptyDraft: QuickResultDraft = {
  observation1: '',
  observation2: '',
  reading1: '',
  reading2: '',
  remarks: '',
};

export default function QuickResultEntry({
  test,
  onSave,
  onSubmit,
  onAttachPhotos,
}: QuickResultEntryProps) {
  const [draft, setDraft] = useState<QuickResultDraft>(emptyDraft);

  useEffect(() => {
    if (!test) {
      setDraft(emptyDraft);
      return;
    }
    try {
      const stored = localStorage.getItem(draftStorageKey(test.id));
      if (stored) setDraft(JSON.parse(stored));
      else setDraft(emptyDraft);
    } catch {
      setDraft(emptyDraft);
    }
  }, [test?.id]);

  const average =
    draft.reading1 && draft.reading2
      ? (
          (parseFloat(draft.reading1) + parseFloat(draft.reading2)) /
          2
        ).toFixed(2)
      : draft.reading1 || '—';

  const disabled = !test || test.status !== 'in_progress';

  return (
    <section className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-black/10 bg-green-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-black">Quick Result Entry</h2>
        <p className="text-xs text-black/50">
          {test
            ? `Recording for ${test.test_name} — full submission opens on detail page`
            : 'Select an in-progress test to enter readings'}
        </p>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Observation 1"
          value={draft.observation1}
          disabled={disabled}
          onChange={(v) => setDraft((d) => ({ ...d, observation1: v }))}
        />
        <Input
          label="Observation 2"
          value={draft.observation2}
          disabled={disabled}
          onChange={(v) => setDraft((d) => ({ ...d, observation2: v }))}
        />
        <Input
          label="Reading 1"
          value={draft.reading1}
          disabled={disabled}
          type="number"
          onChange={(v) => setDraft((d) => ({ ...d, reading1: v }))}
        />
        <Input
          label="Reading 2"
          value={draft.reading2}
          disabled={disabled}
          type="number"
          onChange={(v) => setDraft((d) => ({ ...d, reading2: v }))}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-black/60">Average</label>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm font-semibold tabular-nums text-black">
            {average}
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium text-black/60">Remarks</label>
          <textarea
            disabled={disabled}
            value={draft.remarks}
            onChange={(e) => setDraft((d) => ({ ...d, remarks: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-black disabled:bg-black/[0.03] disabled:text-black/40 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            placeholder="Notes, anomalies, retest reasons…"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-black/10 px-4 py-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(draft)}
          className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-green-50 disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden />
          Save Progress
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onAttachPhotos}
          className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-green-50 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" aria-hidden />
          Attach Photos
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden />
          Submit Results
        </button>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  disabled,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-black/60">{label}</label>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-black disabled:bg-black/[0.03] disabled:text-black/40 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />
    </div>
  );
}
