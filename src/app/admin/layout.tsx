'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-white">
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
        />
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <div className="h-full overflow-auto bg-white">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
