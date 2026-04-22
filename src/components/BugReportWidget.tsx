'use client';

import { FormEvent, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Send, X } from 'lucide-react';
import { publicApiUrl } from '@/lib/apiBase';

type Priority = 'low' | 'medium' | 'high' | 'critical';

const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];

export default function BugReportWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userContext = (() => {
    if (typeof window === 'undefined') return { userName: '', userEmail: '' };
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) return { userName: '', userEmail: '' };
    try {
      const user = JSON.parse(rawUser) as { name?: string; email?: string };
      return { userName: user.name || '', userEmail: user.email || '' };
    } catch {
      return { userName: '', userEmail: '' };
    }
  })();

  const closeModal = () => {
    setIsOpen(false);
    setMessage(null);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setEmail('');
    setScreenshot(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('reporterEmail', email.trim() || userContext.userEmail);
      formData.append('pagePath', pathname || '/');
      formData.append('userAgent', typeof navigator !== 'undefined' ? navigator.userAgent : '');
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const response = await fetch(publicApiUrl('/api/bug-report'), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Unable to send bug report');
      }

      setMessage({ type: 'success', text: 'Bug report sent successfully.' });
      resetForm();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to send bug report',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[1000] inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
      >
        <AlertTriangle size={16} />
        Report Bug
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Report a Bug</h2>
                <p className="text-sm text-slate-600">This report is emailed directly to your team.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={150}
                placeholder="Bug title"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe what happened, expected result, and steps to reproduce."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      Priority: {p}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userContext.userEmail || 'Your email (optional)'}
                  className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Screenshot (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium hover:file:bg-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">PNG/JPG/WebP up to 5MB.</p>
              </div>
              {userContext.userName && (
                <p className="text-xs text-slate-500">Reporting as: {userContext.userName}</p>
              )}
              {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                  {message.text}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  <Send size={14} />
                  {submitting ? 'Sending...' : 'Send Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
