'use client';

import { Suspense } from 'react';
import TesterDashboardContent from './TesterDashboardContent';

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-green-600 border-t-transparent" />
        <p className="text-black/70">Loading laboratory workbench…</p>
      </div>
    </div>
  );
}

export default function TesterDashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TesterDashboardContent />
    </Suspense>
  );
}
