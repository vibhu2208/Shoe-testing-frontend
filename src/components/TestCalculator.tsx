'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Test } from '@/types/test';

interface TestCalculatorProps {
  test: Test;
  variant?: 'admin' | 'tester';
  clientRequirementText?: string;
  initialInputOverrides?: Record<string, unknown>;
  initialClientSpecsOverrides?: Record<string, unknown>;
  onCalculationResult?: (payload: { calculatedResults: any; passFailResult: string }) => void;
}

const FALLBACK_INPUT_PARAMETERS: Record<
  string,
  Record<string, { type: 'number' | 'boolean' | 'text'; default?: number | boolean | string }>
> = {
  'SATRA-TM-174': {
    reference_rubber_run_1: { type: 'number', default: 0 },
    reference_rubber_run_2: { type: 'number', default: 0 },
    reference_rubber_run_3: { type: 'number', default: 0 },
    sample_initial_weight: { type: 'number', default: 0 },
    sample_final_weight: { type: 'number', default: 0 },
    density: { type: 'number', default: 1.3 },
    client_spec_max_volume: { type: 'number', default: 200 }
  },
  'SATRA-TM-92': {
    required_cycles: { type: 'number', default: 30000 },
    actual_cycles_completed: { type: 'number', default: 0 },
    crack_observed: { type: 'boolean', default: false }
  },
  'SATRA-TM-161': {
    required_cycles: { type: 'number', default: 30000 },
    actual_cycles_completed: { type: 'number', default: 0 },
    upper_crack: { type: 'boolean', default: false },
    sole_crack: { type: 'boolean', default: false },
    sole_separation: { type: 'boolean', default: false },
    stitch_failure: { type: 'boolean', default: false }
  },
  'PH-001': {
    beaker_1_ph: { type: 'number', default: 0 },
    beaker_2_ph: { type: 'number', default: 0 },
    client_spec_min_avg_ph: { type: 'number', default: 6 },
    client_spec_max_difference: { type: 'number', default: 0.5 }
  },
  'ISO-19574': {
    required_duration: { type: 'number', default: 24 },
    actual_duration: { type: 'number', default: 0 },
    fungus_growth_observed: { type: 'boolean', default: false }
  },
  'FZ-001': {
    required_duration: { type: 'number', default: 24 },
    actual_duration: { type: 'number', default: 0 },
    cracking_observed: { type: 'boolean', default: false },
    hardening_observed: { type: 'boolean', default: false },
    material_failure_observed: { type: 'boolean', default: false },
    flexibility_loss_observed: { type: 'boolean', default: false }
  },
  'HAO-001': {
    required_duration: { type: 'number', default: 24 },
    actual_duration: { type: 'number', default: 0 },
    deformation_observed: { type: 'boolean', default: false },
    shrinkage_observed: { type: 'boolean', default: false },
    adhesive_failure_observed: { type: 'boolean', default: false },
    color_change_observed: { type: 'boolean', default: false }
  }
};

