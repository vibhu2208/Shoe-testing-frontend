'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, X, Plus, FileText, Clock, CheckCircle, AlertCircle, Package, Eye, Download, User, RotateCw, Calendar } from 'lucide-react';
import PeriodicScheduleModal from '@/components/clients/PeriodicScheduleModal';
import PeriodicScheduleDrawer from '@/components/clients/PeriodicScheduleDrawer';

const INHOUSE_TEST_OPTIONS = [
  { id: 'SATRA-TM-174', label: 'SATRA-TM-174 — Sole Abrasion' },
  { id: 'SATRA-TM-92', label: 'SATRA-TM-92 — Sole Flexing' },
  { id: 'SATRA-TM-161', label: 'SATRA-TM-161 — Whole Shoe Flexing' },
  { id: 'SATRA-TM-281', label: 'SATRA-TM-281 — Bond Strength' },
  { id: 'PH-001', label: 'PH-001 — pH Value' },
  { id: 'ISO-19574', label: 'ISO-19574 — Antifungal Test' },
  { id: 'FZ-001', label: 'FZ-001 — Freezing Test' },
  { id: 'HAO-001', label: 'HAO-001 — Hot Air Oven Test' },
  { id: 'SATRA-TM-31', label: 'SATRA-TM-31 — Material Abrasion' },
  { id: '', label: 'No mapping (manual)' }
];

interface ArticleTest {
  id: string;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  execution_type: 'inhouse' | 'outsource' | 'both';
  inhouse_test_id: string;
  vendor_name: string;
  vendor_contact: string;
  vendor_email: string;
  expected_report_date: string | null;
  assigned_tester_id: number | null;
  test_deadline: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted' | 'pass' | 'fail' | null;
  result: string | null;
  result_data: string | null;
  notes: string | null;
  submitted_at: string | null;
  report_generated?: boolean;
  report_url?: string | null;
  report_generated_at?: string | null;
  report_number?: string | null;
  created_at: string;
  batch_number: string | null;
  tester_name: string | null;
  tester_department: string | null;
  is_periodic?: boolean;
  periodic_schedule_id?: string | null;
  periodic_run_number?: number | null;
}

interface ArticleScheduleSummary {
  id: string;
  frequency_type: string;
  frequency_value: number;
  total_occurrences: number | null;
  completed_occurrences: number;
  next_due_date: string | null;
  schedule_status: string;
}

interface TestBatch {
  id: number;
  batch_number: string;
  batch_date: string;
  notes: string | null;
  status: string;
  test_count: number;
  completed_tests: number;
  created_at: string;
}

interface ArticleDetails {
  id: number;
  article_number: string;
  article_name: string;
  material_type: string | null;
  color: string | null;
  description: string | null;
  specifications: any;
  status: 'active' | 'inactive' | null;
  created_at: string;
  updated_at: string;
  client_id: number;
  batches: TestBatch[];
  tests: ArticleTest[];
}

interface ArticleDetailsProps {
  clientId: number;
  articleId: number;
  clientName: string;
  onBack: () => void;
}

