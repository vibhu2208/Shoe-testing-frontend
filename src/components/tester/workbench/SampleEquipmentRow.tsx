'use client';

import { ImageIcon, Package } from 'lucide-react';
import type { AssignedTest, EquipmentItem } from '@/types/testerWorkbench';

interface SampleEquipmentRowProps {
  test: AssignedTest | null;
  equipment: EquipmentItem[];
  samplePhotoUrl?: string | null;
}

const equipmentStatusStyle: Record<EquipmentItem['status'], string> = {
  available: 'bg-green-100 text-green-800 border-green-300',
  running: 'bg-green-700 text-white border-green-800',
  maintenance: 'bg-white text-black border-black/20',
  calibration_due: 'bg-black text-white border-black',
};

const equipmentStatusLabel: Record<EquipmentItem['status'], string> = {
  available: 'Available',
  running: 'Running',
  maintenance: 'Maintenance',
  calibration_due: 'Calibration Due',
};

export default function SampleEquipmentRow({
  test,
  equipment,
  samplePhotoUrl,
}: SampleEquipmentRowProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-black">
          <Package className="h-4 w-4 text-green-700" aria-hidden />
          Sample Information
        </h2>
        {test ? (
          <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-black/[0.03]">
              {samplePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={samplePhotoUrl}
                  alt={`Sample ${test.article_number}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <ImageIcon className="mx-auto h-8 w-8 text-black/20" aria-hidden />
                  <p className="mt-1 text-[10px] text-black/40">No photo yet</p>
                </div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <Field label="Product Name" value={test.article_name} />
              <Field label="Material" value={test.material_type || '—'} />
              <Field label="Color" value={test.color || '—'} />
              <Field label="Article No." value={test.article_number} />
              <Field label="Category" value={test.category || '—'} />
              <Field
                label="Sample Received"
                value={new Date(test.assigned_at).toLocaleDateString('en-GB')}
              />
              {test.description && (
                <div className="col-span-2">
                  <dt className="text-black/50">Description</dt>
                  <dd className="font-medium text-black">{test.description}</dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <p className="text-sm text-black/50">Select a test to view sample details.</p>
        )}
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-black">Equipment Status</h2>
        <div className="space-y-2">
          {equipment.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-black">{eq.name}</p>
                {eq.runningTestName && (
                  <p className="truncate text-[11px] text-green-800">{eq.runningTestName}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${equipmentStatusStyle[eq.status]}`}
              >
                {equipmentStatusLabel[eq.status]}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-black/50">{label}</dt>
      <dd className="font-medium text-black">{value}</dd>
    </>
  );
}
