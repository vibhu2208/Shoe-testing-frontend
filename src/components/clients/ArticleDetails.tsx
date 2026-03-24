'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Calendar, User, Building2, FileText, Clock, CheckCircle, AlertCircle, Package, Eye } from 'lucide-react';

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
  id: number;
  test_name: string;
  test_standard: string;
  client_requirement: string;
  category: string;
  execution_type: 'inhouse' | 'outsource';
  inhouse_test_id: string;
  vendor_name: string;
  vendor_contact: string;
  vendor_email: string;
  expected_report_date: string | null;
  assigned_tester_id: number | null;
  test_deadline: string | null;
  status: 'pending' | 'in_progress' | 'submitted' | 'pass' | 'fail' | null;
  result: string | null;
  result_data: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  batch_number: string | null;
  tester_name: string | null;
  tester_department: string | null;
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
  const [savingTests, setSavingTests] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchArticleDetails();
    fetchTesters();
  }, [clientId, articleId]);

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

  const updateTest = async (testId: number, updates: Partial<ArticleTest>) => {
    console.log('🔄 Updating test:', testId, updates);
    
    // Validate required fields before sending to backend
    const validatedUpdates = { ...updates };
    
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
          test.id === testId ? { ...test, ...updates } : test
        )
      } : null);
      return;
    }
    
    // Add to saving state
    setSavingTests(prev => new Set(prev).add(testId));
    
    try {
      // Update local state immediately for responsive UI
      setArticle(prev => prev ? {
        ...prev,
        tests: prev.tests.map(test => 
          test.id === testId ? { ...test, ...updates } : test
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
        // Revert local state on error
        setArticle(prev => prev ? {
          ...prev,
          tests: prev.tests.map(test => 
            test.id === testId ? { ...test, ...Object.keys(updates).reduce((acc, key) => {
              // This is a simple revert - in production you'd want to store original values
              return acc;
            }, {}) } : test
          )
        } : null);
        
        const errorText = await response.text();
        console.error('❌ Failed to update test:', errorText);
        alert(`Failed to update test: ${errorText}`);
      } else {
        console.log('✅ Test updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating test:', error);
      alert(`Error updating test: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      case 'in_progress': return <AlertCircle className="w-3 h-3" />;
      case 'submitted': return <FileText className="w-3 h-3" />;
      case 'pass': return <CheckCircle className="w-3 h-3" />;
      case 'fail': return <AlertCircle className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const filteredTests = article?.tests.filter(test => {
    if (selectedBatch === 'all') return true;
    if (selectedBatch === 'no-batch') return !test.batch_number;
    return test.batch_number === selectedBatch;
  }) || [];

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
            <p className="font-medium">{article.article_number}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Article Name</p>
            <p className="font-medium">{article.article_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Material Type</p>
            <p className="font-medium">{article.material_type || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Color</p>
            <p className="font-medium">{article.color || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Tests</p>
            <p className="font-medium">{article.tests.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Test Batches</p>
            <p className="font-medium">{article.batches.length}</p>
          </div>
        </div>
        {article.description && (
          <div className="mt-4">
            <p className="text-sm text-slate-600">Description</p>
            <p className="mt-1 text-slate-900">{article.description}</p>
          </div>
        )}
      </div>

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
              {filteredTests.map((test) => (
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
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' ? (
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
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' ? (
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
                    {test.execution_type === 'inhouse' ? (
                      test.test_deadline ? (
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
                          onChange={(e) => updateTest(test.id, { test_deadline: e.target.value || '' })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Test deadline"
                        />
                      )
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
                          onChange={(e) => updateTest(test.id, { expected_report_date: e.target.value || '' })}
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
                    <div className="flex items-center space-x-2">
                      {savingTests.has(test.id) ? (
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-green-600">✓ Auto-saved</span>
                      )}
                      <button
                        onClick={() => {
                          const currentTest = article?.tests.find(t => t.id === test.id);
                          if (currentTest) {
                            console.log('Current test data:', currentTest);
                            alert(`Test: ${currentTest.test_name}\nStatus: ${currentTest.status}\nExecution: ${currentTest.execution_type}\nCategory: ${currentTest.category}`);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="View test details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
