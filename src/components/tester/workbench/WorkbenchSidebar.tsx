'use client';

import { ChevronLeft, LogOut, Menu, PanelLeftOpen, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { WORKBENCH_SECTIONS } from '@/lib/workbenchSections';
import type { WorkbenchSectionId } from '@/types/testerWorkbench';

const STORAGE_KEY = 'tester-workbench-sidebar-collapsed';

interface WorkbenchSidebarProps {
  activeSection: WorkbenchSectionId;
  onSectionChange: (section: WorkbenchSectionId) => void;
  badges: Partial<Record<WorkbenchSectionId, number>>;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  testerName: string;
  onLogout: () => void;
}

export default function WorkbenchSidebar({
  activeSection,
  onSectionChange,
  badges,
  mobileOpen,
  onMobileOpenChange,
  collapsed,
  onCollapsedChange,
  testerName,
  onLogout,
}: WorkbenchSidebarProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        onCollapsedChange(stored === '1');
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [onCollapsedChange]);

  const toggleCollapsed = () => {
    onCollapsedChange(!collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, !collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const handleNav = (section: WorkbenchSectionId) => {
    onSectionChange(section);
    onMobileOpenChange(false);
  };

  const renderNav = (compact: boolean) => (
    <>
      <div
        className={`shrink-0 border-b border-black/10 ${compact ? 'px-2 py-3' : 'px-4 py-4'}`}
      >
        {compact ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-green-700 bg-green-50 text-green-800 shadow-sm hover:bg-green-100"
              aria-label="Expand sidebar"
              title="Open menu"
            >
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-sm font-bold text-white"
              title={testerName}
            >
              {testerName.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-700 text-sm font-bold text-white">
              {testerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-black">{testerName}</p>
              <p className="text-xs text-black/50">Footwear Testing Lab</p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="shrink-0 rounded-lg border border-black/10 p-1.5 text-black/60 hover:bg-green-50 hover:text-black"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
        {!compact && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-black/40">
            Sections
          </p>
        )}
        <ul className="space-y-0.5">
          {WORKBENCH_SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            const badge = badges[section.id];
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => handleNav(section.id)}
                  title={compact ? section.label : undefined}
                  aria-label={compact ? section.label : undefined}
                  className={`group relative flex w-full items-center rounded-lg text-left transition-colors ${
                    compact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    active
                      ? 'bg-green-700 text-white shadow-sm'
                      : 'text-black/70 hover:bg-green-50 hover:text-black'
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-white' : 'text-green-700'}`}
                      aria-hidden
                    />
                    {compact && badge != null && badge > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-black ring-2 ring-white" />
                    )}
                  </span>
                  {!compact && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{section.label}</p>
                        <p
                          className={`truncate text-[11px] ${active ? 'text-white/80' : 'text-black/40'}`}
                        >
                          {section.description}
                        </p>
                      </div>
                      {badge != null && badge > 0 && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                            active ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-black/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          title={compact ? 'Logout' : undefined}
          aria-label={compact ? 'Logout' : undefined}
          className={`flex w-full items-center rounded-lg border border-black/10 text-sm font-medium text-black hover:bg-green-50 ${
            compact ? 'justify-center p-2' : 'gap-2 px-3 py-2'
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {!compact && 'Logout'}
        </button>
      </div>
    </>
  );

  const desktopWidth = collapsed ? 'w-[4.5rem]' : 'w-64';

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={() => onMobileOpenChange(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm lg:hidden"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => onMobileOpenChange(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Desktop — fixed full height, does not scroll with page */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-black/10 bg-white shadow-sm transition-[width] duration-200 ease-in-out lg:flex ${desktopWidth} ${hydrated ? 'opacity-100' : 'opacity-0'}`}
      >
        {renderNav(collapsed)}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNav(false)}
      </aside>
    </>
  );
}
