'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, Shield, ArrowRight, Building2 } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let detectedRole: 'admin' | 'tester';
    if (email.includes('admin')) {
      detectedRole = 'admin';
    } else if (email.includes('tester')) {
      detectedRole = 'tester';
    } else if (email.includes('virola.com')) {
      detectedRole = 'tester';
    } else {
      setError(
        'Invalid email domain. Use admin@example.com, tester@example.com, or a virola.com address.'
      );
      setIsLoading(false);
      return;
    }

    const success = await login(email, password, detectedRole);

    if (success) {
      if (detectedRole === 'tester') {
        router.replace('/tester/dashboard');
      } else {
        router.replace('/admin/dashboard');
      }
    } else {
      setError('Invalid credentials. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div
      className="w-full max-w-5xl mx-auto"
      style={{ fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }}
    >
      <div className="grid overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.15)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Brand panel */}
        <div className="relative hidden min-h-[520px] flex-col justify-between bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 p-10 text-white lg:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(52,211,153,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(20,184,166,0.25) 0%, transparent 40%)',
            }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <Building2 className="h-6 w-6 text-emerald-200" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide text-emerald-100/90">Virola LIMS</p>
              <p className="text-xs text-emerald-200/70">Laboratory operations</p>
            </div>
          </div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Sign in to your workspace
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-emerald-100/85">
              Role-based access for administrators and testers. Your dashboard opens automatically
              based on your account.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-emerald-50/90">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Secure session handling
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Admin & tester portals
              </li>
            </ul>
          </div>
          <p className="relative z-10 text-xs text-emerald-200/60">© Role-based system</p>
        </div>

        {/* Form */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
              <Shield className="h-6 w-6 text-emerald-800" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-600">Sign in to continue to your dashboard</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-600">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-800">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Role is detected from your email (admin, tester, or virola.com).
              </p>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-800">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isLoading
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
              }`}
            >
              {isLoading ? (
                'Signing in…'
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50 to-amber-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/80">
              Demo — administrator
            </p>
            <p className="mt-2 text-sm text-amber-950/90">
              Use this account to explore the admin area:
            </p>
            <dl className="mt-3 space-y-2 font-mono text-[13px] text-amber-950">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <dt className="shrink-0 text-xs font-sans font-medium text-amber-800/90">Email</dt>
                <dd className="break-all">admin@example.com</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <dt className="shrink-0 text-xs font-sans font-medium text-amber-800/90">Password</dt>
                <dd>admin123</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-amber-200/60 pt-3 text-xs leading-relaxed text-amber-900/75">
              Other roles: <span className="font-medium">tester@example.com</span> or{' '}
              <span className="font-medium">*@virola.com</span> with your seeded password (often{' '}
              <span className="font-mono">password</span> in local setups).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
