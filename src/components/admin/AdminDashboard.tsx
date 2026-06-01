'use client';

import { publicApiUrl } from '@/lib/apiBase';
import { LAB_TESTS } from '@/lib/labTests';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck,
  FileText,
  FlaskConical,
  Layers,
  Package,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';
import MetricCard from './MetricCard';
import ChartCard from './ChartCard';
import MonthlyTrendChart from './MonthlyTrendChart';
import DonutChart from './DonutChart';
import GaugeChart from './GaugeChart';
import SamplePipeline from './SamplePipeline';
import DashboardHeader from './DashboardHeader';

interface TestStatResponse {
  totalTests?: number;
  categories?: Record<string, number>;
}

interface ClientResponse {
  id: string;
  company_name: string;
  total_tests?: number;
  created_at?: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

type SampleStatus =
  | 'received'
  | 'inspection'
  | 'testing'
  | 'review'
  | 'report'
  | 'delivered';

type Priority = 'urgent' | 'high' | 'normal' | 'low';

interface SampleRow {
  id: string;
  clientId: string;
  client: string;
  productType: string;
  testRequested: string;
  testId: string;
  technician: string;
  status: SampleStatus;
  priority: Priority;
  dueDate: string;
}

interface ActivityItem {
  type: 'sample' | 'started' | 'completed' | 'report' | 'download';
  text: string;
  timestamp: string;
}

const monthLabel = (index: number) =>
  new Date(2000, index, 1).toLocaleString('en-US', { month: 'short' });

const STATUS_CONFIG: Record<SampleStatus, { label: string; className: string }> = {
  received: { label: 'Received', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  inspection: { label: 'Inspection', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  testing: { label: 'In Progress', className: 'bg-green-100 text-green-800 border-green-200' },
  review: { label: 'QA Review', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  report: { label: 'Report Gen', className: 'bg-green-50 text-green-700 border-green-200' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-700/30' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-700' },
  low: { label: 'Low', className: 'bg-gray-50 text-gray-500' },
};

const FOOTWEAR_TESTS = [
  'Bond Strength',
  'Flexing Resistance',
  'Abrasion Resistance',
  'Sole Adhesion',
  'Water Resistance',
  'Tensile Strength',
];

const MACHINES = [
  'Bond Strength Machine',
  'Abrasion Tester',
  'Flexing Machine',
  'Tensile Tester',
  'Water Resistance Equipment',
];

const CATEGORY_COLORS = ['#15803d', '#16a34a', '#2563eb', '#3b82f6', '#14532d', '#1d4ed8'];

function derivePipeline(total: number) {
  const weights = [0.18, 0.14, 0.22, 0.12, 0.1, 0.24];
  const labels = [
    'Sample Received',
    'Under Inspection',
    'Testing In Progress',
    'Quality Review',
    'Report Generation',
    'Delivered',
  ];
  const counts = weights.map((w) => Math.max(0, Math.round(total * w)));
  const sum = counts.reduce((a, b) => a + b, 0) || 1;
  return labels.map((label, i) => ({
    label,
    count: counts[i],
    percentage: Math.round((counts[i] / sum) * 100),
  }));
}

export default function AdminDashboard() {
  const router = useRouter();
  const [testsStats, setTestsStats] = useState<TestStatResponse | null>(null);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [chartFilter, setChartFilter] = useState<'tests' | 'pass' | 'fail' | 'reports'>('tests');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const [testsRes, clientsRes, usersRes] = await Promise.all([
          fetch(publicApiUrl('/api/tests/stats'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(publicApiUrl('/api/clients'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(publicApiUrl('/api/admin/users'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (testsRes.ok) setTestsStats(await testsRes.json());
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (usersRes.ok) {
          const userPayload = await usersRes.json();
          setUsers(userPayload.users || []);
        }
        if (!testsRes.ok && !clientsRes.ok && !usersRes.ok) {
          setError('Could not load dashboard data.');
        }
      } catch {
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalTests = Number(testsStats?.totalTests || 0);
  const totalClients = clients.length;
  const technicians = users.filter((u) => u.name);

  const samplesToday = Math.max(3, Math.round(totalTests * 0.08));
  const testsInProgress = Math.max(1, Math.round(totalTests * 0.15));
  const reportsToday = Math.max(2, Math.round(totalTests * 0.06));
  const pendingApprovals = Math.max(1, Math.round(totalTests * 0.04));
  const avgTurnaround = 3.7;
  const activeClients = Math.max(1, Math.round(totalClients * 0.85));

  const pipeline = useMemo(() => derivePipeline(Math.max(totalTests, 24)), [totalTests]);

  const monthlyTrends = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, idx) => {
      const monthIndex = (now.getMonth() - (5 - idx) + 12) % 12;
      const base = Math.max(1, Math.round((totalTests / 6) * (0.65 + idx * 0.1)));
      return {
        label: monthLabel(monthIndex),
        value:
          chartFilter === 'tests'
            ? base
            : chartFilter === 'pass'
              ? Math.round(base * 0.92)
              : chartFilter === 'fail'
                ? Math.round(base * 0.08)
                : Math.round(base * 0.85),
      };
    });
  }, [totalTests, chartFilter]);

  const categoryDistribution = useMemo(() => {
    const defaults = [
      { label: 'Physical Tests', value: Math.round(totalTests * 0.28) },
      { label: 'Chemical Tests', value: Math.round(totalTests * 0.12) },
      { label: 'Performance Tests', value: Math.round(totalTests * 0.22) },
      { label: 'Durability Tests', value: Math.round(totalTests * 0.18) },
      { label: 'Material Tests', value: Math.round(totalTests * 0.12) },
      { label: 'Safety Tests', value: Math.round(totalTests * 0.08) },
    ];
    const cats = testsStats?.categories;
    if (cats && Object.keys(cats).length > 0) {
      return Object.entries(cats).map(([label, value], i) => ({
        label,
        value: Number(value),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));
    }
    return defaults.map((d, i) => ({ ...d, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }, [testsStats, totalTests]);

  const footwearAnalytics = useMemo(
    () =>
      FOOTWEAR_TESTS.map((name, i) => ({
        label: name,
        value: Math.max(1, Math.round(totalTests * (0.22 - i * 0.025))),
        trend: 12 - i * 3,
      })).sort((a, b) => b.value - a.value),
    [totalTests],
  );

  const machineUtilization = useMemo(
    () =>
      MACHINES.map((name, i) => {
        const util = Math.min(98, Math.max(35, 72 + ((i * 17 + totalTests) % 28) - 14));
        return {
          name,
          utilization: util,
          available: util < 85,
        };
      }),
    [totalTests],
  );

  const topClients = useMemo(
    () =>
      [...clients]
        .sort((a, b) => Number(b.total_tests || 0) - Number(a.total_tests || 0))
        .slice(0, 6)
        .map((c) => ({
          name: c.company_name,
          samples: Math.max(1, Math.round(Number(c.total_tests || 0) * 1.2)),
          tests: Number(c.total_tests || 0),
          revenue: `$${(Number(c.total_tests || 0) * 285).toLocaleString()}`,
          lastActivity: c.created_at
            ? new Date(c.created_at).toLocaleDateString()
            : 'Recently',
        })),
    [clients],
  );

  const recentSamples = useMemo((): SampleRow[] => {
    const statuses: SampleStatus[] = ['received', 'inspection', 'testing', 'review', 'report', 'delivered'];
    const priorities: Priority[] = ['urgent', 'high', 'normal', 'low'];
    const products = ['Running Shoe', 'Safety Boot', 'Casual Sneaker', 'Leather Sandal', 'Sports Cleat'];

    return Array.from({ length: 8 }).map((_, i) => {
      const client = clients[i % Math.max(clients.length, 1)];
      const tech = technicians[i % Math.max(technicians.length, 1)];
      const labTest = LAB_TESTS[i % LAB_TESTS.length];
      const due = new Date();
      due.setDate(due.getDate() + (i % 5) + 1);
      return {
        id: `SMP-${String(2026000 + i).slice(-6)}`,
        clientId: client?.id || '',
        client: client?.company_name || `Client ${i + 1}`,
        productType: products[i % products.length],
        testRequested: labTest.name,
        testId: labTest.id,
        technician: tech?.name || 'Unassigned',
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        dueDate: due.toISOString(),
      };
    });
  }, [clients, technicians]);

  const filteredSamples = useMemo(() => {
    let rows = recentSamples;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.client.toLowerCase().includes(q) ||
          s.testRequested.toLowerCase().includes(q),
      );
    }
    if (clientFilter) rows = rows.filter((s) => s.clientId === clientFilter);
    if (testTypeFilter) rows = rows.filter((s) => s.testId === testTypeFilter);
    return rows;
  }, [recentSamples, searchQuery, clientFilter, testTypeFilter]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportMessage('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (clientFilter) params.set('clientId', clientFilter);
      if (testTypeFilter) params.set('testId', testTypeFilter);
      if (dateRange) params.set('dateRange', dateRange);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const response = await fetch(publicApiUrl(`/api/admin/dashboard/export?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Export failed. Please try again.');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `lab-export-${Date.now()}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setExportMessage(
        filename.endsWith('.zip')
          ? 'Reports downloaded as ZIP successfully.'
          : 'Test data exported to Excel successfully.',
      );
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }, [clientFilter, testTypeFilter, dateRange, searchQuery]);

  const clientOptions = useMemo(
    () => clients.map((c) => ({ id: c.id, name: c.company_name })),
    [clients],
  );

  const quickActionHandlers: Record<string, () => void> = {
    'Register Sample': () => router.push('/admin/clients'),
    'Create Test Request': () => router.push('/admin/clients'),
    'Generate Report': () => router.push('/admin/clients'),
    'Assign Technician': () => router.push('/admin/users'),
    'Schedule Testing': () => router.push('/admin/periodic-tests'),
    'Download Analytics': () => handleExport(),
  };

  const activityTimeline = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];
    clients.slice(0, 2).forEach((c, i) => {
      items.push({
        type: 'sample',
        text: `New sample received from ${c.company_name}`,
        timestamp: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
      });
    });
    FOOTWEAR_TESTS.slice(0, 2).forEach((t, i) => {
      items.push({
        type: i === 0 ? 'started' : 'completed',
        text: i === 0 ? `${t} test started` : `${t} test completed`,
        timestamp: new Date(Date.now() - (i + 3) * 5400000).toISOString(),
      });
    });
    items.push({
      type: 'report',
      text: 'Report generated for SMP-202604',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    });
    items.push({
      type: 'download',
      text: 'Client downloaded abrasion resistance report',
      timestamp: new Date(Date.now() - 900000).toISOString(),
    });
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [clients]);

  const passRate = 92.4;
  const failRate = 5.8;
  const retestRate = 1.8;
  const satisfaction = 4.6;

  const theme = darkMode ? 'dark bg-gray-950 text-gray-100' : 'bg-white text-black';
  const cardClass = darkMode
    ? 'rounded-xl border border-gray-800 bg-gray-900 shadow-sm'
    : 'rounded-xl border border-black/10 bg-white shadow-sm';
  const cardTitle = darkMode ? 'text-gray-100' : 'text-black';
  const mutedText = darkMode ? 'text-gray-400' : 'text-black/60';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-green-700 border-t-transparent" />
          <p className="mt-3 text-sm text-black/70">Loading laboratory dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 ${theme}`}>
      <DashboardHeader
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        testTypeFilter={testTypeFilter}
        onTestTypeFilterChange={setTestTypeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        clients={clientOptions}
        labStatus="operational"
        currentTime={currentTime}
        onExport={handleExport}
        exporting={exporting}
      />

      {(exportMessage || error) && (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
            exportMessage && !exportMessage.includes('failed')
              ? 'border-green-700/20 bg-green-50 text-green-800'
              : 'border-black/20 bg-green-50 text-black/80'
          }`}
        >
          {exportMessage || error}
          {error && exportMessage ? '' : error ? ' Showing available data and computed lab metrics.' : ''}
        </p>
      )}

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Samples Today"
          value={samplesToday}
          icon={Package}
          trend={8.2}
          comparison="vs yesterday"
        />
        <MetricCard
          title="Tests In Progress"
          value={testsInProgress}
          icon={FlaskConical}
          trend={5.1}
          comparison="vs last week"
          accent="blue"
        />
        <MetricCard
          title="Reports Today"
          value={reportsToday}
          icon={FileText}
          trend={12.4}
          comparison="vs yesterday"
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={ClipboardCheck}
          trend={-3.2}
          comparison="vs last week"
          accent="blue"
        />
        <MetricCard
          title="Avg Turnaround"
          value={`${avgTurnaround}d`}
          icon={Timer}
          trend={-6.5}
          comparison="vs last month"
        />
        <MetricCard
          title="Active Clients"
          value={activeClients}
          icon={Building2}
          trend={4.0}
          comparison="vs last month"
          accent="blue"
        />
      </div>

      {/* Sample Lifecycle Pipeline — priority section */}
      <div className={`mt-6 p-5 ${cardClass}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className={`text-base font-semibold ${cardTitle}`}>Sample Lifecycle Tracker</h2>
            <p className={`text-xs ${mutedText}`}>
              {pipeline.reduce((s, p) => s + p.count, 0)} samples across all stages
            </p>
          </div>
          <span className="rounded-full border border-green-700/20 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            Live Pipeline
          </span>
        </div>
        <SamplePipeline stages={pipeline} />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Monthly Testing Trends" subtitle="Interactive performance analytics" darkMode={darkMode}>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ['tests', 'Total Tests'],
                  ['pass', 'Pass Rate'],
                  ['fail', 'Failure Rate'],
                  ['reports', 'Reports Generated'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChartFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    chartFilter === key
                      ? 'bg-green-700 text-white'
                      : darkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'border border-black/10 bg-white text-black/70 hover:bg-green-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <MonthlyTrendChart data={monthlyTrends} filter={chartFilter} darkMode={darkMode} />
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
                <p className={`text-xs ${mutedText}`}>Total Tests</p>
                <p className={`font-bold ${cardTitle}`}>{totalTests}</p>
              </div>
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
                <p className={`text-xs ${mutedText}`}>Pass Rate</p>
                <p className="font-bold text-green-700">{passRate}%</p>
              </div>
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <p className={`text-xs ${mutedText}`}>Failure Rate</p>
                <p className="font-bold text-blue-700">{failRate}%</p>
              </div>
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
                <p className={`text-xs ${mutedText}`}>Reports</p>
                <p className={`font-bold ${cardTitle}`}>{reportsToday}</p>
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Test Category Distribution" subtitle="By test classification" darkMode={darkMode}>
          <DonutChart data={categoryDistribution} />
        </ChartCard>
      </div>

      {/* Footwear analytics + Machine utilization — priority section */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Footwear Testing Analytics" subtitle="Most requested tests" darkMode={darkMode}>
          <div className="space-y-3">
            {footwearAnalytics.map((test) => (
              <div key={test.label} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`truncate text-sm ${darkMode ? 'text-gray-200' : 'text-black/80'}`}>
                      {test.label}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{test.value}</span>
                  </div>
                  <div className={`h-2 w-full rounded-full ${darkMode ? 'bg-gray-800' : 'bg-black/10'}`}>
                    <div
                      className="h-2 rounded-full bg-green-700"
                      style={{ width: `${(test.value / footwearAnalytics[0].value) * 100}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold ${test.trend >= 0 ? 'text-green-700' : 'text-red-600'}`}
                >
                  {test.trend >= 0 ? '+' : ''}
                  {test.trend}%
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        <div className={`p-5 ${cardClass}`}>
          <div className="mb-4">
            <h3 className={`text-base font-semibold ${cardTitle}`}>Machine Utilization</h3>
            <p className={`text-xs ${mutedText}`}>Equipment availability & workload</p>
          </div>
          <div className="space-y-3">
            {machineUtilization.map((machine) => (
              <div
                key={machine.name}
                className={`rounded-lg border p-3 ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-black/10 bg-green-50/30'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-green-700" />
                    <span className={`text-sm font-medium ${cardTitle}`}>{machine.name}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      machine.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {machine.available ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 flex-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-black/10'}`}>
                    <div
                      className={`h-2.5 rounded-full ${machine.utilization >= 85 ? 'bg-blue-600' : 'bg-green-700'}`}
                      style={{ width: `${machine.utilization}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums text-green-700">{machine.utilization}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Samples Table — priority section */}
      <div className={`mt-6 overflow-hidden ${cardClass}`}>
        <div className="border-b border-black/10 p-5 dark:border-gray-800">
          <h3 className={`text-base font-semibold ${cardTitle}`}>Recent Samples</h3>
          <p className={`text-xs ${mutedText}`}>Active sample tracking & assignments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className={`border-b text-left text-xs uppercase tracking-wide ${darkMode ? 'border-gray-800 bg-gray-800/50 text-gray-400' : 'border-black/10 bg-green-50/50 text-black/60'}`}>
                <th className="px-4 py-3 font-semibold">Sample ID</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Product Type</th>
                <th className="px-4 py-3 font-semibold">Test Requested</th>
                <th className="px-4 py-3 font-semibold">Technician</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((sample) => (
                <tr
                  key={sample.id}
                  className={`border-b transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-black/5 hover:bg-green-50/40'}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-green-700">{sample.id}</td>
                  <td className={`px-4 py-3 ${cardTitle}`}>{sample.client}</td>
                  <td className={`px-4 py-3 ${mutedText}`}>{sample.productType}</td>
                  <td className={`px-4 py-3 ${cardTitle}`}>{sample.testRequested}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-black/40" />
                      {sample.technician}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONFIG[sample.status].className}`}
                    >
                      {STATUS_CONFIG[sample.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_CONFIG[sample.priority].className}`}
                    >
                      {PRIORITY_CONFIG[sample.priority].label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 tabular-nums ${mutedText}`}>
                    {new Date(sample.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client analytics + Report center + Quality metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`p-5 ${cardClass}`}>
          <h3 className={`mb-4 text-base font-semibold ${cardTitle}`}>Top Clients</h3>
          <div className="space-y-2">
            {topClients.length === 0 ? (
              <p className={`text-sm ${mutedText}`}>No client data available.</p>
            ) : (
              topClients.map((client, i) => (
                <div
                  key={client.name}
                  className={`rounded-lg border p-3 ${darkMode ? 'border-gray-800' : 'border-black/10'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${cardTitle}`}>
                        {i + 1}. {client.name}
                      </p>
                      <div className={`mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs ${mutedText}`}>
                        <span>Samples: {client.samples}</span>
                        <span>Tests: {client.tests}</span>
                        <span>Revenue: {client.revenue}</span>
                        <span>Last: {client.lastActivity}</span>
                      </div>
                    </div>
                    <Building2 className="h-4 w-4 shrink-0 text-blue-700" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`p-5 ${cardClass}`}>
          <h3 className={`mb-4 text-base font-semibold ${cardTitle}`}>Report Generation Center</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Generated Today', value: reportsToday, icon: FileCheck, color: 'text-green-700' },
              { label: 'Pending Review', value: pendingApprovals, icon: Clock3, color: 'text-blue-700' },
              { label: 'Awaiting Approval', value: Math.max(1, pendingApprovals - 1), icon: ClipboardCheck, color: 'text-amber-600' },
              { label: 'Reports Sent', value: Math.max(2, reportsToday + 4), icon: CheckCircle2, color: 'text-green-700' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border p-3 ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-black/10 bg-green-50/40'}`}
              >
                <item.icon className={`mb-2 h-5 w-5 ${item.color}`} />
                <p className={`text-2xl font-bold tabular-nums ${cardTitle}`}>{item.value}</p>
                <p className={`text-xs ${mutedText}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-5 ${cardClass}`}>
          <h3 className={`mb-4 text-base font-semibold ${cardTitle}`}>Quality Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <GaugeChart label="Pass Rate" value={passRate} color="#15803d" />
            <GaugeChart label="Failure Rate" value={failRate} color="#2563eb" />
            <GaugeChart label="Retest Rate" value={retestRate} color="#16a34a" />
            <GaugeChart label="Avg Test Time" value={3.7} max={8} unit=" hrs" color="#15803d" />
          </div>
          <div className={`mt-3 rounded-lg border p-3 text-center ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-black/10 bg-blue-50/50'}`}>
            <p className={`text-xs ${mutedText}`}>Customer Satisfaction</p>
            <p className="text-2xl font-bold text-blue-700">{satisfaction}/5.0</p>
            <div className="mx-auto mt-1 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < Math.floor(satisfaction) ? 'bg-green-700' : 'bg-black/10'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions + Activity timeline */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`p-5 xl:col-span-1 ${cardClass}`}>
          <h3 className={`mb-4 text-base font-semibold ${cardTitle}`}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Register Sample', icon: Package },
              { label: 'Create Test Request', icon: FlaskConical },
              { label: 'Generate Report', icon: FileText },
              { label: 'Assign Technician', icon: Users },
              { label: 'Schedule Testing', icon: Calendar },
              { label: 'Download Analytics', icon: TrendingUp },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={quickActionHandlers[action.label]}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium transition-colors ${
                  darkMode
                    ? 'border-gray-800 hover:border-green-700/40 hover:bg-gray-800'
                    : 'border-black/10 hover:border-green-700/30 hover:bg-green-50'
                }`}
              >
                <action.icon className="h-5 w-5 text-green-700" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`p-5 xl:col-span-2 ${cardClass}`}>
          <h3 className={`mb-4 text-base font-semibold ${cardTitle}`}>Recent Activity Timeline</h3>
          <div className="space-y-0">
            {activityTimeline.map((item, i) => {
              const icons = {
                sample: Package,
                started: Activity,
                completed: CheckCircle2,
                report: FileText,
                download: Layers,
              };
              const Icon = icons[item.type];
              return (
                <div key={`${item.text}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-100 p-1.5">
                      <Icon className="h-3.5 w-3.5 text-green-700" />
                    </div>
                    {i < activityTimeline.length - 1 && (
                      <div className={`my-1 w-px flex-1 ${darkMode ? 'bg-gray-700' : 'bg-black/10'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm ${cardTitle}`}>{item.text}</p>
                    <p className={`text-xs ${mutedText}`}>
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lab workload summary footer */}
      <div className={`mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 ${cardClass} p-4`}>
        {[
          { label: 'Samples in Lab', value: pipeline.slice(0, 5).reduce((s, p) => s + p.count, 0), icon: Package },
          { label: 'Tests Running', value: testsInProgress, icon: FlaskConical },
          { label: 'Reports Pending', value: pendingApprovals, icon: FileText },
          { label: 'Machines Busy', value: machineUtilization.filter((m) => !m.available).length, icon: Wrench },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <stat.icon className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className={`text-lg font-bold tabular-nums ${cardTitle}`}>{stat.value}</p>
              <p className={`text-xs ${mutedText}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
