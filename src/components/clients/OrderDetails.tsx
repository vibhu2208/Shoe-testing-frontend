'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Calendar, User, Building2, FileText, Clock, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

interface OrderTest {
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
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted' | 'pass' | 'fail' | null;
  result: string | null;
  result_data: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
}

interface OrderDetails {
  id: number;
  order_number: string;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | null;
  created_at: string;
  updated_at: string;
  client_id: number;
  tests: OrderTest[];
}

interface OrderDetailsProps {
  clientId: number;
  orderId: number;
  clientName: string;
  onBack: () => void;
}

export default function OrderDetails({ clientId, orderId, clientName, onBack }: OrderDetailsProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTest, setEditingTest] = useState<number | null>(null);
  const [editedTest, setEditedTest] = useState<OrderTest | null>(null);
  const [testers, setTesters] = useState<Array<{id: string; name: string; department: string}>>([]);
  const [loadingTesters, setLoadingTesters] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningTest, setAssigningTest] = useState<OrderTest | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    tester_id: '',
    deadline: '',
    notes: ''
  });
  const [selectedTests, setSelectedTests] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchOrderDetails();
    fetchTesters();
  }, [clientId, orderId]);

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

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        console.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTest = (test: OrderTest) => {
    setEditingTest(test.id);
    setEditedTest({ ...test });
  };

  const handleSaveTest = async () => {
    if (!editedTest) return;

    try {
      console.log('💾 Saving test:', editedTest);
      
      const response = await fetch(`http://localhost:5000/api/clients/article-tests/${editedTest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedTest),
      });

      console.log('📡 Save response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test saved successfully:', result);
        
        // Update the local state
        setOrder(prev => prev ? {
          ...prev,
          tests: prev.tests.map(test => 
            test.id === editedTest.id ? editedTest : test
          )
        } : null);
        setEditingTest(null);
        setEditedTest(null);
        alert('Test updated successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update test:', errorText);
        alert(`Failed to update test: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error updating test:', error);
      alert(`Error updating test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setEditedTest(null);
  };

  const handleAssignTest = (test: OrderTest) => {
    setAssigningTest(test);
    setAssignmentData({
      tester_id: test.assigned_tester_id?.toString() || '',
      deadline: test.test_deadline || '',
      notes: ''
    });
    setAssignModalOpen(true);
  };

  const handleAssignmentSave = async () => {
    if (!assigningTest) return;

    try {
      const response = await fetch(`http://localhost:5000/api/clients/article-tests/${assigningTest.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tester_id: assignmentData.tester_id || null,
          deadline: assignmentData.deadline || null,
          notes: assignmentData.notes || null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the local state
        setOrder(prev => prev ? {
          ...prev,
          tests: prev.tests.map(test => 
            test.id === assigningTest.id ? {
              ...test,
              assigned_tester_id: assignmentData.tester_id ? parseInt(assignmentData.tester_id) : null,
              test_deadline: assignmentData.deadline || null,
              status: assignmentData.tester_id ? 'assigned' : 'pending'
            } : test
          )
        } : null);
        
        setAssignModalOpen(false);
        setAssigningTest(null);
        setAssignmentData({ tester_id: '', deadline: '', notes: '' });
        alert('Test assigned successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to assign test:', errorText);
        alert(`Failed to assign test: ${errorText}`);
      }
    } catch (error) {
      console.error('Error assigning test:', error);
      alert(`Error assigning test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTests.size === 0) return;

    try {
      const response = await fetch('http://localhost:5000/api/clients/article-tests/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_test_ids: Array.from(selectedTests),
          tester_id: assignmentData.tester_id || null,
          deadline: assignmentData.deadline || null,
          notes: assignmentData.notes || null
        }),
      });

      if (response.ok) {
        // Update the local state for all selected tests
        setOrder(prev => prev ? {
          ...prev,
          tests: prev.tests.map(test => 
            selectedTests.has(test.id) ? {
              ...test,
              assigned_tester_id: assignmentData.tester_id ? parseInt(assignmentData.tester_id) : null,
              test_deadline: assignmentData.deadline || null,
              status: assignmentData.tester_id ? 'assigned' : 'pending'
            } : test
          )
        } : null);
        
        setAssignModalOpen(false);
        setSelectedTests(new Set());
        setAssignmentData({ tester_id: '', deadline: '', notes: '' });
        alert(`${selectedTests.size} tests assigned successfully!`);
      } else {
        const errorText = await response.text();
        console.error('Failed to bulk assign tests:', errorText);
        alert(`Failed to bulk assign tests: ${errorText}`);
      }
    } catch (error) {
      console.error('Error bulk assigning tests:', error);
      alert(`Error bulk assigning tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleTestSelection = (testId: number) => {
    setSelectedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const handleBulkAssignClick = () => {
    if (selectedTests.size === 0) return;
    
    setAssigningTest(null); // This indicates bulk assignment
    setAssignmentData({ tester_id: '', deadline: '', notes: '' });
    setAssignModalOpen(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Order not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
          Back to Orders
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
            <span>Back to Orders</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{order.order_number}</h2>
            <p className="text-slate-600">{clientName} - Order Details</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span>{(order.status || 'unknown').replace('_', ' ').toUpperCase()}</span>
        </span>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Order Number</p>
            <p className="font-medium">{order.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Created Date</p>
            <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Tests</p>
            <p className="font-medium">{order.tests.length}</p>
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Test Details</h3>
          <p className="text-slate-600">Manage and track individual test progress</p>
        </div>
        
        {/* Bulk Assignment Toolbar */}
        {selectedTests.size > 0 && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                {selectedTests.size} test{selectedTests.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkAssignClick}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                Assign Selected
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTests.size > 0 && selectedTests.size === order?.tests.filter(t => t.execution_type === 'inhouse').length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTests(new Set(order?.tests.filter(t => t.execution_type === 'inhouse').map(t => t.id) || []));
                      } else {
                        setSelectedTests(new Set());
                      }
                    }}
                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Standard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Execution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Tester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {order.tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {test.execution_type === 'inhouse' ? (
                      <input
                        type="checkbox"
                        checked={selectedTests.has(test.id)}
                        onChange={() => toggleTestSelection(test.id)}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <input
                        type="text"
                        value={editedTest?.test_name || ''}
                        onChange={(e) => setEditedTest(prev => prev ? { ...prev, test_name: e.target.value } : null)}
                        className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-900"
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-slate-900">{test.test_name}</p>
                        {test.inhouse_test_id && (
                          <p className="text-sm text-slate-500">ID: {test.inhouse_test_id}</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <input
                        type="text"
                        value={editedTest?.test_standard || ''}
                        onChange={(e) => setEditedTest(prev => prev ? { ...prev, test_standard: e.target.value } : null)}
                        className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-900"
                      />
                    ) : (
                      <p className="text-sm text-slate-600">{test.test_standard || 'N/A'}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <textarea
                        value={editedTest?.client_requirement || ''}
                        onChange={(e) => setEditedTest(prev => prev ? { ...prev, client_requirement: e.target.value } : null)}
                        className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-900"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-slate-600 max-w-xs truncate">{test.client_requirement}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <select
                        value={editedTest?.category || ''}
                        onChange={(e) => setEditedTest(prev => prev ? { ...prev, category: e.target.value } : null)}
                        className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-900"
                      >
                        <option value="Raw Material">Raw Material</option>
                        <option value="Work In Progress">Work In Progress</option>
                        <option value="Finished Good">Finished Good</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                        {test.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <div className="space-y-2">
                        <select
                          value={editedTest?.execution_type || ''}
                          onChange={(e) => setEditedTest(prev => prev ? { ...prev, execution_type: e.target.value as 'inhouse' | 'outsource' } : null)}
                          className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-900"
                        >
                          <option value="inhouse">In-house</option>
                          <option value="outsource">Outsource</option>
                        </select>
                        
                        {/* Show vendor fields when outsource is selected */}
                        {editedTest?.execution_type === 'outsource' && (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Vendor Name"
                              value={editedTest?.vendor_name || ''}
                              onChange={(e) => setEditedTest(prev => prev ? { ...prev, vendor_name: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                            />
                            <input
                              type="text"
                              placeholder="Vendor Contact"
                              value={editedTest?.vendor_contact || ''}
                              onChange={(e) => setEditedTest(prev => prev ? { ...prev, vendor_contact: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                            />
                            <input
                              type="email"
                              placeholder="Vendor Email"
                              value={editedTest?.vendor_email || ''}
                              onChange={(e) => setEditedTest(prev => prev ? { ...prev, vendor_email: e.target.value } : null)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          test.execution_type === 'inhouse' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {test.execution_type === 'inhouse' ? 'In-house' : 'Outsource'}
                        </span>
                        {test.execution_type === 'outsource' && test.vendor_name && (
                          <div className="mt-1 text-xs text-slate-600">
                            <p>{test.vendor_name}</p>
                            {test.vendor_contact && <p>{test.vendor_contact}</p>}
                            {test.vendor_email && <p>{test.vendor_email}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <div className="space-y-2">
                        {/* Tester Assignment - only for in-house tests */}
                        {editedTest?.execution_type === 'inhouse' ? (
                          <select
                            value={editedTest?.assigned_tester_id?.toString() || ''}
                            onChange={(e) => setEditedTest(prev => prev ? { ...prev, assigned_tester_id: e.target.value ? parseInt(e.target.value) : null } : null)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                            disabled={loadingTesters}
                          >
                            <option value="">Assign tester (optional)</option>
                            {testers.map((tester) => (
                              <option key={tester.id} value={tester.id.toString()}>
                                {tester.name} - {tester.department}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        {test.execution_type === 'inhouse' ? (
                          test.assigned_tester_id ? (
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {testers.find((t) => String(t.id) === String(test.assigned_tester_id))?.name || 'Unknown Tester'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {testers.find((t) => String(t.id) === String(test.assigned_tester_id))?.department || ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Unassigned</span>
                          )
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <div className="space-y-2">
                        {/* Test Deadline - only for in-house tests */}
                        {editedTest?.execution_type === 'inhouse' ? (
                          <input
                            type="date"
                            value={editedTest?.test_deadline || ''}
                            onChange={(e) => setEditedTest(prev => prev ? { ...prev, test_deadline: e.target.value || null } : null)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                          />
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        {test.execution_type === 'inhouse' && test.test_deadline ? (
                          <div>
                            <p className="text-sm text-slate-900">
                              {new Date(test.test_deadline).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            {(() => {
                              const deadline = new Date(test.test_deadline);
                              const today = new Date();
                              const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays < 0) {
                                return <p className="text-xs text-red-600">Overdue</p>;
                              } else if (diffDays <= 3) {
                                return <p className="text-xs text-amber-600">Due soon</p>;
                              }
                              return <p className="text-xs text-slate-500">{diffDays} days left</p>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {test.execution_type === 'inhouse' ? 'No deadline' : '—'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <div className="space-y-2">
                        <select
                          value={editedTest?.status || ''}
                          onChange={(e) => setEditedTest(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                          className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-900"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="submitted">Submitted</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                        
                        {/* Additional fields for comprehensive editing */}
                        <input
                          type="date"
                          placeholder="Expected Report Date"
                          value={editedTest?.expected_report_date || ''}
                          onChange={(e) => setEditedTest(prev => prev ? { ...prev, expected_report_date: e.target.value } : null)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                        />
                        
                        {/* Tester Assignment - only for in-house tests */}
                        {editedTest?.execution_type === 'inhouse' && (
                          <select
                            value={editedTest?.assigned_tester_id?.toString() || ''}
                            onChange={(e) => setEditedTest(prev => prev ? { ...prev, assigned_tester_id: e.target.value ? parseInt(e.target.value) : null } : null)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                            disabled={loadingTesters}
                          >
                            <option value="">Assign tester (optional)</option>
                            {testers.map((tester) => (
                              <option key={tester.id} value={tester.id.toString()}>
                                {tester.name} - {tester.department}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Test Deadline - only for in-house tests */}
                        {editedTest?.execution_type === 'inhouse' && (
                          <input
                            type="date"
                            placeholder="Test Deadline"
                            value={editedTest?.test_deadline || ''}
                            onChange={(e) => setEditedTest(prev => prev ? { ...prev, test_deadline: e.target.value || null } : null)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                          />
                        )}
                        
                        <textarea
                          placeholder="Notes"
                          value={editedTest?.notes || ''}
                          onChange={(e) => setEditedTest(prev => prev ? { ...prev, notes: e.target.value } : null)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 w-fit ${getStatusColor(test.status)}`}>
                          {getStatusIcon(test.status)}
                          <span>{(test.status || 'unknown').replace('_', ' ').toUpperCase()}</span>
                        </span>
                        {test.expected_report_date && (
                          <p className="text-xs text-slate-500 mt-1">Due: {new Date(test.expected_report_date).toLocaleDateString()}</p>
                        )}
                        {test.notes && (
                          <p className="text-xs text-slate-500 mt-1">{test.notes}</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTest === test.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveTest}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-slate-600 hover:bg-slate-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditTest(test)}
                          className="p-1 text-slate-600 hover:bg-slate-50 rounded"
                          title="Edit test"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {test.execution_type === 'inhouse' && (
                          <button
                            onClick={() => handleAssignTest(test)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title={test.assigned_tester_id ? "Reassign test" : "Assign test"}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tester Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {assigningTest 
                  ? `Assign Test — ${assigningTest.test_name}`
                  : `Assign ${selectedTests.size} Selected Tests`
                }
              </h3>
              
              <div className="space-y-4">
                {/* Select Tester */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Tester
                  </label>
                  <select
                    value={assignmentData.tester_id}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, tester_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loadingTesters}
                  >
                    <option value="">Select a tester</option>
                    {testers.map((tester) => (
                      <option key={tester.id} value={tester.id}>
                        {tester.name}
                        <span className="text-slate-500 text-sm"> — {tester.department}</span>
                      </option>
                    ))}
                  </select>
                  {assigningTest?.assigned_tester_id && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Currently assigned to: {testers.find(t => t.id.toString() === assigningTest.assigned_tester_id?.toString())?.name}
                    </div>
                  )}
                </div>

                {/* Test Deadline */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Deadline
                  </label>
                  <input
                    type="date"
                    value={assignmentData.deadline}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, deadline: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {assignmentData.deadline && (() => {
                    const deadline = new Date(assignmentData.deadline);
                    const today = new Date();
                    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 3) {
                      return (
                        <div className="mt-2 flex items-center text-sm text-amber-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          ⚠ Deadline is very soon
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Assignment Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assignment Notes (optional)
                  </label>
                  <textarea
                    value={assignmentData.notes}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any specific instructions for the tester..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {assignmentData.notes.length}/200 characters
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setAssignModalOpen(false);
                    setAssigningTest(null);
                    setAssignmentData({ tester_id: '', deadline: '', notes: '' });
                  }}
                  className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={assigningTest ? handleAssignmentSave : handleBulkAssign}
                  disabled={!assignmentData.tester_id}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    assignmentData.tester_id
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
