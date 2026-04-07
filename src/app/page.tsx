'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'tester') {
      router.replace('/tester/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/40 to-slate-200/90">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'tester') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/40 to-slate-200/90">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-600">Opening tester dashboard…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/40 to-slate-200/90 p-4 sm:p-6">
      <LoginForm />
    </div>
  );
}
