'use client';

import { useEffect, useState, useCallback } from 'react';
import TestCalculator from '@/components/TestCalculator';
import { Test } from '@/types/test';
import { parseClientSpecsFromRequirement, resolveLibraryTestId } from '@/lib/clientRequirementParser';

interface TesterResultEntryProps {
  articleTestId: string;
  inhouseTestId: string | null;
  testStandard: string;
  clientRequirement: string;
  onSubmitted?: (payload?: {
    periodicNextTestId?: string | null;
    periodicScheduleEnded?: boolean;
  }) => void;
}

function getTesterIdHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return {};
    const u = JSON.parse(stored);
    return u?.id ? { 'x-user-id': String(u.id) } : {};
  } catch {
    return {};
  }
}

type PhotoConfig = { min: number; max: number; required: boolean; slots: { slot: number; label: string; optional?: boolean }[]; helper: string };

const PHOTO_CONFIGS: Record<string, PhotoConfig> = {
  'SATRA-TM-174': { min: 1, max: 3, required: true, helper: 'Upload a clear photo of the abraded sole sample showing the wear surface after testing.', slots: [{ slot: 1, label: 'Abraded Sole Sample' }, { slot: 2, label: 'Additional View', optional: true }, { slot: 3, label: 'Additional View', optional: true }] },
  'SATRA-TM-92': { min: 2, max: 3, required: true, helper: 'Upload photos of the sole before and after flexing. Clearly show crack/no-crack condition.', slots: [{ slot: 1, label: 'Sole Before Flexing' }, { slot: 2, label: 'Sole After Flexing' }, { slot: 3, label: 'Machine Setup', optional: true }] },
  'SATRA-TM-161': { min: 2, max: 3, required: true, helper: 'Upload photos of the shoe mounted on machine and post-test condition.', slots: [{ slot: 1, label: 'Shoe on Flexing Machine' }, { slot: 2, label: 'Shoe After Test' }, { slot: 3, label: 'Additional View', optional: true }] },
  'SATRA-TM-281': { min: 2, max: 4, required: true, helper: 'Upload before, in-progress, and separation evidence photos.', slots: [{ slot: 1, label: 'Shoe Before Test' }, { slot: 2, label: 'Bond Testing in Progress' }, { slot: 3, label: 'Sole After Separation' }, { slot: 4, label: 'Close-up of Separation', optional: true }] },
  'PH-001': { min: 0, max: 2, required: false, helper: 'Optional — upload pH meter display and setup photos for verification.', slots: [{ slot: 1, label: 'pH Meter Reading', optional: true }, { slot: 2, label: 'Sample Setup', optional: true }] },
  'ISO-19574': { min: 2, max: 4, required: true, helper: 'Upload sample before/after conditioning and fungal evidence if present.', slots: [{ slot: 1, label: 'Sample Before Conditioning' }, { slot: 2, label: 'Sample After Conditioning' }, { slot: 3, label: 'Fungal Growth Close-up', optional: true }, { slot: 4, label: 'Chamber Setup', optional: true }] },
  'FZ-001': { min: 2, max: 3, required: true, helper: 'Upload sample before and after freezing; include failure close-up if observed.', slots: [{ slot: 1, label: 'Sample Before Freezing' }, { slot: 2, label: 'Sample After Freezing' }, { slot: 3, label: 'Failure Close-up', optional: true }] },
  'HAO-001': { min: 2, max: 3, required: true, helper: 'Upload sample before and after oven test; include failure close-up if observed.', slots: [{ slot: 1, label: 'Sample Before Oven' }, { slot: 2, label: 'Sample After Oven' }, { slot: 3, label: 'Failure Close-up', optional: true }] },
  'SATRA-TM-31': { min: 2, max: 4, required: true, helper: 'Upload material before test, abrasion cloth, and post-test surface evidence.', slots: [{ slot: 1, label: 'Material Surface Before Test' }, { slot: 2, label: 'Abrasion Cloth After Test' }, { slot: 3, label: 'Material Surface After Test' }, { slot: 4, label: 'Damage Close-up', optional: true }] }
};

