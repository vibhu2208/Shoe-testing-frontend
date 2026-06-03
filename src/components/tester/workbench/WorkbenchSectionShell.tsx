'use client';

import { WORKBENCH_SECTIONS } from '@/lib/workbenchSections';
import type { WorkbenchSectionId } from '@/types/testerWorkbench';

interface WorkbenchSectionShellProps {
  sectionId: WorkbenchSectionId;
  children: React.ReactNode;
}

export default function WorkbenchSectionShell({ sectionId, children }: WorkbenchSectionShellProps) {
  const config = WORKBENCH_SECTIONS.find((s) => s.id === sectionId);
  if (!config) return <>{children}</>;

  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <Icon className="h-5 w-5 text-green-700" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-black">{config.label}</h2>
          <p className="text-sm text-black/50">{config.description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