export default function ArticleDetails({ clientId, articleId, clientName, onBack }: ArticleDetailsProps) {
  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [testers, setTesters] = useState<Array<{id: string; name: string; department: string}>>([]);
  const [loadingTesters, setLoadingTesters] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [savingTests, setSavingTests] = useState<Set<string>>(new Set());
  const [selectedResultTest, setSelectedResultTest] = useState<ArticleTest | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [reportActionState, setReportActionState] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [articleSchedules, setArticleSchedules] = useState<ArticleScheduleSummary[]>([]);
  const [scheduleModalTest, setScheduleModalTest] = useState<ArticleTest | null>(null);
  const [scheduleDrawerId, setScheduleDrawerId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticleDetails();
    fetchTesters();
  }, [clientId, articleId]);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/periodic/schedules?articleId=${encodeURIComponent(String(articleId))}`);
        if (res.ok) {
          const data = await res.json();
          setArticleSchedules(Array.isArray(data) ? data : []);
        }
      } catch {
        setArticleSchedules([]);
      }
    };
    loadSchedules();
  }, [articleId]);

  const getScheduleForTest = (test: ArticleTest): ArticleScheduleSummary | null => {
    if (!test.periodic_schedule_id) return null;
    return articleSchedules.find((s) => s.id === test.periodic_schedule_id) || null;
  };

  const refreshArticleAndSchedules = async () => {
    await fetchArticleDetails();
    try {
      const res = await fetch(`http://localhost:5000/api/periodic/schedules?articleId=${encodeURIComponent(String(articleId))}`);
      if (res.ok) {
        const data = await res.json();
        setArticleSchedules(Array.isArray(data) ? data : []);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchTesters = async () => {
    setLoadingTesters(true);
    try {
      const response = await fetch('http://localhost:5000/api/clients/users?role=tester');
      if (response.ok) {
        const testersData = await response.json();
        setTesters(testersData);
      } else {
        console.error('Failed to fetch testers');
      }
    } catch (error) {
      console.error('Error fetching testers:', error);
    } finally {
      setLoadingTesters(false);
    }
  };

  const fetchArticleDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/articles/${articleId}`);
      if (response.ok) {
        const articleData = await response.json();
        setArticle(articleData);
      } else {
        console.error('Failed to fetch article details');
      }
    } catch (error) {
      console.error('Error fetching article details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTest = async (testId: string, updates: Partial<ArticleTest>) => {
    console.log('🔄 Updating test:', testId, updates);
    
    // Validate required fields before sending to backend
    const validatedUpdates: Partial<ArticleTest> = { ...updates };

    const statusProvided = Object.prototype.hasOwnProperty.call(validatedUpdates, 'status');
    const assignedTesterProvided = Object.prototype.hasOwnProperty.call(validatedUpdates, 'assigned_tester_id');
    
    // Don't send empty test_name to backend
    if ('test_name' in validatedUpdates && (!validatedUpdates.test_name || validatedUpdates.test_name.trim() === '')) {
      console.warn('⚠️ Skipping empty test_name update');
      delete validatedUpdates.test_name;
    }
    
    // If no valid updates remain, just update local state
    if (Object.keys(validatedUpdates).length === 0) {
      setArticle(prev => prev ? {
        ...prev,
        tests: prev.tests.map(test => 
          test.id === testId ? { ...test, ...validatedUpdates } : test
        )
      } : null);
      return;
    }
    
    const originalTestSnapshot = article?.tests.find(t => t.id === testId);
    const originalSnapshot = originalTestSnapshot ? { ...originalTestSnapshot } : null;

    // Add to saving state
    setSavingTests(prev => new Set(prev).add(testId));
    
    try {
      // Update local state immediately for responsive UI
      setArticle(prev => prev ? {
        ...prev,
        tests: prev.tests.map(test => 
          test.id === testId
            ? (() => {
                const nextTest = { ...test, ...validatedUpdates };

                // Mirror backend auto status + tester derived fields when assigned_tester_id changes.
                if (assignedTesterProvided) {
                  const assignedTesterIdAny = validatedUpdates.assigned_tester_id as any;
                  const hasTester =
                    assignedTesterIdAny !== null &&
                    assignedTesterIdAny !== undefined &&
                    assignedTesterIdAny !== '';

                  if (!statusProvided) {
                    const currentStatus = test.status;
                    if (hasTester && (currentStatus === 'pending' || currentStatus === 'assigned')) {
                      nextTest.status = 'assigned';
                    }
                    if (!hasTester && currentStatus === 'assigned') {
                      nextTest.status = 'pending';
                    }
                  }

                  if (hasTester) {
                    const testerIdStr = String(validatedUpdates.assigned_tester_id);
                    const tester = testers.find(t => String(t.id) === testerIdStr);
                    nextTest.tester_name = tester?.name ?? test.tester_name;
                    nextTest.tester_department = tester?.department ?? test.tester_department;
                  } else {
                    nextTest.tester_name = null;
                    nextTest.tester_department = null;
                  }
                }

                return nextTest;
              })()
            : test
        )
      } : null);

      // Save to backend with validated updates
      const response = await fetch(`http://localhost:5000/api/article-tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedUpdates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to update test:', errorText);
        alert(`Failed to update test: ${errorText}`);

        // Revert optimistic UI on error.
        if (originalSnapshot) {
          setArticle(prev => prev ? {
            ...prev,
            tests: prev.tests.map(test => (test.id === testId ? originalSnapshot : test)),
          } : null);
        }
      } else {
        console.log('✅ Test updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating test:', error);
      alert(`Error updating test: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Revert optimistic UI on error.
      if (originalSnapshot) {
        setArticle(prev => prev ? {
          ...prev,
          tests: prev.tests.map(test => (test.id === testId ? originalSnapshot : test)),
        } : null);
      }
    } finally {
      // Remove from saving state
      setSavingTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'assigned': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'submitted': return 'bg-purple-100 text-purple-700';
      case 'pass': return 'bg-green-100 text-green-700';
      case 'fail': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'assigned': return <User className="w-3 h-3" />;
      case 'in_progress': return <AlertCircle className="w-3 h-3" />;
      case 'submitted': return <FileText className="w-3 h-3" />;
      case 'pass': return <CheckCircle className="w-3 h-3" />;
      case 'fail': return <AlertCircle className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getPhotosFromTest = (test: ArticleTest): Array<{ slot: number; label: string; url: string }> => {
    const parsed = test.result_data && typeof test.result_data === 'string' ? (() => { try { return JSON.parse(test.result_data); } catch { return null; } })() : test.result_data;
    return Array.isArray(parsed?.photos) ? parsed.photos : [];
  };

  const generateReport = async (testId: string, regenerate = false) => {
    setReportActionState((prev) => ({ ...prev, [testId]: 'loading' }));
    const endpoint = regenerate ? 'regenerate-report' : 'generate-report';
    try {
      const response = await fetch(`http://localhost:5000/api/article-tests/${testId}/${endpoint}`, { method: 'POST' });
      if (!response.ok) {
        setReportActionState((prev) => ({ ...prev, [testId]: 'error' }));
        return;
      }
      const data = await response.json();
      setArticle((prev) => prev ? ({
        ...prev,
        tests: prev.tests.map((t) => t.id === testId ? {
          ...t,
          report_generated: true,
          report_url: data.reportUrl,
          report_number: data.reportNumber,
          report_generated_at: new Date().toISOString()
        } : t)
      }) : null);
      setReportActionState((prev) => ({ ...prev, [testId]: 'success' }));
    } catch {
      setReportActionState((prev) => ({ ...prev, [testId]: 'error' }));
    }
  };

  const downloadReport = (testId: string) => {
    window.open(`http://localhost:5000/api/article-tests/${testId}/download-report`, '_blank');
  };

  const filteredTests = article?.tests.filter(test => {
    if (selectedBatch === 'all') return true;
    if (selectedBatch === 'no-batch') return !test.batch_number;
    return test.batch_number === selectedBatch;
  }) || [];

  const periodicScheduleIdsOnArticle = useMemo(
    () =>
      [...new Set((article?.tests || []).map((t) => t.periodic_schedule_id).filter(Boolean))] as string[],
    [article?.tests]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading article details...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Article not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Articles</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{article.article_number}</h2>
            <p className="text-slate-600">{clientName} - {article.article_name}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
          article.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
        }`}>
          <Package className="w-4 h-4" />
          <span>{(article.status || 'unknown').toUpperCase()}</span>
        </span>
      </div>

      {/* Article Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Article Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Article Number</p>
            <p className="font-medium text-slate-900">{article.article_number}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Article Name</p>
            <p className="font-medium text-slate-900">{article.article_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Material Type</p>
            <p className="font-medium text-slate-900">{article.material_type || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Color</p>
            <p className="font-medium text-slate-900">{article.color || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Tests</p>
            <p className="font-medium text-slate-900">{article.tests.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Test Batches</p>
            <p className="font-medium text-slate-900">{article.batches.length}</p>
          </div>
        </div>
        {article.description && (
          <div className="mt-4">
            <p className="text-sm text-slate-600">Description</p>
            <p className="mt-1 text-slate-900">{article.description}</p>
          </div>
        )}
      </div>

      {periodicScheduleIdsOnArticle.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/90 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-violet-950">Periodic testing — all runs &amp; reports</h3>
              <p className="mt-1 text-sm text-violet-900/90">
                Every completed cycle keeps its own assignment row and CoA. Open the schedule for a single place to see
                run history, results, and downloadable reports for each cycle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {periodicScheduleIdsOnArticle.map((sid) => (
                <button
                  key={sid}
                  type="button"
                  onClick={() => setScheduleDrawerId(sid)}
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 shadow-sm hover:bg-violet-100"
                >
                  <RotateCw className="h-4 w-4" />
                  View schedule &amp; all CoAs
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Batches */}
      {article.batches.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Test Batches</h3>
            <button
              onClick={() => setShowNewBatchModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Batch</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {article.batches.map((batch) => (
              <div key={batch.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{batch.batch_number}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    batch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {batch.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Date: {new Date(batch.batch_date).toLocaleDateString()}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tests: {batch.test_count}</span>
                  <span className="text-slate-600">Completed: {batch.completed_tests}</span>
                </div>
                {batch.notes && (
                  <p className="text-xs text-slate-500 mt-2">{batch.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-slate-700">Filter by Batch:</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm"
          >
            <option value="all">All Tests</option>
            <option value="no-batch">No Batch</option>
            {article.batches.map((batch) => (
              <option key={batch.id} value={batch.batch_number}>
                {batch.batch_number}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-600">
            Showing {filteredTests.length} of {article.tests.length} tests
          </span>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Test Details</h3>
          <p className="text-slate-600">Manage and track individual test progress for this article</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Standard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Execution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Inhouse Test ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor/Tester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredTests.map((test) => {
                const sched = getScheduleForTest(test);
                return (
                <tr key={test.id} className="hover:bg-slate-50">
                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={test.test_name}
                      onChange={(e) => updateTest(test.id, { test_name: e.target.value })}
                      className="w-full px-2 py-1 text-sm font-medium text-slate-900 border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    {test.inhouse_test_id && (
                      <p className="text-xs text-slate-500 mt-1">ID: {test.inhouse_test_id}</p>
                    )}
                    {sched && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800">
                          <RotateCw className="h-3 w-3 shrink-0" />
                          Periodic
                          {sched.frequency_value ? ` · every ${sched.frequency_value}d` : ''}
                          {typeof test.periodic_run_number === 'number'
                            ? ` · run ${test.periodic_run_number}/${sched.total_occurrences ?? '∞'}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      test.batch_number ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {test.batch_number || 'No Batch'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={test.test_standard || ''}
                      onChange={(e) => updateTest(test.id, { test_standard: e.target.value })}
                      className="w-full px-2 py-1 text-xs font-mono bg-slate-100 border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Method code"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <textarea
                      value={test.client_requirement || ''}
                      onChange={(e) => updateTest(test.id, { client_requirement: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      placeholder="Client requirements..."
                    />
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={test.category}
                      onChange={(e) => updateTest(test.id, { category: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Raw Material">Raw Material</option>
                      <option value="Work In Progress">Work In Progress</option>
                      <option value="Finished Good">Finished Good</option>
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateTest(test.id, { execution_type: 'inhouse' })}
                        className={`px-2 py-1 text-xs font-medium flex-1 ${
                          test.execution_type === 'inhouse'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        In-House
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTest(test.id, { execution_type: 'outsource' })}
                        className={`px-2 py-1 text-xs font-medium flex-1 ${
                          test.execution_type === 'outsource'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Outsource
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTest(test.id, { execution_type: 'both' })}
                        className={`px-2 py-1 text-xs font-medium flex-1 ${
                          test.execution_type === 'both'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Both
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' || test.execution_type === 'both' ? (
                      <div>
                        <select
                          value={test.inhouse_test_id || ''}
                          onChange={(e) => updateTest(test.id, { inhouse_test_id: e.target.value || '' })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {INHOUSE_TEST_OPTIONS.map((option) => (
                            <option key={option.id || 'null'} value={option.id || ''}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {test.inhouse_test_id && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mapped
                          </span>
                        )}
                        {test.execution_type === 'both' && (
                          <div className="space-y-2 mt-2">
                            <input
                              type="text"
                              value={test.vendor_name || ''}
                              onChange={(e) => updateTest(test.id, { vendor_name: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              placeholder="Vendor name"
                            />
                            <input
                              type="email"
                              value={test.vendor_email || ''}
                              onChange={(e) => updateTest(test.id, { vendor_email: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              placeholder="Vendor email"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' || test.execution_type === 'both' ? (
                      test.assigned_tester_id ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{test.tester_name}</p>
                            <p className="text-xs text-slate-500">{test.tester_department}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateTest(test.id, { assigned_tester_id: null })}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <select
                          value={test.assigned_tester_id || ''}
                          onChange={(e) => updateTest(test.id, { assigned_tester_id: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          disabled={loadingTesters}
                        >
                          <option value="">Select Tester</option>
                          {testers.map((tester) => (
                            <option key={tester.id} value={tester.id}>
                              {tester.name} - {tester.department}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={test.vendor_name || ''}
                          onChange={(e) => updateTest(test.id, { vendor_name: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Vendor name"
                        />
                        <input
                          type="email"
                          value={test.vendor_email || ''}
                          onChange={(e) => updateTest(test.id, { vendor_email: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Vendor email"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' || test.execution_type === 'both' ? (
                      <>
                        {test.test_deadline ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-600">
                                {new Date(test.test_deadline).toLocaleDateString()}
                              </span>
                              <p className="text-xs text-slate-400">Test Deadline</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateTest(test.id, { test_deadline: null })}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="date"
                            value={test.test_deadline || ''}
                            onChange={(e) =>
                              updateTest(test.id, { test_deadline: e.target.value ? e.target.value : null })
                            }
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Test deadline"
                          />
                        )}
                        {test.execution_type === 'both' && (
                          <div className="mt-2">
                            <input
                              type="date"
                              value={test.expected_report_date || ''}
                              onChange={(e) =>
                                updateTest(test.id, { expected_report_date: e.target.value ? e.target.value : null })
                              }
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              placeholder="Expected report date"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      test.expected_report_date ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-600">
                              {new Date(test.expected_report_date).toLocaleDateString()}
                            </span>
                            <p className="text-xs text-slate-400">Report Date</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateTest(test.id, { expected_report_date: null })}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="date"
                          value={test.expected_report_date || ''}
                          onChange={(e) =>
                            updateTest(test.id, { expected_report_date: e.target.value ? e.target.value : null })
                          }
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Expected report date"
                        />
                      )
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 w-fit ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)}
                      <span>{(test.status || 'unknown').replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {(test.execution_type === 'inhouse' || test.execution_type === 'both') && (
                        <>
                          {!test.periodic_schedule_id ? (
                            <button
                              type="button"
                              onClick={() => setScheduleModalTest(test)}
                              className="inline-flex items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-800 hover:bg-violet-100"
                              title="Set periodic schedule"
                            >
                              <Calendar className="h-3 w-3 shrink-0" />
                              Set schedule
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setScheduleDrawerId(test.periodic_schedule_id!)}
                              className="inline-flex items-center gap-1 rounded border border-violet-200 px-2 py-1 text-xs text-violet-800 hover:bg-violet-50"
                              title="View periodic schedule"
                            >
                              <RotateCw className="h-3 w-3 shrink-0" />
                              View schedule
                            </button>
                          )}
                        </>
                      )}
                      {savingTests.has(test.id) ? (
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-green-600">✓ Auto-saved</span>
                      )}
                      {(test.status === 'submitted' || test.result) && (
                        <button
                          onClick={() => setSelectedResultTest(test)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          title="View Result"
                        >
                          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> View Result</span>
                        </button>
                      )}
                      {(test.execution_type === 'inhouse' || test.execution_type === 'both') && test.status === 'submitted' && (
                        <div className="flex flex-col items-start gap-1">
                          {reportActionState[test.id] === 'loading' ? (
                            <button disabled className="rounded border border-green-600 px-2 py-1 text-xs text-green-700 opacity-70">Generating CoA...</button>
                          ) : (test.report_generated || reportActionState[test.id] === 'success') ? (
                            <>
                              <button
                                onClick={() => downloadReport(test.id)}
                                className="rounded bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-800"
                              >
                                <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" /> Download Report</span>
                              </button>
                              <button
                                onClick={() => generateReport(test.id, true)}
                                className="text-xs text-slate-400 underline"
                              >
                                Regenerate
                              </button>
                            </>
                          ) : reportActionState[test.id] === 'error' ? (
                            <div className="text-xs text-red-600">
                              Generation Failed{' '}
                              <button onClick={() => generateReport(test.id, false)} className="underline">Retry</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => generateReport(test.id, false)}
                              className="rounded border border-green-600 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                            >
                              Generate Report
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal */}
      {showNewBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Create New Test Batch</h3>
              <button
                onClick={() => setShowNewBatchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const batchNumber = formData.get('batchNumber') as string;
              const batchDate = formData.get('batchDate') as string;
              const notes = formData.get('notes') as string;
              
              // Here you would typically call an API to create the batch
              console.log('Creating batch:', { batchNumber, batchDate, notes });
              alert('Batch creation functionality needs to be implemented in the backend');
              setShowNewBatchModal(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    name="batchNumber"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., BATCH-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Batch Date
                  </label>
                  <input
                    type="date"
                    name="batchDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Optional notes about this batch..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedResultTest && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedResultTest(null)} />
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Test Result</h3>
              <button onClick={() => setSelectedResultTest(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-slate-700">Test:</span> {selectedResultTest.test_name}</div>
              <div><span className="font-medium text-slate-700">Submitted By:</span> {selectedResultTest.tester_name || 'N/A'}</div>
              <div><span className="font-medium text-slate-700">Submitted At:</span> {selectedResultTest.submitted_at ? new Date(selectedResultTest.submitted_at).toLocaleString() : 'N/A'}</div>
              <div>
                <span className="font-medium text-slate-700">Final Result:</span>{' '}
                <span className={`rounded px-2 py-1 text-xs font-semibold ${selectedResultTest.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedResultTest.result || 'N/A'}
                </span>
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-700">Measurement & Calculated Data</p>
                <pre className="max-h-72 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(
                    typeof selectedResultTest.result_data === 'string'
                      ? (() => { try { return JSON.parse(selectedResultTest.result_data); } catch { return selectedResultTest.result_data; } })()
                      : selectedResultTest.result_data,
                    null,
                    2
                  )}
                </pre>
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-700">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {getPhotosFromTest(selectedResultTest).map((p) => (
                    <button key={p.slot} className="overflow-hidden rounded border border-slate-200" onClick={() => setLightboxPhoto(`http://localhost:5000${p.url}`)}>
                      <img src={`http://localhost:5000${p.url}`} alt={p.label} className="h-24 w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6" onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto} alt="Result photo" className="max-h-full max-w-full rounded border border-white/30" />
        </div>
      )}

      <PeriodicScheduleModal
        isOpen={!!scheduleModalTest}
        onClose={() => setScheduleModalTest(null)}
        articleTest={
          scheduleModalTest
            ? {
                id: scheduleModalTest.id,
                test_name: scheduleModalTest.test_name,
                test_standard: scheduleModalTest.test_standard,
                client_requirement: scheduleModalTest.client_requirement
              }
            : { id: '', test_name: '', test_standard: '', client_requirement: '' }
        }
        defaultTesterId={
          scheduleModalTest?.assigned_tester_id != null ? String(scheduleModalTest.assigned_tester_id) : null
        }
        testers={testers}
        onSaved={refreshArticleAndSchedules}
      />

      <PeriodicScheduleDrawer
        scheduleId={scheduleDrawerId}
        onClose={() => setScheduleDrawerId(null)}
        onUpdated={refreshArticleAndSchedules}
      />
    </div>
  );
}
