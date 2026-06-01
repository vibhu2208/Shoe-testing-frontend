'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { publicApiUrl } from '@/lib/apiBase';
import {
  Archive,
  Database,
  Download,
  FileText,
  HardDrive,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';

interface BackupEntry {
  filename: string;
  type: 'full' | 'database-only';
  sizeBytes: number;
  createdAt: string;
}

interface BackupManifest {
  contents?: {
    database?: { tables?: number; rowCounts?: Record<string, number> };
    files?: {
      uploads?: number;
      reports?: number;
      frontendTemplates?: number;
      backendTemplates?: number;
    };
  };
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<'full' | 'database' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastManifest, setLastManifest] = useState<BackupManifest | null>(null);

  const getToken = () => localStorage.getItem('token');

  const loadBackups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(publicApiUrl('/api/admin/maintenance/backups'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load backups');
      }
      setBackups(Array.isArray(payload.backups) ? payload.backups : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const downloadBackup = async (filename: string) => {
    const response = await fetch(publicApiUrl(`/api/admin/maintenance/backups/${filename}`), {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Download failed');
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

  const createBackup = async (type: 'full' | 'database') => {
    setCreating(type);
    setMessage('');
    setError('');
    setLastManifest(null);

    try {
      const endpoint =
        type === 'full'
          ? '/api/admin/maintenance/backup'
          : '/api/admin/maintenance/backup-database';

      const response = await fetch(publicApiUrl(endpoint), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create backup');
      }

      const backup = payload.backup;
      if (backup?.downloadPath && backup?.filename) {
        await downloadBackup(backup.filename);
      }

      if (payload.manifest || backup?.manifest) {
        setLastManifest(payload.manifest || backup.manifest);
      }

      setMessage(
        type === 'full'
          ? 'Full backup created and downloaded. It includes all database tables, generated reports, uploads, and templates.'
          : 'Database backup created and downloaded.'
      );
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Data Backup</h1>
        <p className="text-slate-600 mt-1">
          Create and download backups of all system data, reports, test results, and uploaded files.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Full Backup</h2>
              <p className="text-sm text-slate-600 mt-1">
                ZIP archive with everything needed to restore the system.
              </p>
            </div>
          </div>
          <ul className="text-sm text-slate-600 space-y-2 mb-5">
            <li className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              All database tables (clients, articles, tests, results)
            </li>
            <li className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Generated report documents (.docx)
            </li>
            <li className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-400" />
              Client documents and test photos
            </li>
            <li className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              Report templates
            </li>
          </ul>
          <button
            onClick={() => createBackup('full')}
            disabled={creating !== null}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {creating === 'full' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating full backup...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Create Full Backup
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Database Only</h2>
              <p className="text-sm text-slate-600 mt-1">
                JSON export of all database tables — smaller and faster.
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Includes test library, client data, article tests, result data, report metadata,
            users, and periodic schedules. Does not include uploaded files or generated reports.
          </p>
          <button
            onClick={() => createBackup('database')}
            disabled={creating !== null}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {creating === 'database' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating database backup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Create Database Backup
              </>
            )}
          </button>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {lastManifest?.contents ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900 mb-2">Last backup summary</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <span>Database tables: {lastManifest.contents.database?.tables ?? '—'}</span>
            <span>Upload files: {lastManifest.contents.files?.uploads ?? 0}</span>
            <span>Report files: {lastManifest.contents.files?.reports ?? 0}</span>
            <span>Template files: {(lastManifest.contents.files?.frontendTemplates ?? 0) + (lastManifest.contents.files?.backendTemplates ?? 0)}</span>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Previous Backups</h2>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            No backups yet. Create a full or database backup above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {backups.map((backup) => (
                  <tr key={backup.filename}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{backup.filename}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {backup.type === 'full' ? 'Full (ZIP)' : 'Database (JSON)'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatBytes(backup.sizeBytes)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => downloadBackup(backup.filename).catch((err) => setError(err.message))}
                        className="flex items-center gap-1.5 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
