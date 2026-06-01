'use client';

import React, { useState } from 'react';
import { publicApiUrl } from '@/lib/apiBase';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

interface Report {
  id: string;
  report_url: string;
  template_name: string;
  client_name: string;
  article_test_id: string;
  test_name: string;
  result: string;
  generated_at: string;
  report_status: 'generated' | 'failed';
}

export default function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'generated' | 'failed'>('all');
  const [isRunningBulkAction, setIsRunningBulkAction] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState('');

  React.useEffect(() => {
    fetch(publicApiUrl('/api/reports/history'))
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((data) => setReports(Array.isArray(data.reports) ? data.reports : []))
      .catch(() => setReports([]));
  }, []);

  const filteredReports = reports.filter(report =>
    filterStatus === 'all' || report.report_status === filterStatus
  );

  const getStatusBadge = (status: Report['report_status']) => {
    return status === 'generated' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Generated
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Failed
      </span>
    );
  };

  const triggerDownload = (url: string, fileName?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    if (fileName) {
      link.download = fileName;
    }
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAuthenticatedBackup = async (downloadPath: string, filename: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(publicApiUrl(downloadPath), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Failed to download backup');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackupAndDownloadAll = async () => {
    setIsRunningBulkAction(true);
    setBulkActionMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl('/api/admin/maintenance/backup-and-reports'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to run backup');
      }

      if (payload.backupDownloadPath && payload.backupFilename) {
        await downloadAuthenticatedBackup(payload.backupDownloadPath, payload.backupFilename);
      }

      const reportCount = payload.totalReports || 0;
      setBulkActionMessage(
        `Full backup downloaded (${payload.backupFilename || 'backup.zip'}). Includes database, ${reportCount} reports, uploads, and templates.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run backup';
      setBulkActionMessage(message);
    } finally {
      setIsRunningBulkAction(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
          <p className="text-slate-600">View and manage test reports across all clients</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBackupAndDownloadAll}
            disabled={isRunningBulkAction}
            className="px-3 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            {isRunningBulkAction ? 'Creating backup...' : 'Full Backup'}
          </button>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'generated' | 'failed')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Reports</option>
              <option value="generated">Generated</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>
      {bulkActionMessage ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {bulkActionMessage}
        </div>
      ) : null}

      {/* Reports Table */}
      {filteredReports.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Report ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Client/Test
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Template
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
                      <div className="text-sm font-medium text-slate-900">{report.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{report.client_name || 'Unassigned'}</div>
                      <div className="text-xs text-slate-500">{report.test_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{report.template_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={report.result === 'PASS' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        {report.result || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.report_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => triggerDownload(publicApiUrl(`/api/reports/download/${report.article_test_id}`))}
                          className="flex items-center space-x-1 px-2 py-1 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                        >
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
