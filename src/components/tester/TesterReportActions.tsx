'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, RotateCw } from 'lucide-react';
import type { ReportPreviewData } from '@/lib/testerReportApi';
import {
  fetchTesterReportPreview,
  generateTesterReport,
  getTesterReportDownloadUrl,
} from '@/lib/testerReportApi';
import TestReportPreviewModal from '@/components/tester/TestReportPreviewModal';

interface TesterReportActionsProps {
  testId: string;
  status: string;
  reportUrl?: string | null;
  reportGeneratedAt?: string | null;
  variant?: 'default' | 'compact';
  onReportGenerated?: () => void;
  className?: string;
}

export default function TesterReportActions({
  testId,
  status,
  reportUrl,
  reportGeneratedAt,
  variant = 'default',
  onReportGenerated,
  className = '',
}: TesterReportActionsProps) {
  const [generating, setGenerating] = useState(false);
  const [hasReport, setHasReport] = useState(!!reportUrl || !!reportGeneratedAt);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);

  useEffect(() => {
    setHasReport(!!reportUrl || !!reportGeneratedAt);
  }, [reportUrl, reportGeneratedAt]);

  if (status !== 'submitted') return null;

  const btnBase =
    variant === 'compact'
      ? 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium'
      : 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium';

  const handleGenerate = async (regenerate = false) => {
    try {
      setGenerating(true);
      await generateTesterReport(testId);
      setHasReport(true);
      onReportGenerated?.();
      if (!regenerate) {
        alert('Report generated successfully');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    try {
      const data = await fetchTesterReportPreview(testId);
      setPreviewData(data);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(getTesterReportDownloadUrl(testId), '_blank');
  };

  const showReportActions = hasReport || !!reportUrl || !!reportGeneratedAt;

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {!showReportActions ? (
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className={`${btnBase} border border-[#2E7D32] bg-white text-[#2E7D32] hover:bg-[#E8F5E9] disabled:opacity-60`}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <FileText className="h-4 w-4" aria-hidden />
            )}
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePreview}
              className={`${btnBase} border border-[#2E7D32] bg-white text-[#2E7D32] hover:bg-[#E8F5E9]`}
            >
              <Eye className="h-4 w-4" aria-hidden />
              Preview
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className={`${btnBase} border border-[#E0E0E0] bg-white text-[#111111] hover:bg-[#FAFAFA]`}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className={`${btnBase} border border-[#E0E0E0] bg-white text-[#111111] hover:bg-[#FAFAFA] disabled:opacity-60`}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RotateCw className="h-4 w-4" aria-hidden />
              )}
              {generating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </>
        )}
      </div>

      <TestReportPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        preview={previewData}
        loading={previewLoading}
        error={previewError}
        testId={testId}
      />
    </>
  );
}
