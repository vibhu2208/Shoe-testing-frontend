'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Upload, 
  UserPlus,
  RotateCcw,
  Download
} from 'lucide-react';

interface OrderTest {
  id: string;
  testName: string;
  standard: string;
  clientRequirement: string;
  category: 'raw_material' | 'work_in_progress' | 'finished_good';
  executionType: 'inhouse' | 'outsource';
  assignedTester?: {
    id: string;
    name: string;
  };
  deadline?: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'pass' | 'fail';
  result?: 'PASS' | 'FAIL';
  resultData?: any;
  submittedAt?: string;
  vendorDetails?: {
    name: string;
    contact: string;
    email: string;
    expectedDate: string;
    reportUrl?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  productName: string;
  articleNumber: string;
  materialType: string;
  color: string;
  status: 'draft' | 'in_progress' | 'completed' | 'report_sent';
  createdAt: string;
  tests: OrderTest[];
}

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
}

export default function OrderDetailPage({ orderId, onBack }: OrderDetailPageProps) {
  const [order] = useState<Order>({
    id: orderId,
    orderNumber: 'ORD-001',
    clientName: 'Nike Inc.',
    productName: 'Air Max 270',
    articleNumber: 'AM270-001',
    materialType: 'Synthetic Leather',
    color: 'Black/White',
    status: 'in_progress',
    createdAt: '2024-03-15',
    tests: [
      {
        id: '1',
        testName: 'Abrasion Resistance Test',
        standard: 'SATRA-TM-174',
        clientRequirement: 'Min 25,000 cycles without visible damage',
        category: 'finished_good',
        executionType: 'inhouse',
        assignedTester: { id: '1', name: 'John Smith' },
        deadline: '2024-03-25',
        status: 'submitted',
        result: 'PASS',
        submittedAt: '2024-03-20'
      },
      {
        id: '2',
        testName: 'pH Value Test',
        standard: 'PH-001',
        clientRequirement: 'pH between 3.5 - 7.0',
        category: 'raw_material',
        executionType: 'inhouse',
        assignedTester: { id: '2', name: 'Sarah Johnson' },
        deadline: '2024-03-22',
        status: 'in_progress'
      },
      {
        id: '3',
        testName: 'Lead Content Analysis',
        standard: 'ISO-19574',
        clientRequirement: 'Max 90 ppm lead content',
        category: 'raw_material',
        executionType: 'outsource',
        status: 'pending',
        vendorDetails: {
          name: 'SGS Testing Services',
          contact: 'John Doe',
          email: 'john.doe@sgs.com',
          expectedDate: '2024-04-15'
        }
      },
      {
        id: '4',
        testName: 'Flexing Resistance',
        standard: 'SATRA-TM-92',
        clientRequirement: 'No cracking after 100,000 flexes',
        category: 'finished_good',
        executionType: 'inhouse',
        status: 'pending'
      }
    ]
  });

  const [selectedTest, setSelectedTest] = useState<OrderTest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [testers, setTesters] = useState<Array<{id: string; name: string; department: string}>>([]);
  const [loadingTesters, setLoadingTesters] = useState(false);

  // Fetch testers when component mounts
  useEffect(() => {
    const fetchTesters = async () => {
      setLoadingTesters(true);
      try {
        const response = await fetch('http://localhost:5000/api/clients/users?role=tester&is_active=true');
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

    fetchTesters();
  }, []);

  const getStatusBadge = (status: OrderTest['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-slate-100 text-slate-700', icon: Clock },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      submitted: { label: 'Submitted', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      pass: { label: 'Pass', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      fail: { label: 'Fail', className: 'bg-red-100 text-red-700', icon: AlertCircle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <div className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const getCategoryBadge = (category: OrderTest['category']) => {
    const categoryConfig = {
      raw_material: { label: 'Raw Material', className: 'bg-slate-100 text-slate-700' },
      work_in_progress: { label: 'WIP', className: 'bg-slate-100 text-slate-700' },
      finished_good: { label: 'Finished Good', className: 'bg-green-50 text-green-700' }
    };
    
    const config = categoryConfig[category];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getResultBadge = (result?: 'PASS' | 'FAIL') => {
    if (!result) return null;
    
    return result === 'PASS' ? (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
        PASS
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
        FAIL
      </span>
    );
  };

  const groupedTests = {
    raw_material: order.tests.filter(test => test.category === 'raw_material'),
    work_in_progress: order.tests.filter(test => test.category === 'work_in_progress'),
    finished_good: order.tests.filter(test => test.category === 'finished_good')
  };

  const completedTests = order.tests.filter(test => test.status === 'submitted' || test.status === 'pass' || test.status === 'fail').length;
  const allTestsCompleted = completedTests === order.tests.length;

  const AssignTesterModal = () => {
    const [selectedTesterId, setSelectedTesterId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');

    if (!showAssignModal || !selectedTest) return null;

    const selectedTester = testers.find(t => t.id === selectedTesterId);
    const isDeadlineSoon = deadline && (() => {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    })();

    const handleAssign = async () => {
      if (!selectedTesterId || !selectedTest) return;

      try {
        const response = await fetch(`http://localhost:5000/api/clients/article-tests/${selectedTest.id}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tester_id: selectedTesterId,
            deadline: deadline || null,
            notes: notes || null
          }),
        });

        if (response.ok) {
          // Update local state or refetch data
          setShowAssignModal(false);
          // You might want to refresh the order data here
        } else {
          console.error('Failed to assign tester');
        }
      } catch (error) {
        console.error('Error assigning tester:', error);
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={() => setShowAssignModal(false)} />
          
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Assign Test — {selectedTest.testName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Tester
                </label>
                <select
                  value={selectedTesterId}
                  onChange={(e) => setSelectedTesterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loadingTesters}
                >
                  <option value="">Choose a tester</option>
                  {testers.map(tester => (
                    <option key={tester.id} value={tester.id}>
                      {tester.name} - {tester.department}
                    </option>
                  ))}
                </select>
                {selectedTester && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-600">
                      {selectedTester.name} ({selectedTester.department})
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {isDeadlineSoon && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    ⚠ Deadline is very soon
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any specific instructions for the tester..."
                />
                <p className="mt-1 text-xs text-slate-500">{notes.length}/200 characters</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedTesterId || loadingTesters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResultViewModal = () => {
    if (!showResultModal || !selectedTest) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={() => setShowResultModal(false)} />
          
          <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">Test Results</h3>
              {getResultBadge(selectedTest.result)}
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Test Name</label>
                  <p className="text-slate-900">{selectedTest.testName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Standard</label>
                  <p className="text-slate-900">{selectedTest.standard}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tester</label>
                  <p className="text-slate-900">{selectedTest.assignedTester?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Submitted</label>
                  <p className="text-slate-900">
                    {selectedTest.submittedAt ? new Date(selectedTest.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Client Requirement</label>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedTest.clientRequirement}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Results</label>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-900">
                    {selectedTest.testName === 'Abrasion Resistance Test' && 
                      'Average volume loss: 289 mm³ after 25,000 cycles. No visible damage observed. Test PASSED.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50">
                <RotateCcw className="w-4 h-4" />
                <span>Request Retest</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'completed' ? 'bg-green-100 text-green-700' :
              order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-slate-600">{order.clientName}</p>
        </div>
        {allTestsCompleted && (
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        )}
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Product Name</label>
            <p className="text-slate-900">{order.productName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Article Number</label>
            <p className="text-slate-900">{order.articleNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Material Type</label>
            <p className="text-slate-900">{order.materialType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Color</label>
            <p className="text-slate-900">{order.color}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Test Progress</span>
            <span className="text-sm text-slate-600">{completedTests} of {order.tests.length} tests completed</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedTests / order.tests.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Test Requirements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Test Requirements</h2>
        </div>

        <div className="overflow-x-auto">
          {Object.entries(groupedTests).map(([category, tests]) => {
            if (tests.length === 0) return null;
            
            const categoryLabels = {
              raw_material: 'Raw Material Tests',
              work_in_progress: 'Work In Progress Tests',
              finished_good: 'Finished Good Tests'
            };

            return (
              <div key={category}>
                {/* Category Header */}
                <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                  <h3 className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                </div>

                {/* Tests in Category */}
                {tests.map((test, index) => (
                  <div key={test.id} className={`px-6 py-4 border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Test Info */}
                      <div className="col-span-3">
                        <h4 className="font-medium text-slate-900">{test.testName}</h4>
                        <p className="text-sm text-slate-600">{test.standard}</p>
                      </div>

                      {/* Client Requirement */}
                      <div className="col-span-2">
                        <p className="text-sm text-slate-700">{test.clientRequirement}</p>
                      </div>

                      {/* Category */}
                      <div className="col-span-1">
                        {getCategoryBadge(test.category)}
                      </div>

                      {/* Execution Type */}
                      <div className="col-span-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.executionType === 'inhouse' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {test.executionType === 'inhouse' ? 'In-House' : 'Outsource'}
                        </span>
                      </div>

                      {/* Assigned Tester / Deadline */}
                      <div className="col-span-2">
                        {test.executionType === 'inhouse' ? (
                          <div>
                            {test.assignedTester ? (
                              <div>
                                <p className="text-sm font-medium text-slate-900">{test.assignedTester.name}</p>
                                {test.deadline && (
                                  <p className="text-xs text-slate-500">Due: {new Date(test.deadline).toLocaleDateString()}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">Unassigned</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-slate-900">{test.vendorDetails?.name}</p>
                            <p className="text-xs text-slate-500">
                              Due: {test.vendorDetails?.expectedDate ? new Date(test.vendorDetails.expectedDate).toLocaleDateString() : 'Not set'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        {getStatusBadge(test.status)}
                      </div>

                      {/* Result */}
                      <div className="col-span-1">
                        {getResultBadge(test.result)}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          {test.executionType === 'inhouse' && !test.assignedTester && (
                            <button
                              onClick={() => {
                                setSelectedTest(test);
                                setShowAssignModal(true);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Assign Tester"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          
                          {test.executionType === 'outsource' && test.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedTest(test);
                                setShowUploadModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Upload Report"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          )}
                          
                          {(test.status === 'submitted' || test.result) && (
                            <button
                              onClick={() => {
                                setSelectedTest(test);
                                setShowResultModal(true);
                              }}
                              className="p-1 text-slate-600 hover:bg-slate-50 rounded"
                              title="View Result"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          
                          {test.vendorDetails?.reportUrl && (
                            <button
                              className="p-1 text-slate-600 hover:bg-slate-50 rounded"
                              title="Download Report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AssignTesterModal />
      <ResultViewModal />
    </div>
  );
}
