'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TesterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/tester/dashboard');
  }, [router]);

  return (
    <ProtectedRoute requiredRole="tester">
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-black/70">Redirecting to dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
