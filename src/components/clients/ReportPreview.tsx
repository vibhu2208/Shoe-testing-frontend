'use client';

import React, { useState } from 'react';
import { X, Send, Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

interface ReportTest {
  id: string;
  testName: string;
  standard: string;
  clientRequirement: string;
  category: 'raw_material' | 'work_in_progress' | 'finished_good';
  result: 'PASS' | 'FAIL';
  resultSummary: string;
  includeInReport: boolean;
}

interface ReportData {
  id: string;
  reportNumber: string;
  clientName: string;
  clientAddress: string;
  orderNumber: string;
  productName: string;
  articleNumber: string;
  generatedDate: string;
  tests: ReportTest[];
}

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportData;
}

export default function ReportPreview({ isOpen, onClose, reportData }: ReportPreviewProps) {
  const [tests, setTests] = useState<ReportTest[]>(reportData.tests);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [selectedTestsForRetest, setSelectedTestsForRetest] = useState<string[]>([]);
  const [retestReason, setRetestReason] = useState('');

  const toggleTestInclusion = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, includeInReport: !test.includeInReport }
        : test
    ));
  };

  const includedTests = tests.filter(test => test.includeInReport);
  const passedTests = includedTests.filter(test => test.result === 'PASS').length;
  const failedTests = includedTests.filter(test => test.result === 'FAIL').length;
  const overallResult = failedTests === 0 ? 'PASS' : 'FAIL';

  const getCategoryBadge = (category: ReportTest['category']) => {
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

  const getResultBadge = (result: 'PASS' | 'FAIL') => {
    return result === 'PASS' ? (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center space-x-1">
        <CheckCircle className="w-4 h-4" />
        <span>PASS</span>
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center space-x-1">
        <AlertCircle className="w-4 h-4" />
        <span>FAIL</span>
      </span>
    );
  };

  const SendReportModal = () => {
    if (!showSendModal) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={() => setShowSendModal(false)} />
          
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Send Report to Client</h3>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Client:</strong> {reportData.clientName}
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Report:</strong> {reportData.reportNumber}
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Tests Included:</strong> {includedTests.length}
                </p>
              </div>
              
              <p className="text-sm text-slate-600">
                The report will be sent to the primary contact for this client. 
                Are you sure you want to proceed?
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle send report logic here
                  setShowSendModal(false);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Send Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RetestModal = () => {
    if (!showRetestModal) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={() => setShowRetestModal(false)} />
          
          <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Request Retest</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Tests to Retest
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {tests.map(test => (
                    <label key={test.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTestsForRetest.includes(test.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTestsForRetest(prev => [...prev, test.id]);
                          } else {
                            setSelectedTestsForRetest(prev => prev.filter(id => id !== test.id));
                          }
                        }}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-slate-700">{test.testName}</span>
                      {getResultBadge(test.result)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Retest
                </label>
                <textarea
                  value={retestReason}
                  onChange={(e) => setRetestReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Explain why these tests need to be retested..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRetestModal(false);
                  setSelectedTestsForRetest([]);
                  setRetestReason('');
                }}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle retest request logic here
                  setShowRetestModal(false);
                  setSelectedTestsForRetest([]);
                  setRetestReason('');
                }}
                disabled={selectedTestsForRetest.length === 0 || !retestReason.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Retest Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={onClose} />
          
          <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Report Preview</h2>
                <p className="text-sm text-slate-600">{reportData.reportNumber}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Report Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* Report Header */}
              <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="w-24 h-12 bg-slate-200 rounded flex items-center justify-center mb-4">
                      <span className="text-xs font-medium text-slate-600">VIROLA LABS</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Test Report</h1>
                    <p className="text-slate-600">{reportData.reportNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Generated Date</p>
                    <p className="font-medium text-slate-900">{new Date(reportData.generatedDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Client Information</h3>
                    <p className="text-slate-900 font-medium">{reportData.clientName}</p>
                    <p className="text-slate-600 text-sm">{reportData.clientAddress}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Order Details</h3>
                    <p className="text-slate-600 text-sm">Order Number: <span className="font-medium text-slate-900">{reportData.orderNumber}</span></p>
                    <p className="text-slate-600 text-sm">Product: <span className="font-medium text-slate-900">{reportData.productName}</span></p>
                    <p className="text-slate-600 text-sm">Article Number: <span className="font-medium text-slate-900">{reportData.articleNumber}</span></p>
                  </div>
                </div>
              </div>

              {/* Test Results Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Test Results</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Include
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          S.No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Test Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Standard
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Client Requirement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Summary
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tests.map((test, index) => (
                        <tr key={test.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={test.includeInReport}
                              onChange={() => toggleTestInclusion(test.id)}
                              className="text-green-600 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{test.testName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {test.standard}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-900 max-w-xs">{test.clientRequirement}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCategoryBadge(test.category)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getResultBadge(test.result)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-900 max-w-xs">{test.resultSummary}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overall Result */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Overall Result</h3>
                  {overallResult === 'PASS' ? (
                    <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-lg font-bold bg-green-100 text-green-700">
                      <CheckCircle className="w-6 h-6" />
                      <span>ALL TESTS PASSED</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-lg font-bold bg-red-100 text-red-700">
                      <AlertCircle className="w-6 h-6" />
                      <span>{failedTests} TESTS FAILED</span>
                    </div>
                  )}
                  
                  <div className="mt-4 text-sm text-slate-600">
                    <span className="text-green-600 font-medium">{passedTests} Passed</span>
                    <span className="mx-2">•</span>
                    <span className="text-red-600 font-medium">{failedTests} Failed</span>
                    <span className="mx-2">•</span>
                    <span className="text-slate-600">{includedTests.length} Total Tests</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowRetestModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Request Retest</span>
              </button>

              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Report to Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SendReportModal />
      <RetestModal />
    </>
  );
}
