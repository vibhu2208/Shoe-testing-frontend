'use client';

import { publicApiUrl } from '@/lib/apiBase';
import { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight } from 'lucide-react';
import TestCard from '@/components/TestCard';
import TestDrawer from '@/components/TestDrawer';
import { Test, Stats } from '@/types/test';

export default function TestLibraryContent() {
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [standardFilter, setStandardFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
    fetchStats();
  }, []);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (standardFilter) queryParams.append('standard', standardFilter);

      const response = await fetch(publicApiUrl(`/api/tests?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl('/api/tests/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [searchTerm, categoryFilter, standardFilter]);

  const handleViewDetails = (test: Test) => {
    setSelectedTest(test);
    setDrawerOpen(true);
  };

  const handleCategoryUpdate = async (testId: string, newCategory: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl(`/api/tests/${testId}/category`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: newCategory })
      });

      if (response.ok) {
        fetchTests();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchTerm || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || test.category === categoryFilter;
    const matchesStandard = !standardFilter || test.standard.toLowerCase().includes(standardFilter.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesStandard;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Library</h1>
              <p className="text-gray-600 mt-1">Manage and view laboratory test specifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  <option value="">All Categories</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="WIP">WIP</option>
                  <option value="Finished Good">Finished Good</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Filter by standard..."
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tests</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalTests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Raw Materials</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.categories['Raw Material'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">WIP</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.categories['WIP'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Finished Goods</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.categories['Finished Good'] || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Cards Grid */}
      <div className="px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onTestClick={handleViewDetails}
                onCategoryChange={handleCategoryUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Test Details Drawer */}
      {selectedTest && (
        <TestDrawer
          test={selectedTest}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedTest(null);
          }}
          onCategoryChange={handleCategoryUpdate}
        />
      )}
    </div>
  );
}
