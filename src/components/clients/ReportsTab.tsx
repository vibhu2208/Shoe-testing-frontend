'use client';

import React, { useState } from 'react';
import { FileText, Download, Send, Eye, Calendar, Filter } from 'lucide-react';

interface Report {
  id: string;
  reportNumber: string;
  clientName: string;
  ordersCovered: string[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  generatedDate: string;
  status: 'draft' | 'sent';
  sentDate?: string;
}

export default function ReportsTab() {
  const [reports] = useState<Report[]>([
    {
      id: '1',
      reportNumber: 'RPT-VRL-001',
      clientName: 'Nike Inc.',
      ordersCovered: ['ORD-001', 'ORD-003'],
      totalTests: 14,
      passedTests: 12,
      failedTests: 2,
      generatedDate: '2024-03-18',
      status: 'sent',
      sentDate: '2024-03-18'
    },
    {
      id: '2',
      reportNumber: 'RPT-VRL-002',
      clientName: 'Adidas AG',
      ordersCovered: ['ORD-002'],
      totalTests: 6,
      passedTests: 6,
      failedTests: 0,
      generatedDate: '2024-03-17',
      status: 'draft'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent'>('all');

  const filteredReports = reports.filter(report => 
    filterStatus === 'all' || report.status === filterStatus
  );

  const getStatusBadge = (status: Report['status']) => {
    return status === 'sent' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Sent
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        Draft
      </span>
    );
  };

  const getOverallResult = (passed: number, failed: number) => {
    return failed === 0 ? (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
        ALL TESTS PASSED
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
        {failed} TESTS FAILED
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
          <p className="text-slate-600">View and manage test reports across all clients</p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'sent')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Reports</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Report No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Orders Covered
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Tests
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Result
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Generated Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReports.map((report, index) => (
                  <tr key={report.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{report.reportNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{report.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {report.ordersCovered.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        <span className="text-green-600 font-medium">{report.passedTests}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-red-600 font-medium">{report.failedTests}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-600">{report.totalTests}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOverallResult(report.passedTests, report.failedTests)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                      </div>
                      {report.status === 'sent' && report.sentDate && (
                        <div className="text-xs text-slate-500 mt-1">
                          Sent {new Date(report.sentDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">View</span>
                        </button>
                        {report.status === 'draft' && (
                          <button className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Send className="w-4 h-4" />
                            <span className="text-sm">Send</span>
                          </button>
                        )}
                        <button className="flex items-center space-x-1 px-2 py-1 text-slate-600 hover:bg-slate-50 rounded transition-colors">
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No reports yet</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Reports will appear here once test orders are completed and reports are generated.
          </p>
        </div>
      )}
    </div>
  );
}
