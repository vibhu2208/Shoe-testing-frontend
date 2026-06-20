'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Send, X } from 'lucide-react';
import type { ReportPreviewData } from '@/lib/testerReportApi';
import {
  getTesterReportDownloadUrl,
  sendTesterReportEmail,
} from '@/lib/testerReportApi';

interface TestReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: ReportPreviewData | null;
  loading: boolean;
  error: string | null;
  testId: string;
}

export default function TestReportPreviewModal({
  isOpen,
  onClose,
  preview,
  loading,
  error,
  testId,
}: TestReportPreviewModalProps) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) return;
    setRecipientEmail(preview.clientContactEmail || '');
    setEmailMessage('');
    setSendError(null);
    setSendSuccess(null);
  }, [preview?.testId, preview?.clientContactEmail]);

  if (!isOpen) return null;

  const handleDownload = () => {
    window.open(getTesterReportDownloadUrl(testId), '_blank');
  };

  const handleSendEmail = async () => {
    const email = recipientEmail.trim();
    if (!email) {
      setSendError('Please enter a recipient email address.');
      return;
    }
    setSending(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      const result = await sendTesterReportEmail(testId, {
        toEmail: email,
        message: emailMessage.trim() || undefined,
      });
      setSendSuccess(`Report sent to ${result.sentTo}`);
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(null);
      }, 1800);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="Close preview"
          onClick={onClose}
        />
        <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E0E0E0] px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#2E7D32]" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">Report Preview</h2>
                {preview?.reportNumber && (
                  <p className="text-xs text-[#111111]/60">{preview.reportNumber}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#111111]/50 hover:bg-[#FAFAFA] hover:text-[#111111]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2E7D32] border-t-transparent" />
              </div>
            )}

            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {!loading && !error && preview && (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PreviewField label="Client" value={preview.clientName || '—'} />
                  <PreviewField label="Article" value={`${preview.articleNumber} — ${preview.articleName}`} />
                  <PreviewField label="Test" value={preview.testName} />
                  <PreviewField label="Standard" value={preview.testStandard || '—'} />
                  <PreviewField
                    label="Result"
                    value={preview.result || '—'}
                    highlight={preview.result === 'PASS' ? 'pass' : preview.result === 'FAIL' ? 'fail' : undefined}
                  />
                  <PreviewField
                    label="Generated"
                    value={
                      preview.reportGeneratedAt
                        ? new Date(preview.reportGeneratedAt).toLocaleString()
                        : '—'
                    }
                  />
                </div>

                <div className="rounded-lg border border-[#E0E0E0] bg-[#525659] p-4 sm:p-6">
                  <div className="mx-auto max-w-[816px] rounded-sm bg-white shadow-lg">
                    <div
                      className="report-doc-preview min-h-[480px] px-8 py-10 text-[#111111] sm:px-12 sm:py-12"
                      dangerouslySetInnerHTML={{
                        __html: preview.documentHtml || formatPlainDocument(preview.documentPreview),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E0E0E0] bg-[#FAFAFA] px-5 py-3">
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              disabled={loading || !!error || !preview}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2E7D32] bg-white px-4 py-2 text-sm font-medium text-[#2E7D32] hover:bg-[#E8F5E9] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              Send Report
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E0E0E0] bg-white px-4 py-2 text-sm font-medium text-[#111111] hover:bg-[#FAFAFA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={loading || !!error || !preview}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B5E20] disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden />
                Download DOCX
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSendModal && preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close send dialog"
            onClick={() => !sending && setShowSendModal(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#111111]">Send Report to Client</h3>
            <p className="mt-1 text-sm text-[#111111]/65">
              The report will be emailed as a DOCX attachment.
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-3 text-sm">
                <p>
                  <span className="text-[#111111]/55">Client:</span>{' '}
                  <span className="font-medium text-[#111111]">{preview.clientName || '—'}</span>
                </p>
                <p className="mt-1">
                  <span className="text-[#111111]/55">Report:</span>{' '}
                  <span className="font-medium text-[#111111]">{preview.reportNumber || preview.testName}</span>
                </p>
              </div>

              <div>
                <label htmlFor="report-recipient-email" className="mb-1 block text-sm font-medium text-[#111111]">
                  Recipient email
                </label>
                {preview.clientContactEmail && (
                  <p className="mb-2 text-xs text-[#2E7D32]">
                    Primary contact on file: {preview.clientContactName ? `${preview.clientContactName} · ` : ''}
                    {preview.clientContactEmail}
                  </p>
                )}
                <input
                  id="report-recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm text-[#111111] focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                />
                {!preview.clientContactEmail && (
                  <p className="mt-1 text-xs text-[#111111]/50">
                    No client email on file — enter the address to share this report.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="report-email-message" className="mb-1 block text-sm font-medium text-[#111111]">
                  Message <span className="font-normal text-[#111111]/45">(optional)</span>
                </label>
                <textarea
                  id="report-email-message"
                  rows={3}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a note for the recipient…"
                  className="w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm text-[#111111] focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                />
              </div>

              {sendError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {sendError}
                </p>
              )}
              {sendSuccess && (
                <p className="rounded-lg border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1B5E20]">
                  {sendSuccess}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => setShowSendModal(false)}
                className="rounded-lg border border-[#E0E0E0] bg-white px-4 py-2 text-sm font-medium text-[#111111] hover:bg-[#FAFAFA] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSendEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B5E20] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                {sending ? 'Sending…' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .report-doc-preview p {
          margin: 0 0 0.75rem;
          line-height: 1.55;
        }
        .report-doc-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
        }
        .report-doc-preview td,
        .report-doc-preview th {
          border: 1px solid #d1d5db;
          padding: 0.4rem 0.5rem;
          vertical-align: top;
        }
        .report-doc-preview img {
          max-width: 100%;
          height: auto;
        }
        .report-doc-preview strong {
          font-weight: 600;
        }
      `}</style>
    </>
  );
}

function formatPlainDocument(text: string): string {
  if (!text) {
    return '<p class="text-[#111111]/50">Document preview is not available.</p>';
  }
  return text
    .split(/\n\n+/)
    .map((para) => `<p>${escapeHtml(para)}</p>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function PreviewField({
  label,
  value,
  highlight,
  className = '',
}: {
  label: string;
  value: string;
  highlight?: 'pass' | 'fail';
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/45">{label}</p>
      <p
        className={`mt-0.5 text-sm font-medium ${
          highlight === 'pass'
            ? 'text-[#2E7D32]'
            : highlight === 'fail'
              ? 'text-red-700'
              : 'text-[#111111]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
