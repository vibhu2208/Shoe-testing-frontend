'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  FlaskConical,
  Loader2,
  Moon,
  Package,
  Plus,
  Search,
  Sun,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { LAB_TESTS } from '@/lib/labTests';

export interface ClientOption {
  id: string;
  name: string;
}

interface DashboardHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  testTypeFilter: string;
  onTestTypeFilterChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  clients: ClientOption[];
  labStatus: 'operational' | 'maintenance';
  currentTime: Date;
  onExport: () => void;
  exporting: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Register New Sample', icon: Package, href: '/admin/clients' },
  { label: 'Create Test Request', icon: FlaskConical, href: '/admin/clients' },
  { label: 'Generate Report', icon: FileText, href: '/admin/clients' },
  { label: 'Assign Technician', icon: UserPlus, href: '/admin/users' },
  { label: 'Schedule Testing', icon: Calendar, href: '/admin/periodic-tests' },
  { label: 'Download Analytics', icon: TrendingUp, action: 'export' as const },
];

export default function DashboardHeader({
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  clientFilter,
  onClientFilterChange,
  testTypeFilter,
  onTestTypeFilterChange,
  dateRange,
  onDateRangeChange,
  clients,
  labStatus,
  currentTime,
  onExport,
  exporting,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const isOperational = labStatus === 'operational';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAction = (item: (typeof QUICK_ACTIONS)[number]) => {
    setQuickActionsOpen(false);
    if ('action' in item && item.action === 'export') {
      onExport();
      return;
    }
    if ('href' in item && item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 shadow-sm">
            <FlaskConical className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black md:text-2xl">Laboratory Operations</h1>
            <p className="text-sm text-black/60">Footwear Testing & Quality Assurance</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-700" />
            <span className="font-medium text-black">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-black/40">|</span>
            <span className="tabular-nums text-black/70">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isOperational
                ? 'border border-green-700/30 bg-green-100 text-green-800'
                : 'border border-amber-500/30 bg-amber-50 text-amber-800'
            }`}
          >
            <span
              className={`h-2 w-2 animate-pulse rounded-full ${isOperational ? 'bg-green-600' : 'bg-amber-500'}`}
            />
            {isOperational ? 'Operational' : 'Maintenance'}
          </div>

          <button
            type="button"
            className="relative rounded-lg border border-black/10 bg-white p-2 transition-colors hover:bg-green-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-black/70" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="rounded-lg border border-black/10 bg-white p-2 transition-colors hover:bg-green-50"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5 text-black/70" /> : <Moon className="h-5 w-5 text-black/70" />}
          </button>

          <div className="relative" ref={quickActionsRef}>
            <button
              type="button"
              onClick={() => setQuickActionsOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
              aria-expanded={quickActionsOpen}
              aria-haspopup="menu"
            >
              <Plus className="h-4 w-4" />
              Quick Actions
              <ChevronDown className={`h-4 w-4 transition-transform ${quickActionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {quickActionsOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg"
              >
                {QUICK_ACTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={() => handleQuickAction(item)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-black/80 transition-colors hover:bg-green-50"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-green-700" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-gradient-to-r from-green-50 via-white to-blue-50/30 p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            type="search"
            placeholder="Global search samples, clients, tests..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white py-2 pl-10 pr-4 text-sm !text-black shadow-sm focus:border-green-700/40 focus:outline-none focus:ring-2 focus:ring-green-700/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={clientFilter}
            onChange={(e) => onClientFilterChange(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm !text-black focus:border-green-700/40 focus:outline-none"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={testTypeFilter}
            onChange={(e) => onTestTypeFilterChange(e.target.value)}
            className="max-w-[220px] rounded-lg border border-black/10 bg-white px-3 py-2 text-sm !text-black focus:border-green-700/40 focus:outline-none"
          >
            <option value="">All Tests (9)</option>
            {LAB_TESTS.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm !text-black focus:border-green-700/40 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-green-700" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
