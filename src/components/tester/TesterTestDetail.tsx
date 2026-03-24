'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Package, FileText, Clock, AlertCircle, Play, CheckCircle } from 'lucide-react';
import TesterReferenceCalculator from './TesterReferenceCalculator';
import ManualTestInput from './ManualTestInput';

interface TesterTestDetail {
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

interface TesterTestDetailProps {
  orderTestId: string;
  onBack: () => void;
}

export default function TesterTestDetail({ orderTestId, onBack }: TesterTestDetailProps) {
  const [test, setTest] = useState<TesterTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestDetail();
  }, [orderTestId]);

  const fetchTestDetail = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tester/my-tests/${orderTestId}`);
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
      setError('Failed to fetch test details');
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
      }
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const getStatusBadge = (status: TesterTestDetail['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600', icon: Clock },
      assigned: { label: 'Pending', className: 'bg-slate-100 text-slate-600', icon: Clock },
      in_progress: { label: 'In Progress', className: 'bg-green-50 text-green-700', icon: AlertCircle },
      submitted: { label: 'Submitted', className: 'bg-green-600 text-white', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      'Raw Material': { label: 'Raw Material', className: 'bg-slate-100 text-slate-700' },
      'Work In Progress': { label: 'Work In Progress', className: 'bg-slate-100 text-slate-700' },
      'Finished Good': { label: 'Finished Good', className: 'bg-green-50 text-green-700' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig['Work In Progress'];
    return (
      <span className={`px-3 py-1 rounded text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getDeadlineInfo = (deadline: string | null, status: TesterTestDetail['status']) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let className = 'text-slate-900';
    let warning = '';
    
    if (diffDays < 0 && status !== 'submitted') {
      className = 'text-red-600';
      warning = 'Overdue';
    } else if (diffDays <= 3) {
      className = 'text-orange-600';
      warning = 'Due very soon';
    } else if (diffDays <= 7) {
      className = 'text-amber-600';
      warning = 'Due soon';
    }
    
    return {
      date: deadlineDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      daysRemaining: diffDays,
      className,
      warning
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Test Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800">Error</span>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const deadlineInfo = getDeadlineInfo(test.test_deadline, test.status);

  return (
    <div className="p-8">
      {/* DEBUG SECTION - SHOULD ALWAYS BE VISIBLE */}
      <div className="bg-yellow-100 border-4 border-yellow-500 rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold text-yellow-900">🐛 DEBUG SECTION - Are you seeing this?</h2>
        <p className="text-yellow-800">Test ID: {test?.id}</p>
        <p className="text-yellow-800">Test Standard: {test?.test_standard}</p>
        <p className="text-yellow-800">Status: {test?.status}</p>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{test.test_name}</h1>
          <p className="text-slate-600">{test.test_standard}</p>
        </div>
        <div className="flex items-center space-x-4">
          {getStatusBadge(test.status)}
          {test.status === 'pending' || test.status === 'assigned' ? (
            <button
              onClick={handleStartTest}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Identity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Test Identity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Test ID</label>
                <p className="text-black font-medium">{test.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Test Name</label>
                <p className="text-black font-medium">{test.test_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Standard Method</label>
                <p className="text-black font-medium">{test.test_standard}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <div>{getCategoryBadge(test.category)}</div>
              </div>
            </div>
          </div>

          {/* Test Deadline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Test Deadline</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Assigned On</label>
                <p className="text-black font-medium">
                  {new Date(test.assigned_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Deadline</label>
                {deadlineInfo ? (
                  <div>
                    <p className={`font-medium ${deadlineInfo.className}`}>
                      {deadlineInfo.date}
                    </p>
                    <p className={`text-sm ${deadlineInfo.className}`}>
                      {deadlineInfo.daysRemaining > 0 
                        ? `${deadlineInfo.daysRemaining} days remaining`
                        : deadlineInfo.daysRemaining === 0
                        ? 'Due today'
                        : `${Math.abs(deadlineInfo.daysRemaining)} days overdue`
                      }
                      {deadlineInfo.warning && ` (${deadlineInfo.warning})`}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No deadline set</p>
                )}
              </div>
            </div>
            
            {test.admin_notes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-gray-600 mb-2">Assignment Notes</label>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-black font-medium">{test.admin_notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Product Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Product Name</label>
                <p className="text-black font-medium">{test.product_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Article Number</label>
                <p className="text-black font-medium">{test.article_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Material Type</label>
                <p className="text-black font-medium">{test.material_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Color</label>
                <p className="text-black font-medium">{test.color}</p>
              </div>
            </div>
          </div>

          {/* Client Requirement */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Client Requirement</h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-black font-medium leading-relaxed">{test.client_requirement}</p>
            </div>
          </div>

          {/* 🎯 TEST INPUT SECTION - IMMEDIATELY VISIBLE */}
          <div className="bg-red-100 border-4 border-red-500 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-red-900">🧪 TEST INPUT SECTION - VISIBLE NOW?</h2>
            </div>
            <p className="text-lg text-red-700 mb-4">If you can see this RED section, the input forms are working!</p>
            
            {/* Simple Test Input */}
            <div className="bg-white rounded-lg p-4 border-2 border-red-300">
              <h3 className="font-bold text-lg mb-3">Quick Test Input:</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Value 1:</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border-2 border-red-400 rounded"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Test Value 2:</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border-2 border-red-400 rounded"
                    placeholder="Enter value"
                  />
                </div>
              </div>
              <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
                Calculate Result
              </button>
            </div>
          </div>

          {/* 🧪 TEST INPUT SECTION - IMPROVED UI */}
          <div style={{
            backgroundColor: '#f0f9ff', 
            border: '3px solid #0ea5e9', 
            borderRadius: '12px', 
            padding: '24px', 
            margin: '16px 0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px',
              borderBottom: '2px solid #0ea5e9',
              paddingBottom: '12px'
            }}>
              <div style={{
                width: '8px', 
                height: '8px', 
                backgroundColor: '#0ea5e9', 
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <h2 style={{
                fontSize: '22px', 
                fontWeight: 'bold', 
                color: '#0c4a6e', 
                margin: 0
              }}>
                🧪 Test Results Input & Calculator
              </h2>
            </div>
            
            <div style={{
              backgroundColor: '#e0f2fe', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #bae6fd'
            }}>
              <p style={{
                color: '#0c4a6e', 
                margin: 0,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <strong>Test:</strong> {test.test_standard} | 
                <strong> Client Requirement:</strong> {test.client_requirement}
              </p>
            </div>
            
            {/* Input Form */}
            <div style={{
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '2px solid #0ea5e9',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#0c4a6e',
                fontSize: '18px'
              }}>
                📝 Enter Test Measurements:
              </h3>
              
              <div style={{
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    color: '#0c4a6e',
                    fontSize: '14px'
                  }}>
                    Phenol Value (mg/kg):
                  </label>
                  <input 
                    type="number" 
                    placeholder="Enter phenol measurement"
                    style={{
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '2px solid #cbd5e1', 
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <div style={{
                    color: '#64748b', 
                    fontSize: '12px', 
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    ⚠️ Client spec: &lt;25 mg/kg
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    color: '#0c4a6e',
                    fontSize: '14px'
                  }}>
                    Others Value (mg/kg):
                  </label>
                  <input 
                    type="number" 
                    placeholder="Enter others measurement"
                    style={{
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '2px solid #cbd5e1', 
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <div style={{
                    color: '#64748b', 
                    fontSize: '12px', 
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    ⚠️ Client spec: &lt;40 mg/kg
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    color: '#0c4a6e',
                    fontSize: '14px'
                  }}>
                    NP/OP Value (mg/kg):
                  </label>
                  <input 
                    type="number" 
                    placeholder="Enter NP/OP measurement"
                    style={{
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '2px solid #cbd5e1', 
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <div style={{
                    color: '#64748b', 
                    fontSize: '12px', 
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    ⚠️ Client spec: &lt;20 mg/kg
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    color: '#0c4a6e',
                    fontSize: '14px'
                  }}>
                    Test Notes & Observations:
                  </label>
                  <textarea 
                    placeholder="Enter any observations, notes, or comments..."
                    rows={3}
                    style={{
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '2px solid #cbd5e1', 
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      resize: 'vertical',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>
              
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button 
                  style={{
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)'
                  }}
                  onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#0284c7'}
                  onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#0ea5e9'}
                  onClick={() => {
                    alert('🧮 Test calculation logic would run here!\n\nThis would:\n1. Compare your values against client specs\n2. Calculate PASS/FAIL for each parameter\n3. Show detailed results with explanations');
                  }}
                >
                  🧮 Calculate Pass/Fail Result
                </button>
                
                <div style={{
                  color: '#64748b', 
                  fontSize: '12px',
                  fontStyle: 'italic'
                }}>
                  💡 Results will appear below after calculation
                </div>
              </div>
              
              <div id="results-section" style={{
                marginTop: '16px', 
                padding: '16px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '6px',
                border: '2px dashed #0ea5e9',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  📊 Calculation results will appear here
                </div>
                <div style={{
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  Enter test values and click "Calculate" to see PASS/FAIL results
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={onBack}
                className="w-full flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to My Tests</span>
              </button>
              
              {test.status === 'pending' || test.status === 'assigned' ? (
                <button
                  onClick={handleStartTest}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Test</span>
                </button>
              ) : test.status === 'in_progress' ? (
                <button
                  disabled
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-slate-400 text-white rounded-lg cursor-not-allowed"
                  title="Result entry coming soon"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Result</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Test Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Test Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Order Number:</span>
                <span className="font-medium text-slate-900">{test.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <div>{getStatusBadge(test.status)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Category:</span>
                <div>{getCategoryBadge(test.category)}</div>
              </div>
              {deadlineInfo && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Days Remaining:</span>
                  <span className={`font-medium ${deadlineInfo.className}`}>
                    {deadlineInfo.daysRemaining > 0 
                      ? deadlineInfo.daysRemaining
                      : deadlineInfo.daysRemaining === 0
                      ? 'Due today'
                      : 'Overdue'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
