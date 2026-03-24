'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import TestCalculator from '@/components/TestCalculator';
import { Test } from '@/types/test';

interface TestDrawerProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onCategoryChange: (testId: string, newCategory: string) => void;
}

export default function TestDrawer({ test, isOpen, onClose, onCategoryChange }: TestDrawerProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!test) return null;

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Finished Good':
        return 'bg-green-600 text-white';
      case 'WIP':
        return 'border border-green-600 text-green-600 bg-white';
      case 'Raw Material':
        return 'bg-slate-600 text-white';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    onCategoryChange(test.id, newCategory);
    setShowCategoryDropdown(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-white/30 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-[600px] bg-white shadow-xl transform transition-transform z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-slate-900">{test.id}</h2>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded">
                  {test.standard}
                </span>
              </div>
              <h3 className="text-lg text-slate-700 mb-2">{test.name}</h3>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded ${getCategoryBadgeStyle(test.category)}`}
                  >
                    {test.category}
                    <ChevronDown className="ml-1 w-4 h-4" />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        {['Raw Material', 'WIP', 'Finished Good'].map((category) => (
                          <button
                            key={category}
                            onClick={() => handleCategoryChange(category)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Section 1 - Test Overview */}
              <section>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Test Overview</h4>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Test ID</dt>
                    <dd className="text-sm text-slate-900">{test.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Full Name</dt>
                    <dd className="text-sm text-slate-900">{test.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Standard</dt>
                    <dd className="text-sm text-slate-900">{test.standard}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Category</dt>
                    <dd className="text-sm text-slate-900">{test.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Description</dt>
                    <dd className="text-sm text-slate-900">{test.description}</dd>
                  </div>
                </dl>
              </section>

              {/* Section 2 - Input Parameters */}
              <section>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Input Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 font-medium text-slate-700">Parameter Name</th>
                        <th className="text-left py-2 font-medium text-slate-700">Type</th>
                        <th className="text-left py-2 font-medium text-slate-700">Default Value</th>
                        <th className="text-left py-2 font-medium text-slate-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(test.input_parameters).map(([key, param]: [string, any], index) => (
                        <tr key={key} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="py-2 text-slate-900">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                          <td className="py-2 text-slate-600">{param.type}</td>
                          <td className="py-2 text-slate-600">{param.default !== null ? param.default.toString() : '—'}</td>
                          <td className="py-2 text-slate-600">{param.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 3 - Calculations */}
              <section>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Calculation Logic</h4>
                <div className="space-y-4">
                  {test.calculation_steps.map((step: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="bg-slate-100 rounded p-3">
                        <div className="text-sm font-medium text-slate-700 mb-1">Step {step.step}</div>
                        <code className="text-sm font-mono text-green-700">{step.formula}</code>
                      </div>
                      <p className="text-sm text-slate-600">{step.description}</p>
                      
                      {/* Example for first step of SATRA-TM-174 */}
                      {test.id === 'SATRA-TM-174' && step.step === 1 && (
                        <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded-r">
                          <div className="text-sm font-medium text-green-800 mb-1">Example:</div>
                          <code className="text-sm font-mono text-green-700">(189 + 188 + 189) / 3 = 188.67 gm</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 - Pass/Fail Logic */}
              <section>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Pass / Fail Conditions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <h5 className="font-medium text-green-800 mb-2">PASS Conditions</h5>
                    <p className="text-sm text-green-700">{test.pass_fail_logic.pass_condition}</p>
                  </div>
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <h5 className="font-medium text-red-800 mb-2">FAIL Conditions</h5>
                    <p className="text-sm text-red-700">{test.pass_fail_logic.fail_condition}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 italic mt-4">
                  Pass/fail thresholds are client-specified per order. Values shown are system defaults for reference only.
                </p>
                {test.pass_fail_logic.notes && (
                  <p className="text-sm text-slate-600 mt-2">{test.pass_fail_logic.notes}</p>
                )}
              </section>

              {/* Section 5 - Live Reference Calculator */}
              <section>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Reference Calculator</h4>
                <p className="text-sm text-slate-600 mb-4">
                  For admin reference only. Actual results are determined by client specification set at order level.
                </p>
                <TestCalculator test={test} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
