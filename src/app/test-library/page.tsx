'use client';

import { publicApiUrl } from '@/lib/apiBase';
import { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight } from 'lucide-react';
import TestCard from '@/components/TestCard';
import TestDrawer from '@/components/TestDrawer';
import Sidebar from '@/components/Sidebar';
import { Test, Stats } from '@/types/test';

export default function TestLibraryPage() {
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
  }, [searchTerm, categoryFilter, standardFilter]);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (standardFilter) params.append('standard', standardFilter);

      const response = await fetch(publicApiUrl(`/api/tests?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`
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
          'Authorization': `Bearer ${token}`
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

  const handleTestClick = (test: Test) => {
    setSelectedTest(test);
    setDrawerOpen(true);
  };

  const handleCategoryChange = async (testId: string, newCategory: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl(`/api/tests/${testId}/category`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: newCategory })
      });

      if (response.ok) {
        // Update local state
        setTests(tests.map(test => 
          test.id === testId ? { ...test, category: newCategory as any } : test
        ));
        if (selectedTest && selectedTest.id === testId) {
          setSelectedTest({ ...selectedTest, category: newCategory as any });
        }
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const getSatraCount = () => {
    if (!stats) return 0;
    return Object.entries(stats.standards)
      .filter(([standard]) => standard.includes('SATRA'))
      .reduce((sum, [, count]) => sum + count, 0);
  };

  const getIsoCount = () => {
    if (!stats) return 0;
    return Object.entries(stats.standards)
      .filter(([standard]) => standard.includes('ISO'))
      .reduce((sum, [, count]) => sum + count, 0);
  };

  const getInternalCount = () => {
    if (!stats) return 0;
    return Object.entries(stats.standards)
      .filter(([standard]) => standard.includes('Internal'))
      .reduce((sum, [, count]) => sum + count, 0);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar currentPage="tests" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentPage="tests" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Test Library</h1>
              <p className="text-slate-600 mt-1">Manage and reference all quality tests</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                <option value="Raw Material">Raw Material</option>
                <option value="WIP">Work In Progress</option>
                <option value="Finished Good">Finished Good</option>
              </select>
              <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Standard Filter */}
            <div className="relative">
              <select
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Standards</option>
                <option value="SATRA">SATRA</option>
                <option value="ISO">ISO</option>
                <option value="Internal">Internal</option>
              </select>
              <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{stats.totalTests} Tests</span>
              <span>{Object.keys(stats.categories).length} Categories</span>
              <span>{getSatraCount()} SATRA</span>
              <span>{getIsoCount()} ISO</span>
              <span>{getInternalCount()} Internal</span>
            </div>
          </div>
        )}

        {/* Test Cards Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onTestClick={handleTestClick}
                onCategoryChange={handleCategoryChange}
              />
            ))}
          </div>

          {tests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg">No tests found</div>
              <div className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Test Drawer */}
      <TestDrawer
        test={selectedTest}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
