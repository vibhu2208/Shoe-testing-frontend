'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, Shield } from 'lucide-react';

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

    // Auto-detect role based on email
    let detectedRole: 'admin' | 'tester';
    if (email.includes('admin')) {
      detectedRole = 'admin';
    } else if (email.includes('tester')) {
      detectedRole = 'tester';
    } else if (email.includes('virola.com')) {
      detectedRole = 'tester';
    } else {
      setError('Invalid email domain. Please use admin@example.com, tester@example.com, or virola.com email');
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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-black/10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-green-800" />
          </div>
          <h2 className="text-2xl font-bold text-black">Welcome Back</h2>
          <p className="text-black/70 mt-2">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-black placeholder:text-black/40 bg-white"
                placeholder="Enter your email (admin@example.com, tester@example.com, or virola.com)"
                required
              />
            </div>
            <p className="text-xs text-black/60 mt-1">
              Role will be automatically detected based on your email
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-black placeholder:text-black/40 bg-white"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="border-2 border-black bg-white text-black px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? 'bg-black/30 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-800'
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-black/10">
          <p className="text-sm text-black font-medium mb-2">Demo Credentials:</p>
          <div className="text-xs text-black/70 space-y-1">
            <p><strong className="text-black">Admin:</strong> admin@example.com / password</p>
            <p><strong className="text-black">Tester:</strong> tester@example.com / password</p>
            <p><strong className="text-black">Testers (virola.com):</strong> rahul@virola.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
