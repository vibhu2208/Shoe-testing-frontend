import { publicApiUrl } from '@/lib/apiBase';

export interface ReportPreviewData {
  testId: string;
  testName: string;
  testStandard: string;
  clientRequirement: string;
  category: string;
  result: string;
  submittedAt: string | null;
  reportNumber: string | null;
  reportGeneratedAt: string | null;
  templateKey: string | null;
  templateName: string | null;
  clientName: string | null;
  clientContactEmail: string | null;
  clientContactName: string | null;
  articleName: string;
  articleNumber: string;
  documentPreview: string;
  documentHtml: string;
}

export function getCurrentTesterId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    const parsedUser = JSON.parse(storedUser);
    return parsedUser?.id ? String(parsedUser.id) : null;
  } catch {
    return null;
  }
}

function testerHeaders(): HeadersInit {
  const testerId = getCurrentTesterId();
  return testerId ? { 'x-user-id': testerId } : {};
}

export async function generateTesterReport(testId: string): Promise<{
  reportUrl: string;
  reportNumber: string;
}> {
  const response = await fetch(publicApiUrl(`/api/tester/my-tests/${testId}/generate-report`), {
    method: 'POST',
    headers: testerHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate report');
  }
  return data;
}

export async function fetchTesterReportPreview(testId: string): Promise<ReportPreviewData> {
  const response = await fetch(publicApiUrl(`/api/tester/my-tests/${testId}/preview-report`), {
    headers: testerHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load report preview');
  }
  return data;
}

export function getTesterReportDownloadUrl(testId: string): string {
  const testerId = getCurrentTesterId();
  const q = testerId ? `?tester_id=${encodeURIComponent(testerId)}` : '';
  return publicApiUrl(`/api/tester/my-tests/${testId}/download-report${q}`);
}

export async function sendTesterReportEmail(
  testId: string,
  payload: { toEmail: string; message?: string }
): Promise<{ message: string; sentTo: string }> {
  const response = await fetch(publicApiUrl(`/api/tester/my-tests/${testId}/send-report-email`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...testerHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send report email');
  }
  return data;
}
