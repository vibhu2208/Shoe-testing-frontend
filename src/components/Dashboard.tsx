'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, BarChart3, TestTube, FileText, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  React.useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-gray-800">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tester Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-white">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Testing Overview</h2>
          <p className="text-gray-600">View and manage your test cases, reports, and testing activities.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <TestTube className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">15</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Active Tests</h3>
            <p className="text-sm text-gray-600">Tests in progress</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <FileText className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">42</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Test Reports</h3>
            <p className="text-sm text-gray-600">Generated reports</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">94%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Pass Rate</h3>
            <p className="text-sm text-gray-600">Test success rate</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Clock className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-2xl font-bold text-gray-900">2.3s</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Avg Duration</h3>
            <p className="text-sm text-gray-600">Test execution time</p>
          </div>
        </div>

        {/* Recent Test Results */}
        <div className="bg-slate-700 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Test Results</h3>
            <button className="text-sm text-slate-300 hover:text-white transition-colors">
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-600">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-white">Login Authentication Test</p>
                  <p className="text-sm text-slate-300">Authentication flow working correctly</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">5 min ago</span>
                <span className="px-2 py-1 bg-green-900 text-green-300 text-xs font-medium rounded">PASSED</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-600">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-white">API Response Time Test</p>
                  <p className="text-sm text-slate-300">Timeout error detected - 5.2s</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">15 min ago</span>
                <span className="px-2 py-1 bg-red-900 text-red-300 text-xs font-medium rounded">FAILED</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-600">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-white">UI Component Rendering Test</p>
                  <p className="text-sm text-slate-300">All components rendered correctly</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">1 hour ago</span>
                <span className="px-2 py-1 bg-green-900 text-green-300 text-xs font-medium rounded">PASSED</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-white">Database Connection Test</p>
                  <p className="text-sm text-slate-300">Connection established with warnings</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">2 hours ago</span>
                <span className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs font-medium rounded">WARNING</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <TestTube className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Run New Test</h3>
            <p className="text-sm text-gray-600">Execute a new test suite</p>
          </button>

          <button className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <FileText className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">View Reports</h3>
            <p className="text-sm text-gray-600">Browse detailed test reports</p>
          </button>

          <button className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
            <p className="text-sm text-gray-600">View performance metrics</p>
          </button>
        </div>

        {/* Upcoming Features */}
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">More Features Coming Soon</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're working on advanced testing features including automated test scheduling, 
            performance benchmarking, and comprehensive reporting tools.
          </p>
        </div>
      </main>
    </div>
  );
}
