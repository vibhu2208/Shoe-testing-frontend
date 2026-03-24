'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/AdminSidebar';
import UserManagement from '@/components/UserManagement';
import ClientManagement from '@/components/ClientManagement';
// Import TestLibraryContent without the Sidebar
import TestLibraryContent from '../test-library/TestLibraryContent';

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Dashboard</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Welcome to the admin dashboard. Use the sidebar to navigate between different sections.
                  The user management section allows you to create and manage tester accounts.
                </p>
              </div>
            </div>
          </div>
        );
      case 'clients':
        return <ClientManagement />;
      case 'tests':
        return <TestLibraryContent />;
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
        />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}>
          <div className="h-full overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
