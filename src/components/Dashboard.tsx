'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
    if (user?.role === 'tester') {
      router.replace('/tester/dashboard');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  if (user.role === 'tester') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-black/70">Redirecting to tester dashboard…</p>
        </div>
      </div>
    );
  }

  return null;
}
