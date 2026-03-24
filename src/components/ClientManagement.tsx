'use client';

import React, { useState } from 'react';
import { Building2, Plus, Users, FileText, BarChart3 } from 'lucide-react';
import ClientsTab from '@/components/clients/ClientsTab';
import ActiveOrdersTab from '@/components/clients/ActiveOrdersTab';
import ReportsTab from '@/components/clients/ReportsTab';

export default function ClientManagement() {
  const [activeTab, setActiveTab] = useState('clients');

  const tabs = [
    { id: 'clients', label: 'All Clients', icon: Building2 },
    { id: 'orders', label: 'Active Orders', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'clients':
        return <ClientsTab />;
      case 'orders':
        return <ActiveOrdersTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <ClientsTab />;
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Clients</h1>
            <p className="text-slate-600">Manage client onboarding and test orders</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}