export default function TesterResultEntry({
  articleTestId,
  inhouseTestId,
  testStandard,
  clientRequirement,
  onSubmitted
}: TesterResultEntryProps) {
  const [libraryTest, setLibraryTest] = useState<Test | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastPassFail, setLastPassFail] = useState<string | null>(null);
  const [lastCalc, setLastCalc] = useState<{ calculatedResults: any; passFailResult: string } | null>(null);
  const [photos, setPhotos] = useState<Array<{ slot: number; label: string; url: string; uploaded_at: string }>>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const libraryId = resolveLibraryTestId(inhouseTestId, testStandard);
  const parsed = libraryId
    ? parseClientSpecsFromRequirement(libraryId, clientRequirement)
    : { input: {} as Record<string, number | boolean>, specs: {} as Record<string, number> };

  useEffect(() => {
    if (!libraryId) {
      setLoadError(
        'This assignment is not linked to a test library ID. Ask an admin to set the in-house test mapping (e.g. SATRA-TM-92) on the article test row.'
      );
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setLoadError('You must be signed in to load the test form.');
      return;
    }

    let cancelled = false;
    setLoadError(null);

    fetch(`http://localhost:5000/api/tests/${encodeURIComponent(libraryId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to load test');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        if (data.test) setLibraryTest(data.test as Test);
        else setLoadError('Test library entry not found');
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load test definition');
      });

    return () => {
      cancelled = true;
    };
  }, [libraryId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !articleTestId) return;
    const testerHeaders = getTesterIdHeader();
    fetch(`http://localhost:5000/api/tester/my-tests/${articleTestId}`, { headers: testerHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const existing = Array.isArray(d?.result_data?.photos) ? d.result_data.photos : [];
        setPhotos(existing);
      })
      .catch(() => {});
  }, [articleTestId]);

  const handleCalculationResult = useCallback(
    (payload: { calculatedResults: any; passFailResult: string }) => {
      setLastPassFail(payload.passFailResult);
      setLastCalc(payload);
    },
    []
  );

  const submit = async () => {
    if (!lastPassFail) {
      alert('Complete the inputs so the system can calculate PASS or FAIL, then submit.');
      return;
    }

    if (photoConfig.required && uploadedCount < photoConfig.min) {
      alert(`${photoConfig.min} photo(s) required before submission.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/tester/my-tests/${articleTestId}/submit-results`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getTesterIdHeader()
          },
          body: JSON.stringify({
            result: lastPassFail,
            result_data: {
              library_test_id: libraryId,
              client_requirement: clientRequirement,
              calculated_results: lastCalc?.calculatedResults ?? null,
              pass_fail: lastCalc?.passFailResult ?? lastPassFail,
              photos,
              submitted_at_client: new Date().toISOString()
            }
          })
        }
      );

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        onSubmitted?.({
          periodicNextTestId: data.periodicNextTestId ?? null,
          periodicScheduleEnded: Boolean(data.periodicScheduleEnded)
        });
      } else {
        const text = await res.text();
        alert(text || 'Submit failed');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="rounded-lg border-2 border-black bg-white p-4 text-sm text-black">
        {loadError}
      </div>
    );
  }

  if (!libraryTest) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-black/15 bg-white p-12">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          <p className="text-black/70">Loading test definition from library…</p>
        </div>
      </div>
    );
  }

  const photoConfig = PHOTO_CONFIGS[String(libraryId || '').toUpperCase()] || { min: 0, max: 0, required: false, slots: [], helper: '' };
  const uploadedCount = photos.length;
  const photosMissing = Math.max(0, photoConfig.min - uploadedCount);
  const canSubmit = Boolean(lastPassFail) && !submitting && (!photoConfig.required || uploadedCount >= photoConfig.min);

  const uploadPhoto = async (slot: number, label: string, file: File) => {
    if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) {
      setUploadErrors((p) => ({ ...p, [slot]: 'Only JPG, JPEG, PNG allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((p) => ({ ...p, [slot]: 'Max file size is 5MB' }));
      return;
    }
    setUploadErrors((p) => ({ ...p, [slot]: '' }));
    setUploadingSlot(slot);
    setUploadProgress((p) => ({ ...p, [slot]: 0 }));
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `http://localhost:5000/api/tester/my-tests/${articleTestId}/photos`);
      const headers = getTesterIdHeader();
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((p) => ({ ...p, [slot]: Math.round((e.loaded / e.total) * 100) }));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const parsedResponse = JSON.parse(xhr.responseText || '{}');
          setPhotos(parsedResponse.photos || []);
        } else {
          const msg = (() => {
            try { return JSON.parse(xhr.responseText || '{}').error || 'Upload failed'; } catch { return 'Upload failed'; }
          })();
          setUploadErrors((p) => ({ ...p, [slot]: msg }));
        }
        setUploadingSlot(null);
        resolve();
      };
      xhr.onerror = () => {
        setUploadErrors((p) => ({ ...p, [slot]: 'Upload failed. Retry.' }));
        setUploadingSlot(null);
        resolve();
      };
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('slot', String(slot));
      fd.append('label', label);
      xhr.send(fd);
    });
  };

  const removePhoto = async (slot: number) => {
    const res = await fetch(`http://localhost:5000/api/tester/my-tests/${articleTestId}/photos/${slot}`, {
      method: 'DELETE',
      headers: { ...getTesterIdHeader() }
    });
    if (!res.ok) return;
    const data = await res.json();
    setPhotos(data.photos || []);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-200 bg-green-50/60 px-4 py-3">
        <p className="text-sm font-medium text-green-900">
          Result entry — {libraryTest.standard} {libraryTest.name}
        </p>
        <p className="mt-1 text-xs text-green-800">
          Values are calculated live. Client spec fields are pre-filled where we could read numbers from the requirement text; adjust if needed.
        </p>
      </div>

      <TestCalculator
        test={libraryTest}
        variant="tester"
        clientRequirementText={clientRequirement}
        initialInputOverrides={parsed.input}
        initialClientSpecsOverrides={parsed.specs}
        onCalculationResult={handleCalculationResult}
      />

      {photoConfig.slots.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-black">Photo Evidence</p>
          <p className="mt-1 text-xs text-slate-600">{photoConfig.helper}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {photoConfig.slots.map((slotCfg) => {
              const existing = photos.find((p) => Number(p.slot) === slotCfg.slot);
              return (
                <div key={slotCfg.slot} className="space-y-2">
                  <label className="text-xs text-black">
                    {slotCfg.label} {!slotCfg.optional ? <span className="text-red-600">*</span> : <span className="text-slate-400">(optional)</span>}
                  </label>
                  <div
                    className="relative flex h-32 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50"
                    onClick={() => document.getElementById(`photo-slot-${slotCfg.slot}`)?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) uploadPhoto(slotCfg.slot, slotCfg.label, file);
                    }}
                  >
                    <input
                      id={`photo-slot-${slotCfg.slot}`}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPhoto(slotCfg.slot, slotCfg.label, file);
                      }}
                    />
                    {existing ? (
                      <>
                        <img src={`http://localhost:5000${existing.url}`} alt={existing.label} className="h-full w-full rounded-lg object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(slotCfg.slot); }} className="absolute right-2 top-2 rounded bg-white/90 px-1 text-xs text-black">X</button>
                      </>
                    ) : uploadingSlot === slotCfg.slot ? (
                      <div className="w-4/5">
                        <div className="h-2 w-full rounded bg-slate-200">
                          <div className="h-2 rounded bg-green-600" style={{ width: `${uploadProgress[slotCfg.slot] || 0}%` }} />
                        </div>
                        <p className="mt-2 text-center text-xs text-slate-600">Uploading... {uploadProgress[slotCfg.slot] || 0}%</p>
                      </div>
                    ) : (
                      <p className="px-2 text-center text-xs text-slate-500">Click or drag photo</p>
                    )}
                  </div>
                  {uploadErrors[slotCfg.slot] && (
                    <p className="text-xs text-red-600">
                      {uploadErrors[slotCfg.slot]}{' '}
                      <button type="button" onClick={() => document.getElementById(`photo-slot-${slotCfg.slot}`)?.click()} className="underline">Retry</button>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-black/15 bg-white p-4">
        {photoConfig.required && photosMissing > 0 && (
          <div className="w-full rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {photosMissing} photo(s) required before you can submit this test.
          </div>
        )}
        {!photoConfig.required && photoConfig.slots.length > 0 && uploadedCount === 0 && (
          <div className="w-full rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            No photos uploaded - photos are recommended for verification.
          </div>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          title={photoConfig.required && photosMissing > 0 ? `${photosMissing} more photo(s) required` : ''}
          className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Final Result'}
        </button>
        {lastPassFail && (
          <span
            className={`text-sm font-semibold ${
              lastPassFail === 'PASS' ? 'text-green-800' : 'text-black'
            }`}
          >
            Calculated outcome: {lastPassFail}
          </span>
        )}
      </div>
    </div>
  );
}
