'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, User, Calendar, Search, Filter, ArrowRight } from 'lucide-react';

interface AssignedTest {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  execution_type: string;
  inhouse_test_id: string;
  status: 'pending' | 'in_progress' | 'submitted';
  test_deadline: string | null;
  assigned_at: string;
  admin_notes: string | null;
  article_name: string;
  article_number: string;
  material_type: string;
  color: string;
}

interface TestStats {
  total: number;
  pending: number;
  in_progress: number;
  submitted: number;
  overdue: number;
}

export default function TesterDashboard() {
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TestStats>({ total: 0, pending: 0, in_progress: 0, submitted: 0, overdue: 0 });
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'submitted' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'test_name' | 'status' | 'assigned_date'>('deadline');

  useEffect(() => {
    fetchAssignedTests();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [tests]);

  const fetchAssignedTests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tester/my-tests');
      if (response.ok) {
        const testsData = await response.json();
        setTests(testsData);
      } else {
        console.error('Failed to fetch assigned tests');
      }
    } catch (error) {
      console.error('Error fetching assigned tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const stats = tests.reduce((acc, test) => {
      acc.total++;
      acc[test.status]++;
      
      if (test.test_deadline) {
        const deadline = new Date(test.test_deadline);
        if (deadline < now && test.status !== 'submitted') {
          acc.overdue++;
        }
      }
      
      return acc;
    }, { total: 0, pending: 0, in_progress: 0, submitted: 0, overdue: 0 });
    
    setStats(stats);
  };

  const handleStartTest = async (testId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${testId}/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update local state
        setTests(prev => prev.map(test => 
          test.id === testId ? { ...test, status: 'in_progress' } : test
        ));
      } else {
        console.error('Failed to start test');
        alert('Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Error starting test');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-100 text-slate-600';
      case 'in_progress':
        return 'bg-green-50 text-green-700';
      case 'submitted':
        return 'bg-green-600 text-white';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getDeadlineBadge = (deadline: string | null, status: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 && status !== 'submitted') {
      return 'bg-red-50 text-red-600';
    } else if (diffDays <= 3) {
      return 'bg-orange-50 text-orange-700';
    } else if (diffDays <= 7) {
      return 'bg-amber-50 text-amber-700';
    } else {
      return 'bg-slate-100 text-slate-600';
    }
  };

  const getDeadlineText = (deadline: string | null, status: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = deadlineDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
    
    if (diffDays < 0 && status !== 'submitted') {
      return `Overdue: ${formattedDate}`;
    } else if (diffDays <= 3) {
      return `Due: ${formattedDate} ⚠⚠`;
    } else if (diffDays <= 7) {
      return `Due: ${formattedDate} ⚠`;
    } else {
      return `Due: ${formattedDate}`;
    }
  };

  const filteredAndSortedTests = tests
    .filter(test => {
      // Apply status filter
      if (filter === 'overdue') {
        const now = new Date();
        const deadline = test.test_deadline ? new Date(test.test_deadline) : null;
        return deadline && deadline < now && test.status !== 'submitted';
      } else if (filter !== 'all') {
        return test.status === filter;
      }
      return true;
    })
    .filter(test => {
      // Apply search filter
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        test.test_name.toLowerCase().includes(searchLower) ||
        test.article_number.toLowerCase().includes(searchLower) ||
        test.article_name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (!a.test_deadline && !b.test_deadline) return 0;
          if (!a.test_deadline) return 1;
          if (!b.test_deadline) return -1;
          return new Date(a.test_deadline).getTime() - new Date(b.test_deadline).getTime();
        case 'test_name':
          return a.test_name.localeCompare(b.test_name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'assigned_date':
          return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading your assigned tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-semibold text-slate-900">My Assigned Tests</h1>
            </div>
            <div className="text-sm text-slate-600">
              Tester Dashboard
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Assigned</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-green-600">{stats.in_progress}</div>
            <div className="text-sm text-slate-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <div className="text-sm text-slate-600">Submitted</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-slate-600">Overdue</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by test name or article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="deadline">Deadline</option>
                <option value="test_name">Test Name</option>
                <option value="status">Status</option>
                <option value="assigned_date">Assigned Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Test Cards */}
        <div className="space-y-4">
          {filteredAndSortedTests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tests found</h3>
              <p className="text-slate-600">
                {filter === 'all' && !searchTerm 
                  ? "You don't have any assigned tests yet."
                  : "No tests match your current filters."
                }
              </p>
            </div>
          ) : (
            filteredAndSortedTests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(test.status)}`}>
                      {test.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {test.test_deadline && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDeadlineBadge(test.test_deadline, test.status)}`}>
                        {getDeadlineText(test.test_deadline, test.status)}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">{test.test_name}</h3>
                <div className="text-sm text-slate-600 mb-4">
                  {test.inhouse_test_id} — {test.test_standard}
                </div>

                <div className="border-t border-slate-200 pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Article No:</span> {test.article_number}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Product:</span> {test.article_name}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Material:</span> {test.material_type}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Category:</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        test.category === 'Finished Good' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {test.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mb-4">
                  <div className="font-medium text-slate-700 mb-2">Client Requirement:</div>
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border">
                    {test.client_requirement}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Assigned: {new Date(test.assigned_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => window.location.href = `/tester/tests/${test.id}`}
                      className="px-4 py-2 border border-green-600 text-green-600 text-sm font-medium rounded-md hover:bg-green-50"
                    >
                      View Full Details
                    </button>
                    {test.status === 'pending' ? (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                      >
                        Start Test
                      </button>
                    ) : test.status === 'in_progress' ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-slate-300 text-slate-500 text-sm font-medium rounded-md cursor-not-allowed"
                        title="Result entry coming soon"
                      >
                        Submit Result
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
