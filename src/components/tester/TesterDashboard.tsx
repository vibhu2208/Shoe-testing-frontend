'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Eye, Play, User, Calendar, Package, FileText } from 'lucide-react';

interface TesterTest {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted';
  test_deadline: string | null;
  assigned_at: string;
  admin_notes: string | null;
  product_name: string;
  article_number: string;
  material_type: string;
  color: string;
  order_number: string;
}

interface TesterStats {
  total: number;
  pending: number;
  in_progress: number;
  submitted: number;
  overdue: number;
}

export default function TesterDashboard() {
  const [tests, setTests] = useState<TesterTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'submitted' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'test_name' | 'status' | 'assigned_date'>('deadline');

  useEffect(() => {
    fetchMyTests();
  }, []);

  const getCurrentTesterId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      const parsedUser = JSON.parse(storedUser);
      return parsedUser?.id ? String(parsedUser.id) : null;
    } catch (error) {
      console.error('Failed to read logged-in tester from storage:', error);
      return null;
    }
  };

  const fetchMyTests = async () => {
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch('http://localhost:5000/api/tester/my-tests', {
        headers: testerId ? { 'x-user-id': testerId } : {},
      });
      if (response.ok) {
        const testsData = await response.json();
        setTests(testsData);
      } else {
        console.error('Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const testerId = getCurrentTesterId();
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${testId}/start`, {
        method: 'POST',
        headers: testerId ? { 'x-user-id': testerId } : {},
      });

      if (response.ok) {
        // Update local state
        setTests(prev => prev.map(test => 
          test.id === testId ? { ...test, status: 'in_progress' } : test
        ));
      } else {
        console.error('Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const getStats = (): TesterStats => {
    const total = tests.length;
    const pending = tests.filter(t => t.status === 'pending' || t.status === 'assigned').length;
    const in_progress = tests.filter(t => t.status === 'in_progress').length;
    const submitted = tests.filter(t => t.status === 'submitted').length;
    
    const overdue = tests.filter(t => {
      if (!t.test_deadline) return false;
      const deadline = new Date(t.test_deadline);
      const today = new Date();
      return deadline < today && t.status !== 'submitted';
    }).length;

    return { total, pending, in_progress, submitted, overdue };
  };

  const getStatusBadge = (status: TesterTest['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600' },
      assigned: { label: 'Pending', className: 'bg-slate-100 text-slate-600' },
      in_progress: { label: 'In Progress', className: 'bg-green-50 text-green-700' },
      submitted: { label: 'Submitted', className: 'bg-green-600 text-white' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getDeadlineBadge = (deadline: string | null, status: TesterTest['status']) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let className = 'bg-slate-100 text-slate-600';
    let label = `Due: ${deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
    
    if (diffDays < 0 && status !== 'submitted') {
      className = 'bg-red-50 text-red-600';
      label = `Overdue: ${deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
    } else if (diffDays <= 3) {
      className = 'bg-orange-50 text-orange-700';
      label = `Due: ${deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ⚠⚠`;
    } else if (diffDays <= 7) {
      className = 'bg-amber-50 text-amber-700';
      label = `Due: ${deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ⚠`;
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      'Raw Material': { label: 'Raw Material', className: 'bg-slate-100 text-slate-700' },
      'Work In Progress': { label: 'WIP', className: 'bg-slate-100 text-slate-700' },
      'Finished Good': { label: 'Finished Good', className: 'bg-green-50 text-green-700' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig['Work In Progress'];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredAndSortedTests = tests
    .filter(test => {
      // Filter by status
      if (filter === 'pending' && test.status !== 'pending' && test.status !== 'assigned') return false;
      if (filter === 'in_progress' && test.status !== 'in_progress') return false;
      if (filter === 'submitted' && test.status !== 'submitted') return false;
      if (filter === 'overdue') {
        if (!test.test_deadline || test.status === 'submitted') return false;
        const deadline = new Date(test.test_deadline);
        const today = new Date();
        if (deadline >= today) return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          test.test_name.toLowerCase().includes(searchLower) ||
          test.order_number.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
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

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Assigned Tests</h1>
          <p className="text-slate-600">Manage your assigned test requirements</p>
        </div>
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-slate-400" />
          <span className="text-slate-600">Tester Dashboard</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Assigned</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.in_progress}</div>
          <div className="text-sm text-slate-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
          <div className="text-sm text-slate-600">Submitted</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-slate-600">Overdue</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="deadline">Deadline</option>
                <option value="test_name">Test Name</option>
                <option value="status">Status</option>
                <option value="assigned_date">Assigned Date</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search by test name or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Test Cards */}
      <div className="space-y-4">
        {filteredAndSortedTests.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tests found</h3>
            <p className="text-slate-600">
              {filter === 'all' 
                ? 'You have no assigned tests at the moment.'
                : `No tests match the current filter: ${filter}`
              }
            </p>
          </div>
        ) : (
          filteredAndSortedTests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                {getStatusBadge(test.status)}
                {getDeadlineBadge(test.test_deadline, test.status)}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{test.test_name}</h3>
                <p className="text-sm text-slate-600">{test.id} — {test.test_standard}</p>
              </div>
              
              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Order No:</span>
                    <span className="ml-2 font-medium text-slate-900">{test.order_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Product:</span>
                    <span className="ml-2 font-medium text-slate-900">{test.product_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Article No:</span>
                    <span className="ml-2 font-medium text-slate-900">{test.article_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Material:</span>
                    <span className="ml-2 font-medium text-slate-900">{test.material_type}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-slate-600">Category:</span>
                  <span className="ml-2">{getCategoryBadge(test.category)}</span>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Client Requirement:</div>
                <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded border">
                  {test.client_requirement}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.open(`/tester/tests/${test.id}`, '_blank')}
                    className="flex items-center space-x-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Details</span>
                  </button>
                  
                  {test.status === 'pending' || test.status === 'assigned' ? (
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Test</span>
                    </button>
                  ) : test.status === 'in_progress' ? (
                    <button
                      disabled
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-400 text-white rounded-lg cursor-not-allowed"
                      title="Result entry coming soon"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Result</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
