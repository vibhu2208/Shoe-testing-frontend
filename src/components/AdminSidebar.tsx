'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu, 
  X,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  TestTube,
  Building2,
  RotateCw
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function AdminSidebar({ 
  isCollapsed: propCollapsed = false, 
  onCollapse 
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localCollapsed, setLocalCollapsed] = useState(propCollapsed);
  const { user, logout } = useAuth();

  const actualCollapsed = onCollapse ? propCollapsed : localCollapsed;
  const handleCollapse = () => {
    if (onCollapse) {
      onCollapse(!actualCollapsed);
    } else {
      setLocalCollapsed(!actualCollapsed);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'clients', label: 'Clients', icon: Building2, href: '/admin/clients' },
    { id: 'periodic', label: 'Periodic tests', icon: RotateCw, href: '/admin/periodic-tests' },
    { id: 'tests', label: 'Test Library', icon: TestTube, href: '/admin/test-library' },
    { id: 'users', label: 'User Management', icon: Users, href: '/admin/users' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 bg-gray-900 border-r border-gray-800 transform transition-all duration-300 ease-in-out
        ${actualCollapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-3 ${actualCollapsed ? 'justify-center' : ''}`}>
                <div className="p-2 bg-white rounded-lg">
                  <Settings className="w-5 h-5 text-gray-900" />
                </div>
                {!actualCollapsed && (
                  <div>
                    <h2 className="text-lg font-semibold text-white">Admin</h2>
                    <p className="text-xs text-gray-400">Panel</p>
                  </div>
                )}
              </div>
              {/* Desktop collapse button */}
              <button
                onClick={handleCollapse}
                className="hidden lg:flex p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                {actualCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                    ${actualCollapsed ? 'justify-center' : 'space-x-3'}
                  `}
                  title={actualCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!actualCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-800">
            <div className={`flex items-center ${actualCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}>
              <div className="p-2 bg-gray-800 rounded-lg">
                <User className="w-4 h-4 text-gray-300" />
              </div>
              {!actualCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors
                ${actualCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={actualCollapsed ? 'Logout' : ''}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!actualCollapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