export default function TestCalculator({
  test,
  variant = 'admin',
  clientRequirementText,
  initialInputOverrides,
  initialClientSpecsOverrides,
  onCalculationResult
}: TestCalculatorProps) {
  const isTester = variant === 'tester';
  const tc = {
    label: isTester ? 'text-black' : 'text-slate-700',
    input:
      isTester
        ? 'w-full px-3 py-2 border border-black/20 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-700 text-black placeholder:text-black/40'
        : 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400',
    muted: isTester ? 'text-black/70' : 'text-slate-600',
    borderLight: isTester ? 'border-black/10' : 'border-slate-100',
    sectionBg: isTester ? 'bg-green-50/40' : 'bg-slate-50',
    checkbox: isTester
      ? 'rounded border-black/30 text-green-700 focus:ring-green-600'
      : 'rounded border-slate-300 text-green-600 focus:ring-green-500',
    clientReqWrap: isTester
      ? 'rounded-lg border border-green-800/25 bg-green-50/80 p-4'
      : 'rounded-lg border border-slate-200 bg-amber-50/80 p-4',
    heading: isTester ? 'font-medium text-black mb-3' : 'font-medium text-slate-900 mb-3',
    tableHead: isTester ? 'border-b border-black/15' : 'border-b border-slate-200',
    resultsCard: isTester ? 'bg-white border border-black/15 rounded-lg p-4' : 'bg-white border border-slate-200 rounded-lg p-4',
    passBadge: isTester
      ? 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-green-700 text-white'
      : 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-green-100 text-green-800',
    failBadge: isTester
      ? 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-black text-white'
      : 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-red-100 text-red-800',
  };

  const [inputData, setInputData] = useState<any>({});
  const [clientSpecs, setClientSpecs] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const onCalculationResultRef = useRef(onCalculationResult);
  onCalculationResultRef.current = onCalculationResult;
  const effectiveInputParameters =
    test.input_parameters && Object.keys(test.input_parameters).length > 0
      ? test.input_parameters
      : FALLBACK_INPUT_PARAMETERS[test.id] || {};

  // Initialize input data with defaults + optional overrides (from spec sheet extraction)
  useEffect(() => {
    const initialData: any = {};
    const initialSpecs: any = {};

    if (effectiveInputParameters && typeof effectiveInputParameters === 'object') {
      Object.entries(effectiveInputParameters).forEach(([key, param]: [string, any]) => {
        if (param && typeof param === 'object') {
          if (param.default !== null && param.default !== undefined) {
            initialData[key] = param.default;
          }
          
          // Set up client spec fields
          if (key.includes('client_spec')) {
            initialSpecs[key] = param.default || '';
          }
        }
      });
    }

    Object.assign(initialData, initialInputOverrides || {});
    Object.assign(initialSpecs, initialClientSpecsOverrides || {});

    if (test.id === 'SATRA-TM-281' && initialInputOverrides && typeof (initialInputOverrides as any).client_spec_min_bond_strength === 'number') {
      initialSpecs.client_spec_min_bond_strength = (initialInputOverrides as any).client_spec_min_bond_strength;
    }

    if (test.id === 'SATRA-TM-281' && !initialData.point_data) {
      initialData.point_data = Array.from({ length: 16 }, (_, i) => ({
        point_number: i + 1,
        force_applied: 0,
        width: 0
      }));
    }

    setInputData(initialData);
    setClientSpecs(initialSpecs);
  }, [test, initialInputOverrides, initialClientSpecsOverrides, effectiveInputParameters]);

  const calculateResults = useCallback(async (data: any, specs: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/tests/${test.id}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inputData: data,
          clientSpecs: specs
        })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result.calculatedResults);
        onCalculationResultRef.current?.({
          calculatedResults: result.calculatedResults,
          passFailResult: result.passFailResult
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Calculation API error:', errorData);
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  }, [test.id]);

  const handleInputChange = (key: string, value: any) => {
    const newData = { ...inputData, [key]: value };
    setInputData(newData);
  };

  const handleClientSpecChange = (key: string, value: any) => {
    const newSpecs = { ...clientSpecs, [key]: value };
    setClientSpecs(newSpecs);
  };

  const renderInputField = (key: string, param: any) => {
    const isClientSpec = key.includes('client_spec');
    const value = isClientSpec ? clientSpecs[key] || '' : inputData[key] || '';
    
    if (param.type === 'boolean') {
      return (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleInputChange(key, e.target.checked)}
            className={tc.checkbox}
          />
          <span className={`text-sm ${tc.label}`}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </label>
      );
    }

    if (param.type === 'text') {
      return (
        <div>
          <label className={`block text-sm font-medium ${tc.label} mb-1`}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {isClientSpec && <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded border border-green-800/30">Client Spec</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => isClientSpec ? handleClientSpecChange(key, e.target.value) : handleInputChange(key, e.target.value)}
            className={`${tc.input}`}
            rows={2}
          />
        </div>
      );
    }

    return (
      <div>
        <label className={`block text-sm font-medium ${tc.label} mb-1`}>
          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {isClientSpec && <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded border border-green-800/30">Client Spec</span>}
        </label>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => isClientSpec ? handleClientSpecChange(key, parseFloat(e.target.value) || 0) : handleInputChange(key, parseFloat(e.target.value) || 0)}
          className={tc.input}
        />
      </div>
    );
  };

  const renderSpecialCalculators = () => {
    // Special calculator for SATRA-TM-281 (16-point bond strength)
    if (test.id === 'SATRA-TM-281') {
      return (
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${tc.label} mb-1`}>
              Client Spec (Min Bond Strength)
              <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded border border-green-800/30">Client Spec</span>
            </label>
            <input
              type="number"
              step="any"
              value={clientSpecs.client_spec_min_bond_strength || ''}
              onChange={(e) => handleClientSpecChange('client_spec_min_bond_strength', parseFloat(e.target.value) || 0)}
              className={tc.input}
            />
          </div>
          
          <div>
            <h5 className={tc.heading}>16-Point Measurements</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={tc.tableHead}>
                    <th className="text-left py-2">Point</th>
                    <th className="text-left py-2">Force (N)</th>
                    <th className="text-left py-2">Width (mm)</th>
                    <th className="text-left py-2">Bond Strength</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 16 }, (_, i) => {
                    const pointData = inputData.point_data?.[i] || { point_number: i + 1, force_applied: 0, width: 0 };
                    const bondStrength = pointData.width > 0 ? (pointData.force_applied / pointData.width).toFixed(2) : '0.00';
                    const passes = parseFloat(bondStrength) >= (clientSpecs.client_spec_min_bond_strength || 0);
                    
                    return (
                      <tr
                        key={i}
                        className={
                          passes
                            ? 'bg-green-50'
                            : isTester
                              ? 'bg-white border-l-4 border-black'
                              : 'bg-red-50'
                        }
                      >
                        <td className="py-2 font-medium text-black">{i + 1}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            step="any"
                            value={pointData.force_applied || ''}
                            onChange={(e) => {
                              const newPointData = [...(inputData.point_data || Array(16).fill(null).map((_, idx) => ({ point_number: idx + 1, force_applied: 0, width: 0 })))];
                              newPointData[i] = { ...newPointData[i], force_applied: parseFloat(e.target.value) || 0 };
                              handleInputChange('point_data', newPointData);
                            }}
                            className={`w-20 px-2 py-1 border rounded text-sm ${isTester ? 'border-black/25 text-black placeholder:text-black/40' : 'border-slate-300 text-slate-900 placeholder-slate-400'}`}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            step="any"
                            value={pointData.width || ''}
                            onChange={(e) => {
                              const newPointData = [...(inputData.point_data || Array(16).fill(null).map((_, idx) => ({ point_number: idx + 1, force_applied: 0, width: 0 })))];
                              newPointData[i] = { ...newPointData[i], width: parseFloat(e.target.value) || 0 };
                              handleInputChange('point_data', newPointData);
                            }}
                            className={`w-20 px-2 py-1 border rounded text-sm ${isTester ? 'border-black/25 text-black placeholder:text-black/40' : 'border-slate-300 text-slate-900 placeholder-slate-400'}`}
                          />
                        </td>
                        <td className="py-2 font-mono text-black">{bondStrength}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              passes
                                ? 'bg-green-700 text-white'
                                : isTester
                                  ? 'bg-black text-white'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {passes ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Special calculator for SATRA-TM-31 (Material Abrasion)
    if (test.id === 'SATRA-TM-31') {
      const cycleStages = [1600, 3200, 6400, 12800, 25600];
      
      return (
        <div className="space-y-6">
          <div>
            <h5 className={tc.heading}>Dry Conditions</h5>
            <div className="space-y-2">
              {cycleStages.map(stage => {
                const stageData = inputData.dry_stages?.[stage] || { required: false, status: 'OK', damage_type: '', remarks: '' };
                return (
                  <div key={stage} className={`flex items-center space-x-4 p-3 border rounded-lg ${isTester ? 'border-black/15' : 'border-slate-200'}`}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={stageData.required || false}
                        onChange={(e) => {
                          const newDryStages = { ...inputData.dry_stages };
                          newDryStages[stage] = { ...stageData, required: e.target.checked };
                          handleInputChange('dry_stages', newDryStages);
                        }}
                        className={tc.checkbox}
                      />
                      <span className="font-medium text-black">{stage} cycles</span>
                    </label>
                    
                    <select
                      value={stageData.status}
                      onChange={(e) => {
                        const newDryStages = { ...inputData.dry_stages };
                        newDryStages[stage] = { ...stageData, status: e.target.value };
                        handleInputChange('dry_stages', newDryStages);
                      }}
                      className={`px-2 py-1 border rounded text-sm ${isTester ? 'border-black/25 text-black bg-white' : 'border-slate-300'}`}
                      disabled={!stageData.required}
                    >
                      <option value="OK">OK</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Damage type"
                      value={stageData.damage_type}
                      onChange={(e) => {
                        const newDryStages = { ...inputData.dry_stages };
                        newDryStages[stage] = { ...stageData, damage_type: e.target.value };
                        handleInputChange('dry_stages', newDryStages);
                      }}
                      className={`flex-1 px-2 py-1 border rounded text-sm ${isTester ? 'border-black/25 text-black placeholder:text-black/40' : 'border-slate-300 text-slate-900 placeholder-slate-400'}`}
                      disabled={!stageData.required}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h5 className={tc.heading}>Wet Conditions</h5>
            <div className="space-y-2">
              {cycleStages.map(stage => {
                const stageData = inputData.wet_stages?.[stage] || { required: false, status: 'OK', damage_type: '', remarks: '' };
                return (
                  <div key={stage} className={`flex items-center space-x-4 p-3 border rounded-lg ${isTester ? 'border-black/15' : 'border-slate-200'}`}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={stageData.required || false}
                        onChange={(e) => {
                          const newWetStages = { ...inputData.wet_stages };
                          newWetStages[stage] = { ...stageData, required: e.target.checked };
                          handleInputChange('wet_stages', newWetStages);
                        }}
                        className={tc.checkbox}
                      />
                      <span className="font-medium text-black">{stage} cycles</span>
                    </label>
                    
                    <select
                      value={stageData.status}
                      onChange={(e) => {
                        const newWetStages = { ...inputData.wet_stages };
                        newWetStages[stage] = { ...stageData, status: e.target.value };
                        handleInputChange('wet_stages', newWetStages);
                      }}
                      className={`px-2 py-1 border rounded text-sm ${isTester ? 'border-black/25 text-black bg-white' : 'border-slate-300'}`}
                      disabled={!stageData.required}
                    >
                      <option value="OK">OK</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Damage type"
                      value={stageData.damage_type}
                      onChange={(e) => {
                        const newWetStages = { ...inputData.wet_stages };
                        newWetStages[stage] = { ...stageData, damage_type: e.target.value };
                        handleInputChange('wet_stages', newWetStages);
                      }}
                      className={`flex-1 px-2 py-1 border rounded text-sm ${isTester ? 'border-black/25 text-black placeholder:text-black/40' : 'border-slate-300 text-slate-900 placeholder-slate-400'}`}
                      disabled={!stageData.required}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Default form for other tests
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(effectiveInputParameters).map(([key, param]: [string, any]) => (
          <div key={key}>
            {renderInputField(key, param)}
          </div>
        ))}
        {Object.keys(effectiveInputParameters).length === 0 && (
          <div className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Input parameters are not configured for this test in the library. Ask admin to update the test definition.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {clientRequirementText && (
        <div className={tc.clientReqWrap}>
          <h5 className={isTester ? 'text-sm font-semibold text-black mb-1' : 'text-sm font-semibold text-slate-900 mb-1'}>Client requirement (from order)</h5>
          <p className={isTester ? 'text-sm text-black whitespace-pre-wrap' : 'text-sm text-slate-800 whitespace-pre-wrap'}>{clientRequirementText}</p>
        </div>
      )}

      {/* Input Form */}
      <div className={`${tc.sectionBg} rounded-lg p-4 border ${isTester ? 'border-black/10' : 'border-transparent'}`}>
        <h5 className={isTester ? 'font-medium text-black mb-4' : 'font-medium text-slate-900 mb-4'}>Input Parameters</h5>
        {renderSpecialCalculators()}
        
        {/* Calculation runs only when the user submits (not on every input change). */}
        <div className={`mt-4 pt-4 border-t ${isTester ? 'border-black/10' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={() => calculateResults(inputData, clientSpecs)}
            disabled={loading}
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Submit'}
          </button>
          
          {variant === 'admin' && (
            <div className="mt-2 text-xs text-slate-500">
              <details>
                <summary>Debug Info (click to expand)</summary>
                <div className="mt-2 p-2 bg-slate-100 rounded text-xs">
                  <div><strong>Input Data:</strong> {JSON.stringify(inputData, null, 2)}</div>
                  <div className="mt-1"><strong>Client Specs:</strong> {JSON.stringify(clientSpecs, null, 2)}</div>
                  <div className="mt-1"><strong>Results:</strong> {results ? JSON.stringify(results, null, 2) : 'No results yet'}</div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className={tc.resultsCard}>
          <h5 className={isTester ? 'font-medium text-black mb-4' : 'font-medium text-slate-900 mb-4'}>Calculation Results</h5>
          
          {/* Pass/Fail Badge */}
          <div className="mb-4">
            <span
              className={
                results.result === 'PASS' ? tc.passBadge : tc.failBadge
              }
            >
              {results.result}
            </span>
          </div>

          {/* Detailed Results */}
          <div className="space-y-3">
            {Object.entries(results).map(([key, value]: [string, any]) => {
              if (key === 'result') return null;
              
              return (
                <div key={key} className={`flex justify-between items-center py-2 border-b ${tc.borderLight}`}>
                  <span className={`text-sm font-medium ${tc.label}`}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`text-sm font-mono ${isTester ? 'text-black' : 'text-slate-900'}`}>
                    {typeof value === 'object' ? JSON.stringify(value) : value?.toString()}
                  </span>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className={tc.muted}>Calculating...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
