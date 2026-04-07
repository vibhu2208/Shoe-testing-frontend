'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Mail, Phone, MoreVertical, Eye, FileText, CheckCircle } from 'lucide-react';
import OnboardClientDrawer from '@/components/clients/OnboardClientDrawer';
import NewArticleDrawer from '@/components/clients/NewArticleDrawer';
import ClientArticles from '@/components/clients/ClientArticles';

interface Client {
  id: number;
  company_name: string;
  client_code: string;
  industry: string;
  country: string;
  address: string;
  status: 'active' | 'inactive';
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  total_orders: number;
  total_tests: number;
  total_reports: number;
  created_at: string;
  updated_at: string;
}

export default function ClientsTab() {
  const [isOnboardDrawerOpen, setIsOnboardDrawerOpen] = useState(false);
  const [isNewArticleDrawerOpen, setIsNewArticleDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<{
    totalArticles: number;
    pendingTests: number;
    completedTests: number;
    reportsSent: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [viewingArticles, setViewingArticles] = useState<{ clientId: number; clientName: string } | null>(null);

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl('/api/clients'), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      } else {
        console.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl('/api/clients/stats'), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const payload = await response.json();
        setStatsData({
          totalArticles: Number(payload.totalArticles || 0),
          pendingTests: Number(payload.pendingTests || 0),
          completedTests: Number(payload.completedTests || 0),
          reportsSent: Number(payload.reportsSent || 0),
        });
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.client-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const handleViewArticles = (clientId: number) => {
    // Find the client name
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setViewingArticles({ clientId, clientName: client.company_name });
    }
  };

  const handleDropdownToggle = (clientId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === clientId.toString() ? null : clientId.toString());
  };

  const handleEditClient = (clientId: number) => {
    console.log('✏️ Editing client:', clientId);
    alert(`Editing client ${clientId} - Feature coming soon!`);
    setActiveDropdown(null);
    // TODO: Implement edit client functionality
  };

  const handleViewReports = (clientId: number) => {
    console.log('📊 Viewing reports for client:', clientId);
    alert(`Viewing reports for client ${clientId} - Feature coming soon!`);
    setActiveDropdown(null);
    // TODO: Implement view reports functionality
  };

  const handleCreateNewArticle = (clientId: number, clientName: string) => {
    console.log('📦 Creating new article for client:', clientId, clientName);
    setSelectedClient({ id: clientId, name: clientName });
    setIsNewArticleDrawerOpen(true);
    setActiveDropdown(null);
  };

  const handleDeactivateClient = (clientId: number) => {
    console.log('🚫 Deactivating client:', clientId);
    alert(`Deactivating client ${clientId} - Feature coming soon!`);
    setActiveDropdown(null);
    // TODO: Implement deactivate client functionality
  };

  const handleClientCreated = () => {
    // Refresh clients list after new client is created
    fetchClients();
    fetchStats();
  };

  const handleBackToClients = () => {
    setViewingArticles(null);
    fetchClients();
    fetchStats();
  };

  const handleNewArticleClose = () => {
    setIsNewArticleDrawerOpen(false);
    setSelectedClient(null);
  };

  const handleArticleCreated = () => {
    // Refresh clients list to update article counts
    fetchClients();
    fetchStats();
  };

  const totalClients = clients.length;

  return (
    <>
      {viewingArticles ? (
        <ClientArticles
          clientId={viewingArticles.clientId}
          clientName={viewingArticles.clientName}
          onBack={handleBackToClients}
        />
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Clients</p>
              <p className="text-3xl font-bold text-slate-900">{totalClients}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Articles</p>
              <p className="text-3xl font-bold text-slate-900">
                {loadingStats ? '—' : statsData?.totalArticles ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Tests</p>
              <p className="text-3xl font-bold text-slate-900">
                {loadingStats ? '—' : statsData?.pendingTests ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completed Tests</p>
              <p className="text-3xl font-bold text-slate-900">
                {loadingStats ? '—' : statsData?.completedTests ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Reports Sent</p>
              <p className="text-3xl font-bold text-slate-900">
                {loadingStats ? '—' : statsData?.reportsSent ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Header with Onboard Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Client Directory</h2>
        <button
          onClick={() => setIsOnboardDrawerOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Client</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading clients...</p>
          </div>
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{client.company_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {client.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{client.client_code}</p>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => handleDropdownToggle(client.id, e)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === client.id.toString() && (
                    <div className="client-dropdown absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                      <button
                        onClick={() => handleEditClient(client.id)}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit Client Details
                      </button>
                      <button
                        onClick={() => handleViewReports(client.id)}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        View All Reports
                      </button>
                      <button
                        onClick={() => handleCreateNewArticle(client.id, client.company_name)}
                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                      >
                        📦 Create New Article
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleDeactivateClient(client.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Deactivate Client
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Contact */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                  <Mail className="w-4 h-4" />
                  <span>{client.primary_contact_name || 'No contact'}</span>
                </div>
                <p className="text-sm text-slate-500 ml-6">{client.primary_contact_email || 'No email'}</p>
              </div>

              {/* Location & Industry */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{client.country}</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                  {client.industry}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                <span>{client.total_orders || 0} Articles</span>
                <span>{client.total_tests || 0} Tests</span>
                <span>{client.total_reports || 0} Reports</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => handleViewArticles(client.id)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Articles</span>
                </button>
                <button 
                  onClick={() => handleCreateNewArticle(client.id, client.company_name)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Article</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Get started by onboarding your first client to the Virola LIMS platform.
          </p>
          <button
            onClick={() => setIsOnboardDrawerOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard First Client</span>
          </button>
        </div>
      )}

      {/* Onboard Client Drawer */}
          <OnboardClientDrawer 
            isOpen={isOnboardDrawerOpen}
            onClose={() => setIsOnboardDrawerOpen(false)}
            onClientCreated={handleClientCreated}
          />

          {/* New Article Drawer */}
          {selectedClient && (
            <NewArticleDrawer
              isOpen={isNewArticleDrawerOpen}
              onClose={handleNewArticleClose}
              clientId={selectedClient.id}
              clientName={selectedClient.name}
              onArticleCreated={handleArticleCreated}
            />
          )}
        </>
      )}
    </>
  );
}
