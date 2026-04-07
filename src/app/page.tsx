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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-black/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'tester') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-black/70">Opening tester dashboard…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
