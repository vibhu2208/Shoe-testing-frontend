'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, FileText, AlertTriangle, Calendar, TestTube } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface TestDetail {
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

export default function TesterTestDetail() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchTestDetail(params.id as string);
    }
  }, [params.id]);

  const fetchTestDetail = async (testId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${testId}`);
      if (response.ok) {
        const testData = await response.json();
        setTest(testData);
      } else if (response.status === 404) {
        setError('Test not found or not assigned to you');
      } else {
        setError('Failed to fetch test details');
      }
    } catch (error) {
      console.error('Error fetching test detail:', error);
      setError('Error loading test details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!test) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${test.id}/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setTest(prev => prev ? { ...prev, status: 'in_progress' } : null);
      } else {
        console.error('Failed to start test');
        alert('Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Error starting test');
    }
  };

  const getStatusColor = (status: string) => {
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

  const getDeadlineInfo = (deadline: string | null, status: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let color = 'text-slate-600';
    let urgency = '';
    
    if (diffDays < 0 && status !== 'submitted') {
      color = 'text-red-600';
      urgency = 'Overdue';
    } else if (diffDays <= 3) {
      color = 'text-amber-600';
      urgency = `${diffDays} days remaining`;
    } else if (diffDays <= 7) {
      color = 'text-amber-600';
      urgency = `${diffDays} days remaining`;
    } else {
      urgency = `${diffDays} days remaining`;
    }
    
    return { color, urgency, formattedDate: deadlineDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })};
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Test Not Found</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/tester/dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Back to My Tests
          </button>
        </div>
      </div>
    );
  }

  const deadlineInfo = getDeadlineInfo(test.test_deadline, test.status);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/tester/dashboard')}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to My Tests</span>
              </button>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(test.status)}`}>
              {test.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Test Identity Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Test Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Test ID</label>
                <div className="text-sm font-mono bg-slate-50 px-3 py-2 rounded border">
                  {test.inhouse_test_id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    test.category === 'Finished Good' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {test.category}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Test Name</label>
                <div className="text-lg font-semibold text-slate-900">{test.test_name}</div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Standard Method</label>
                <div className="text-sm font-mono bg-slate-50 px-3 py-2 rounded border">
                  {test.test_standard}
                </div>
              </div>
            </div>
          </div>

          {/* Test Deadline Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Test Deadline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Assigned On</label>
                <div className="text-sm text-slate-900">
                  {new Date(test.assigned_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Deadline</label>
                <div className="text-sm">
                  {test.test_deadline ? (
                    <div>
                      <div className="font-medium text-slate-900">
                        {deadlineInfo?.formattedDate}
                      </div>
                      <div className={`text-xs ${deadlineInfo?.color}`}>
                        {deadlineInfo?.urgency}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">No deadline set</span>
                  )}
                </div>
              </div>
              {test.admin_notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Assigned Notes</label>
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded border">
                    {test.admin_notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Product Name</label>
                <div className="text-sm font-medium text-slate-900">{test.article_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Article Number</label>
                <div className="text-sm font-mono bg-slate-50 px-3 py-2 rounded border">
                  {test.article_number}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Material Type</label>
                <div className="text-sm text-slate-900">{test.material_type}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Color</label>
                <div className="text-sm text-slate-900">{test.color}</div>
              </div>
            </div>
          </div>

          {/* Client Requirement Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Requirement</h2>
            <div className="bg-slate-50 p-4 rounded border">
              <div className="text-sm text-slate-700 leading-relaxed">
                {test.client_requirement}
              </div>
            </div>
          </div>

          {/* Test Parameters Reference Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Test Reference — For guidance only</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <TestTube className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Test Parameters Reference</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    This section would contain the full test parameter reference from the test library including:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>All input parameters required for this test</li>
                    <li>Calculation formulas and methodologies</li>
                    <li>Pass/fail criteria and thresholds</li>
                    <li>Equipment specifications and setup requirements</li>
                    <li>Safety considerations and precautions</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-3 italic">
                    Note: This is read-only reference information to guide your testing process.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Test Status: <span className="font-medium">{test.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-3">
                {test.status === 'pending' && (
                  <button
                    onClick={handleStartTest}
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start Test</span>
                  </button>
                )}
                {test.status === 'in_progress' && (
                  <button
                    disabled
                    className="px-6 py-2 bg-slate-300 text-slate-500 font-medium rounded-md cursor-not-allowed flex items-center space-x-2"
                    title="Result entry coming soon"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Submit Result</span>
                  </button>
                )}
                {test.status === 'submitted' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Test Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
