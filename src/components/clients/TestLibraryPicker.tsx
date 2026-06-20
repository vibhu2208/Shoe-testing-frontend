'use client';

import { publicApiUrl } from '@/lib/apiBase';
import { Search, CheckCircle2, FlaskConical } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Test } from '@/types/test';

interface TestLibraryPickerProps {
  selectedTestIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function mapLibraryCategory(category: Test['category']): string {
  if (category === 'WIP') return 'Work In Progress';
  return category;
}

export function buildTestsFromLibrarySelection(tests: Test[], selectedIds: string[]) {
  return selectedIds
    .map((id) => tests.find((t) => t.id === id))
    .filter((t): t is Test => Boolean(t))
    .map((test, index) => ({
      id: `library-row-${test.id}-${index}`,
      serial_number: index + 1,
      test_name: test.name,
      standard_method: test.standard,
      client_requirement: '',
      category: mapLibraryCategory(test.category) as 'Raw Material' | 'Work In Progress' | 'Finished Good',
      execution_type: 'inhouse' as const,
      inhouse_test_id: test.id,
      vendor_name: '',
      vendor_contact: '',
      vendor_email: '',
      expected_report_date: null,
      assigned_tester_id: null,
      test_deadline: null,
      notes: null,
      isEditing: false,
      hasError: false,
    }));
}

export default function TestLibraryPicker({ selectedTestIds, onSelectionChange }: TestLibraryPickerProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (categoryFilter) queryParams.append('category', categoryFilter);

      const response = await fetch(publicApiUrl(`/api/tests?${queryParams}`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
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
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const toggleTest = (testId: string) => {
    if (selectedTestIds.includes(testId)) {
      onSelectionChange(selectedTestIds.filter((id) => id !== testId));
    } else {
      onSelectionChange([...selectedTestIds, testId]);
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Finished Good':
        return 'bg-green-100 text-green-800';
      case 'WIP':
        return 'bg-blue-100 text-blue-800';
      case 'Raw Material':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tests by name or description..."
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
        >
          <option value="">All categories</option>
          <option value="Raw Material">Raw Material</option>
          <option value="WIP">Work In Progress</option>
          <option value="Finished Good">Finished Good</option>
        </select>
      </div>

      {selectedTestIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          {selectedTestIds.length} test{selectedTestIds.length !== 1 ? 's' : ''} selected — you will enter client requirements on the next step.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading test library...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p>No tests found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {tests.map((test) => {
            const isSelected = selectedTestIds.includes(test.id);
            return (
              <button
                key={test.id}
                type="button"
                onClick={() => toggleTest(test.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                        {test.id}
                      </span>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getCategoryBadgeStyle(test.category)}`}>
                        {test.category === 'WIP' ? 'WIP' : test.category}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900 truncate">{test.name}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">{test.standard}</p>
                    {test.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{test.description}</p>
                    )}
                  </div>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
