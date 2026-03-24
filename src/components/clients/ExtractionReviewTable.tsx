'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, AlertCircle, CheckCircle2, Eye, EyeOff, X, User } from 'lucide-react';

interface ComponentInfo {
  name: string;
  material_type: string;
  color: string | null;
}

interface Tester {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface TestRow {
  id: string;
  serial_number: number;
  test_name: string;
  standard_method: string | null;
  client_requirement: string;
  category: 'Raw Material' | 'Work In Progress' | 'Finished Good';
  execution_type: 'inhouse' | 'outsource';
  inhouse_test_id: string | null;
  vendor_name: string;
  vendor_contact: string;
  vendor_email: string;
  expected_report_date: string | null;
  assigned_tester_id: string | null;
  test_deadline: string | null;
  notes: string | null;
  isEditing: boolean;
  hasError: boolean;
}

interface ExtractionMeta {
  total_tests_found: number;
  inhouse_count: number;
  outsource_count: number;
  raw_material_count: number;
  wip_count: number;
  finished_good_count: number;
}

interface ExtractedData {
  component: ComponentInfo | null;
  tests: TestRow[];
  extraction_meta: ExtractionMeta;
}

interface Props {
  extractedData: ExtractedData;
  onConfirm: (tests: TestRow[], componentInfo: ComponentInfo) => void;
  onBack: () => void;
}

const INHOUSE_TEST_OPTIONS = [
  { id: 'SATRA-TM-174', label: 'SATRA-TM-174 — Sole Abrasion' },
  { id: 'SATRA-TM-92', label: 'SATRA-TM-92 — Sole Flexing' },
  { id: 'SATRA-TM-161', label: 'SATRA-TM-161 — Whole Shoe Flexing' },
  { id: 'SATRA-TM-281', label: 'SATRA-TM-281 — Bond Strength' },
  { id: 'PH-001', label: 'PH-001 — pH Value' },
  { id: 'ISO-19574', label: 'ISO-19574 — Antifungal Test' },
  { id: 'FZ-001', label: 'FZ-001 — Freezing Test' },
  { id: 'HAO-001', label: 'HAO-001 — Hot Air Oven Test' },
  { id: 'SATRA-TM-31', label: 'SATRA-TM-31 — Material Abrasion' },
  { id: null, label: 'No mapping (manual)' }
];

const ExtractionReviewTable: React.FC<Props> = ({ extractedData, onConfirm, onBack }) => {
  const [tests, setTests] = useState<TestRow[]>(() => {
    // Deep clone the tests array to prevent shared references
    return (extractedData.tests || []).map((test, index) => ({
      id: test.id || `extracted-row-${index}-${Date.now()}`,
      serial_number: test.serial_number || index + 1,
      test_name: test.test_name || '',
      standard_method: test.standard_method || null,
      client_requirement: test.client_requirement || '',
      category: test.category || 'Work In Progress',
      execution_type: test.execution_type || 'outsource',
      inhouse_test_id: test.inhouse_test_id || null,
      vendor_name: test.vendor_name || '',
      vendor_contact: test.vendor_contact || '',
      vendor_email: test.vendor_email || '',
      expected_report_date: test.expected_report_date || null,
      assigned_tester_id: test.assigned_tester_id || null,
      test_deadline: test.test_deadline || null,
      notes: test.notes || null,
      isEditing: false,
      hasError: false
    }));
  });
  const [componentInfo, setComponentInfo] = useState<ComponentInfo>(
    extractedData.component || { name: '', material_type: '', color: null }
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loadingTesters, setLoadingTesters] = useState(false);

  // Validate tests and calculate errors (without updating state)
  const validateTests = (testsToValidate: TestRow[]) => {
    const errors: string[] = [];
    const validatedTests = testsToValidate.map(test => {
      let hasError = false;
      
      if (!test.test_name.trim()) {
        errors.push(`Row ${test.serial_number}: Test name is required`);
        hasError = true;
      }
      
      if (!test.client_requirement.trim()) {
        errors.push(`Row ${test.serial_number}: Client requirement is required`);
        hasError = true;
      }
      
      if (test.execution_type === 'outsource') {
        if (!test.vendor_name.trim()) {
          errors.push(`Row ${test.serial_number}: Vendor name is required for outsource tests`);
          hasError = true;
        }
        if (!test.expected_report_date) {
          errors.push(`Row ${test.serial_number}: Expected report date is required for outsource tests`);
          hasError = true;
        }
      }
      
      return { ...test, hasError };
    });
    
    return { validatedTests, errors };
  };

  // Update validation errors when tests change
  useEffect(() => {
    const { errors } = validateTests(tests);
    setValidationErrors(errors);
  }, [tests]);

  // Fetch testers when component mounts
  useEffect(() => {
    const fetchTesters = async () => {
      setLoadingTesters(true);
      try {
        const response = await fetch('http://localhost:5000/api/clients/users?role=tester');
        if (response.ok) {
          const testersData = await response.json();
          setTesters(testersData);
        } else {
          console.error('Failed to fetch testers');
        }
      } catch (error) {
        console.error('Error fetching testers:', error);
      } finally {
        setLoadingTesters(false);
      }
    };

    fetchTesters();
  }, []);

  const updateTest = (testId: string, updates: Partial<TestRow>) => {
    console.log('🔄 Updating test:', testId, updates);
    console.log('📋 Current tests before update:', tests.map(t => ({ id: t.id, test_name: t.test_name })));
    
    setTests(prev => {
      console.log('📝 Previous state:', prev.map(t => ({ id: t.id, test_name: t.test_name })));
      
      const updated = prev.map(test => {
        if (test.id === testId) {
          const updatedTest = { ...test, ...updates };
          console.log('✅ Updated test:', updatedTest);
          return updatedTest;
        }
        return test;
      });
      
      console.log('🎯 Final updated array:', updated.map(t => ({ id: t.id, test_name: t.test_name })));
      return updated;
    });
  };

  const toggleRequirementExpansion = (testId: string) => {
    setExpandedRequirements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const addNewTest = () => {
    const newTest: TestRow = {
      id: `manual-row-${Date.now()}`,
      serial_number: tests.length + 1,
      test_name: '',
      standard_method: null,
      client_requirement: '',
      category: 'Work In Progress',
      execution_type: 'outsource',
      inhouse_test_id: null,
      vendor_name: '',
      vendor_contact: '',
      vendor_email: '',
      expected_report_date: null,
      assigned_tester_id: null,
      test_deadline: null,
      notes: null,
      isEditing: true,
      hasError: false
    };
    setTests(prev => [...prev, newTest]);
  };

  const deleteTest = (testId: string) => {
    setTests(prev => prev.filter(test => test.id !== testId));
  };

  const handleConfirm = () => {
    if (validationErrors.length === 0) {
      onConfirm(tests, componentInfo);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Raw Material':
        return 'bg-slate-100 text-slate-700';
      case 'Work In Progress':
        return 'bg-slate-100 text-slate-700';
      case 'Finished Good':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Component Info Bar */}
      <div className="bg-slate-50 p-4 border-b">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Extracted Component</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Component Name</label>
            <input
              type="text"
              value={componentInfo.name}
              onChange={(e) => setComponentInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter component name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Material Type</label>
            <input
              type="text"
              value={componentInfo.material_type}
              onChange={(e) => setComponentInfo(prev => ({ ...prev, material_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter material type"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
            <input
              type="text"
              value={componentInfo.color || ''}
              onChange={(e) => setComponentInfo(prev => ({ ...prev, color: e.target.value || null }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter color"
            />
          </div>
        </div>
      </div>

      {/* Extraction Summary */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Total Tests: {extractedData.extraction_meta.total_tests_found}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            In-House: {extractedData.extraction_meta.inhouse_count}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Outsource: {extractedData.extraction_meta.outsource_count}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Raw Material: {extractedData.extraction_meta.raw_material_count}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            WIP: {extractedData.extraction_meta.wip_count}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Finished Good: {extractedData.extraction_meta.finished_good_count}
          </span>
        </div>
        <p className="text-xs text-slate-500 italic">
          Review and edit before confirming. Category and execution type can be changed per row.
        </p>
      </div>

      {/* Main Review Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="w-12 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">S.No</th>
              <th className="min-w-[200px] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Name</th>
              <th className="w-32 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Standard</th>
              <th className="min-w-[280px] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Requirement</th>
              <th className="w-36 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Execution</th>
              <th className="min-w-[200px] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mapping</th>
              <th className="w-40 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assign Tester</th>
              <th className="w-32 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline</th>
              <th className="w-40 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
              <th className="w-12 px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 text-slate-900">
            {tests.map((test) => {
              const isExpanded = expandedRequirements.has(test.id);
              const requirementText = test.client_requirement;
              const shouldTruncate = requirementText.length > 100;
              
              // Calculate validation errors for this specific test
              const hasTestNameError = !test.test_name.trim();
              const hasRequirementError = !test.client_requirement.trim();
              const hasVendorError = test.execution_type === 'outsource' && !test.vendor_name.trim();
              const hasDateError = test.execution_type === 'outsource' && !test.expected_report_date;
              const hasError = hasTestNameError || hasRequirementError || hasVendorError || hasDateError;
              
              return (
                <tr key={test.id} className={hasError ? 'bg-red-50' : ''}>
                  <td className="px-3 py-4 text-sm text-center text-slate-500">
                    {test.serial_number}
                  </td>
                  
                  <td className="px-3 py-4">
                    <input
                      key={`test-name-${test.id}`}
                      type="text"
                      value={test.test_name}
                      onChange={(e) => updateTest(test.id, { test_name: e.target.value })}
                      className={`w-full px-2 py-1 text-sm font-medium text-slate-900 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        hasTestNameError ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="Enter test name"
                    />
                  </td>
                  
                  <td className="px-3 py-4">
                    <input
                      key={`standard-method-${test.id}`}
                      type="text"
                      value={test.standard_method || ''}
                      onChange={(e) => updateTest(test.id, { standard_method: e.target.value || null })}
                      className="w-full px-2 py-1 text-xs font-mono bg-slate-100 border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Method code"
                    />
                  </td>
                  
                  <td className="px-3 py-4">
                    <div className="relative">
                      <textarea
                        key={`client-requirement-${test.id}`}
                        value={test.client_requirement}
                        onChange={(e) => updateTest(test.id, { client_requirement: e.target.value })}
                        rows={isExpanded ? 4 : 2}
                        className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${
                          hasRequirementError ? 'border-red-300' : 'border-slate-200'
                        }`}
                        placeholder="Enter client requirement"
                      />
                      {shouldTruncate && (
                        <button
                          type="button"
                          onClick={() => toggleRequirementExpansion(test.id)}
                          className="absolute bottom-1 right-1 p-1 text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-3 py-4">
                    <select
                      value={test.category}
                      onChange={(e) => updateTest(test.id, { category: e.target.value as TestRow['category'] })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Raw Material">Raw Material</option>
                      <option value="Work In Progress">Work In Progress</option>
                      <option value="Finished Good">Finished Good</option>
                    </select>
                  </td>
                  
                  <td className="px-3 py-4">
                    <div className="flex rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateTest(test.id, { execution_type: 'inhouse' })}
                        className={`px-2 py-1 text-xs font-medium flex-1 ${
                          test.execution_type === 'inhouse'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        In-House
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTest(test.id, { execution_type: 'outsource' })}
                        className={`px-2 py-1 text-xs font-medium flex-1 ${
                          test.execution_type === 'outsource'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Outsource
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' ? (
                      <div>
                        <select
                          value={test.inhouse_test_id || ''}
                          onChange={(e) => updateTest(test.id, { inhouse_test_id: e.target.value || null })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {INHOUSE_TEST_OPTIONS.map((option) => (
                            <option key={option.id || 'null'} value={option.id || ''}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {test.inhouse_test_id && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mt-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Auto-mapped
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          key={`vendor-name-${test.id}`}
                          type="text"
                          value={test.vendor_name}
                          onChange={(e) => updateTest(test.id, { vendor_name: e.target.value })}
                          className={`w-full px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                            hasVendorError ? 'border-red-300' : 'border-slate-200'
                          }`}
                          placeholder="Vendor name"
                        />
                        <input
                          key={`vendor-email-${test.id}`}
                          type="email"
                          value={test.vendor_email}
                          onChange={(e) => updateTest(test.id, { vendor_email: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Vendor email"
                        />
                        <input
                          key={`expected-date-${test.id}`}
                          type="date"
                          value={test.expected_report_date || ''}
                          onChange={(e) => updateTest(test.id, { expected_report_date: e.target.value || null })}
                          className={`w-full px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                            hasDateError ? 'border-red-300' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    )}
                  </td>
                  
                  {/* Assign Tester Column - only for in-house tests */}
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' ? (
                      <div className="space-y-2">
                        {test.assigned_tester_id ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-green-600" />
                              </div>
                              <div className="text-xs">
                                <div className="font-medium text-slate-900">
                                  {testers.find(t => t.id === test.assigned_tester_id)?.name || 'Unknown'}
                                </div>
                                <div className="text-slate-500">
                                  {testers.find(t => t.id === test.assigned_tester_id)?.department}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateTest(test.id, { assigned_tester_id: null })}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={test.assigned_tester_id || ''}
                            onChange={(e) => updateTest(test.id, { assigned_tester_id: e.target.value || null })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            disabled={loadingTesters}
                          >
                            <option value="">Assign tester (optional)</option>
                            {testers.map((tester) => (
                              <option key={tester.id} value={tester.id}>
                                {tester.name} - {tester.department}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  
                  {/* Deadline Column - only for in-house tests */}
                  <td className="px-3 py-4">
                    {test.execution_type === 'inhouse' ? (
                      <div className="space-y-2">
                        {test.test_deadline ? (
                          <div className="flex items-center justify-between">
                            <div className={`text-xs font-medium ${
                              (() => {
                                const deadline = new Date(test.test_deadline);
                                const today = new Date();
                                const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                if (diffDays <= 3) return 'text-amber-600';
                                return 'text-slate-900';
                              })()
                            }`}>
                              {new Date(test.test_deadline).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => updateTest(test.id, { test_deadline: null })}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="date"
                            value={test.test_deadline || ''}
                            onChange={(e) => updateTest(test.id, { test_deadline: e.target.value || null })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Set deadline"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  
                  <td className="px-3 py-4">
                    <input
                      key={`notes-${test.id}`}
                      type="text"
                      value={test.notes || ''}
                      onChange={(e) => updateTest(test.id, { notes: e.target.value || null })}
                      className="w-full px-2 py-1 text-xs text-slate-400 italic border border-slate-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Notes"
                    />
                  </td>
                  
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => deleteTest(test.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Add Test Button */}
        <div className="border-t">
          <button
            type="button"
            onClick={addNewTest}
            className="w-full px-4 py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test Manually
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              {validationErrors.length} rows have missing required fields
            </span>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between text-slate-900">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        
        <div className="flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={validationErrors.length > 0}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              validationErrors.length > 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={validationErrors.length > 0 ? 'Please fix validation errors first' : ''}
          >
            Confirm & Create Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionReviewTable;
