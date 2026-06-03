'use client';

import { publicApiUrl } from '@/lib/apiBase';
import {
  createEmptyMaterialAbrasionStages,
  MATERIAL_ABRASION_CYCLE_STAGES
} from '@/lib/materialAbrasion';
import { getCalculatorInputParameters } from '@/lib/testLibraryMetadata';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Test } from '@/types/test';

interface TestCalculatorProps {
  test: Test;
  variant?: 'admin' | 'tester';
  clientRequirementText?: string;
  /** When true, client requirement block is omitted (e.g. shown in page sidebar). */
  hideClientRequirement?: boolean;
  initialInputOverrides?: Record<string, unknown>;
  initialClientSpecsOverrides?: Record<string, unknown>;
  onCalculationResult?: (payload: {
    calculatedResults: any;
    passFailResult: string;
    inputSnapshot?: Record<string, unknown>;
  }) => void;
}

export default function TestCalculator({
  test,
  variant = 'admin',
  clientRequirementText,
  hideClientRequirement = false,
  initialInputOverrides,
  initialClientSpecsOverrides,
  onCalculationResult
}: TestCalculatorProps) {
  const isTester = variant === 'tester';
  const tc = {
    label: isTester ? 'text-[#111111]' : 'text-slate-700',
    input:
      isTester
        ? 'w-full px-3 py-3 text-base border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] text-[#111111] placeholder:text-[#111111]/40'
        : 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400',
    muted: isTester ? 'text-[#111111]/70' : 'text-slate-600',
    borderLight: isTester ? 'border-[#E0E0E0]' : 'border-slate-100',
    sectionBg: isTester ? 'bg-white' : 'bg-slate-50',
    sectionCard: isTester
      ? 'rounded-xl border border-[#E0E0E0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      : 'rounded-lg p-4 border border-transparent bg-slate-50',
    checkbox: isTester
      ? 'h-5 w-5 rounded border-[#2E7D32] text-[#2E7D32] focus:ring-[#2E7D32]'
      : 'rounded border-slate-300 text-green-600 focus:ring-green-500',
    checkboxRow: isTester
      ? 'flex min-h-[52px] items-center gap-3 rounded-lg border border-[#C8E6C9] bg-white px-4 py-3 transition-colors hover:bg-[#E8F5E9]/50'
      : '',
    clientReqWrap: isTester
      ? 'rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] p-4'
      : 'rounded-lg border border-slate-200 bg-amber-50/80 p-4',
    heading: isTester
      ? 'text-xs font-semibold uppercase tracking-wide text-[#111111]/50 mb-3'
      : 'font-medium text-slate-900 mb-3',
    sectionTitle: isTester
      ? 'text-sm font-semibold text-[#111111] mb-3'
      : 'font-medium text-slate-900 mb-4',
    tableHead: isTester ? 'border-b border-[#C8E6C9]' : 'border-b border-slate-200',
    resultsCard: isTester
      ? 'rounded-xl border border-[#E0E0E0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      : 'bg-white border border-slate-200 rounded-lg p-4',
    passBadge: isTester
      ? 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-[#2E7D32] text-white'
      : 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-green-100 text-green-800',
    failBadge: isTester
      ? 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-[#111111] text-white'
      : 'inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-red-100 text-red-800',
  };

  const [inputData, setInputData] = useState<any>({});
  const [clientSpecs, setClientSpecs] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onCalculationResultRef = useRef(onCalculationResult);
  onCalculationResultRef.current = onCalculationResult;
  const effectiveInputParameters = useMemo(
    () => getCalculatorInputParameters(test),
    [test.id]
  );
  const inputOverridesKey = JSON.stringify(initialInputOverrides ?? {});
  const clientSpecsOverridesKey = JSON.stringify(initialClientSpecsOverrides ?? {});

  // Initialize input data with defaults + optional overrides (from spec sheet extraction)
  useEffect(() => {
    const params = getCalculatorInputParameters(test);
    const initialData: any = {};
    const initialSpecs: any = {};

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, param]: [string, any]) => {
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

    if (test.id === 'SATRA-TM-31' && !initialData.dry_stages && !initialData.wet_stages) {
      Object.assign(initialData, createEmptyMaterialAbrasionStages());
    }

    setInputData(initialData);
    setCalculationError(null);
    setClientSpecs(initialSpecs);
    // Only re-init when test identity or explicit overrides change (not on every parent render)
  }, [test.id, inputOverridesKey, clientSpecsOverridesKey]);

  const calculateResults = useCallback(async (data: any, specs: any) => {
    try {
      setLoading(true);
      setCalculationError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(publicApiUrl(`/api/tests/${test.id}/calculate`), {
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
        setCalculationError(null);
        onCalculationResultRef.current?.({
          calculatedResults: result.calculatedResults,
          passFailResult: result.passFailResult,
          inputSnapshot: { ...data, ...specs }
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || 'Calculation failed';
        setCalculationError(message);
        setResults(null);
        console.error('Calculation API error:', errorData);
      }
    } catch (error) {
      setCalculationError('Calculation failed. Check your connection and try again.');
      setResults(null);
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
      const labelText = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      if (isTester) {
        return (
          <label className={tc.checkboxRow}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className={tc.checkbox}
            />
            <span className={`text-sm font-medium ${tc.label}`}>{labelText}</span>
          </label>
        );
      }
      return (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleInputChange(key, e.target.checked)}
            className={tc.checkbox}
          />
          <span className={`text-sm ${tc.label}`}>{labelText}</span>
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
                    <th className="text-left py-2">Force (kg)</th>
                    <th className="text-left py-2">Width (mm)</th>
                    <th className="text-left py-2">Bond Strength</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 16 }, (_, i) => {
                    const pointData = inputData.point_data?.[i] || { point_number: i + 1, force_applied: 0, width: 0 };
                    const bondStrength = pointData.width > 0 ? (pointData.force_applied * 9.8 / pointData.width).toFixed(2) : '0.00';
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
      const cycleStages = MATERIAL_ABRASION_CYCLE_STAGES;
      
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
                          const newDryStages = { ...(inputData.dry_stages || createEmptyMaterialAbrasionStages().dry_stages) };
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
                        const newDryStages = { ...(inputData.dry_stages || createEmptyMaterialAbrasionStages().dry_stages) };
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
                        const newDryStages = { ...(inputData.dry_stages || createEmptyMaterialAbrasionStages().dry_stages) };
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
                          const newWetStages = { ...(inputData.wet_stages || createEmptyMaterialAbrasionStages().wet_stages) };
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
                        const newWetStages = { ...(inputData.wet_stages || createEmptyMaterialAbrasionStages().wet_stages) };
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
                        const newWetStages = { ...(inputData.wet_stages || createEmptyMaterialAbrasionStages().wet_stages) };
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

    // Special calculator for PH-001 (pH value — two readings per beaker)
    if (test.id === 'PH-001') {
      const beaker1Stats = (() => {
        const a = inputData.beaker_1_ph_1;
        const b = inputData.beaker_1_ph_2;
        if (a === '' || a == null || b === '' || b == null) return null;
        const n1 = Number(a);
        const n2 = Number(b);
        if (Number.isNaN(n1) || Number.isNaN(n2)) return null;
        return {
          average: Math.round(((n1 + n2) / 2) * 100) / 100,
          difference: Math.round(Math.abs(n1 - n2) * 100) / 100
        };
      })();
      const beaker2Stats = (() => {
        const a = inputData.beaker_2_ph_1;
        const b = inputData.beaker_2_ph_2;
        if (a === '' || a == null || b === '' || b == null) return null;
        const n1 = Number(a);
        const n2 = Number(b);
        if (Number.isNaN(n1) || Number.isNaN(n2)) return null;
        return {
          average: Math.round(((n1 + n2) / 2) * 100) / 100,
          difference: Math.round(Math.abs(n1 - n2) * 100) / 100
        };
      })();
      const minAvg = Number(clientSpecs.client_spec_min_avg_ph ?? inputData.client_spec_min_avg_ph ?? 0);
      const maxDiff = Number(clientSpecs.client_spec_max_difference ?? inputData.client_spec_max_difference ?? 0);

      const renderBeakerSection = (
        beakerLabel: string,
        key1: string,
        key2: string,
        stats: { average: number; difference: number } | null
      ) => {
        const avgPasses = stats ? stats.average >= minAvg : null;
        const diffPasses = stats ? stats.difference <= maxDiff : null;
        return (
          <div className={`rounded-lg border p-4 ${isTester ? 'border-black/15 bg-white' : 'border-slate-200 bg-white'}`}>
            <h6 className="font-medium text-black mb-3">{beakerLabel}</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${tc.label} mb-1`}>Reading 1</label>
                <input
                  type="number"
                  step="any"
                  value={inputData[key1] || ''}
                  onChange={(e) => handleInputChange(key1, parseFloat(e.target.value) || 0)}
                  className={tc.input}
                  placeholder="e.g., 7.2"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${tc.label} mb-1`}>Reading 2</label>
                <input
                  type="number"
                  step="any"
                  value={inputData[key2] || ''}
                  onChange={(e) => handleInputChange(key2, parseFloat(e.target.value) || 0)}
                  className={tc.input}
                  placeholder="e.g., 7.3"
                />
              </div>
            </div>
            {stats && (
              <div className={`mt-3 grid grid-cols-2 gap-3 text-sm ${tc.muted}`}>
                <div className="rounded-md border border-black/10 px-3 py-2">
                  <span className="block text-xs uppercase tracking-wide">Beaker average</span>
                  <span className="font-mono text-base text-black">{stats.average.toFixed(2)}</span>
                  {avgPasses != null && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${avgPasses ? 'bg-green-700 text-white' : 'bg-black text-white'}`}>
                      {avgPasses ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <div className="rounded-md border border-black/10 px-3 py-2">
                  <span className="block text-xs uppercase tracking-wide">Reading difference</span>
                  <span className="font-mono text-base text-black">{stats.difference.toFixed(2)}</span>
                  {diffPasses != null && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${diffPasses ? 'bg-green-700 text-white' : 'bg-black text-white'}`}>
                      {diffPasses ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      };

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tc.label} mb-1`}>
                Min Average pH (per beaker)
                <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded border border-green-800/30">Client Spec</span>
              </label>
              <input
                type="number"
                step="any"
                value={clientSpecs.client_spec_min_avg_ph ?? inputData.client_spec_min_avg_ph ?? ''}
                onChange={(e) => handleClientSpecChange('client_spec_min_avg_ph', parseFloat(e.target.value) || 0)}
                className={tc.input}
                placeholder="e.g., 6.0"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${tc.label} mb-1`}>
                Max Reading Difference (per beaker)
                <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded border border-green-800/30">Client Spec</span>
              </label>
              <input
                type="number"
                step="any"
                value={clientSpecs.client_spec_max_difference ?? inputData.client_spec_max_difference ?? ''}
                onChange={(e) => handleClientSpecChange('client_spec_max_difference', parseFloat(e.target.value) || 0)}
                className={tc.input}
                placeholder="e.g., 0.5"
              />
            </div>
          </div>

          {renderBeakerSection('Beaker 1', 'beaker_1_ph_1', 'beaker_1_ph_2', beaker1Stats)}
          {renderBeakerSection('Beaker 2', 'beaker_2_ph_1', 'beaker_2_ph_2', beaker2Stats)}
        </div>
      );
    }

    // Default form for other tests
    return (
      <div className={`grid grid-cols-1 gap-3 ${isTester ? '' : 'md:grid-cols-2 md:gap-4'}`}>
        {Object.entries(effectiveInputParameters).map(([key, param]: [string, any]) => (
          <div
            key={key}
            className={isTester && param?.type === 'boolean' ? 'col-span-1' : isTester ? '' : ''}
          >
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
    <div className={isTester ? 'space-y-4' : 'space-y-6'}>
      {clientRequirementText && !hideClientRequirement && (
        <div className={tc.clientReqWrap}>
          <h5 className={isTester ? 'text-xs font-bold uppercase tracking-wide text-[#1B5E20] mb-1' : 'text-sm font-semibold text-slate-900 mb-1'}>Client requirement (from order)</h5>
          <p className={isTester ? 'text-sm text-[#111111] whitespace-pre-wrap' : 'text-sm text-slate-800 whitespace-pre-wrap'}>{clientRequirementText}</p>
        </div>
      )}

      {/* Input Form */}
      <div className={isTester ? tc.sectionCard : `${tc.sectionBg} rounded-lg p-4 border border-transparent`}>
        <h5 className={isTester ? tc.sectionTitle : 'font-medium text-slate-900 mb-4'}>
          {isTester ? 'Test Parameters & Measurements' : 'Input Parameters'}
        </h5>
        {renderSpecialCalculators()}
        
        {/* Calculation runs only when the user submits (not on every input change). */}
        <div className={`mt-4 pt-4 border-t ${isTester ? 'border-[#E0E0E0]' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={() => calculateResults(inputData, clientSpecs)}
            disabled={loading}
            className={
              isTester
                ? 'rounded-lg bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:cursor-not-allowed disabled:opacity-50'
                : 'px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          >
            {loading ? 'Calculating...' : isTester ? 'Calculate Result' : 'Submit'}
          </button>

          {calculationError && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              {calculationError}
            </p>
          )}
          
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
          <h5 className={isTester ? 'text-sm font-semibold text-[#111111] mb-4' : 'font-medium text-slate-900 mb-4'}>
            {isTester ? 'Result Entry' : 'Calculation Results'}
          </h5>
          
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
