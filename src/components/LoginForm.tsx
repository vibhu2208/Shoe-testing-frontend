'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Mail, Shield } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

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
    
    if (!success) {
      setError('Invalid credentials. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email (admin@example.com, tester@example.com, or virola.com)"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Role will be automatically detected based on your email
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Admin:</strong> admin@example.com / password</p>
            <p><strong>Tester:</strong> tester@example.com / password</p>
            <p><strong>Testers (virola.com):</strong> rahul@virola.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
