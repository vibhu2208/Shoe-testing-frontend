'use client';

import { useState, useEffect } from 'react';
import { Test } from '@/types/test';

interface TestCalculatorProps {
  test: Test;
}

export default function TestCalculator({ test }: TestCalculatorProps) {
  const [inputData, setInputData] = useState<any>({});
  const [clientSpecs, setClientSpecs] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize input data with defaults
  useEffect(() => {
    const initialData: any = {};
    const initialSpecs: any = {};

    if (test.input_parameters && typeof test.input_parameters === 'object') {
      Object.entries(test.input_parameters).forEach(([key, param]: [string, any]) => {
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

    setInputData(initialData);
    setClientSpecs(initialSpecs);
  }, [test]);

  const handleInputChange = (key: string, value: any) => {
    const newData = { ...inputData, [key]: value };
    setInputData(newData);
    
    // Only auto-calculate if we have meaningful data
    const hasRequiredData = Object.values(newData).some(val => val !== null && val !== undefined && val !== '');
    if (hasRequiredData && Object.keys(clientSpecs).length > 0) {
      calculateResults(newData, clientSpecs);
    }
  };

  const handleClientSpecChange = (key: string, value: any) => {
    const newSpecs = { ...clientSpecs, [key]: value };
    setClientSpecs(newSpecs);
    
    // Auto-calculate with new specs
    if (Object.keys(inputData).length > 0) {
      calculateResults(inputData, newSpecs);
    }
  };

  const calculateResults = async (data: any, specs: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Sending calculation request:', { testId: test.id, inputData: data, clientSpecs: specs });

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
        console.log('Calculation response:', result);
        setResults(result.calculatedResults);
      } else {
        const errorData = await response.json();
        console.error('Calculation API error:', errorData);
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
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
            className="rounded border-slate-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-slate-700">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </label>
      );
    }

    if (param.type === 'text') {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {isClientSpec && <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded">Client Spec</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => isClientSpec ? handleClientSpecChange(key, e.target.value) : handleInputChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
            rows={2}
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {isClientSpec && <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded">Client Spec</span>}
        </label>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => isClientSpec ? handleClientSpecChange(key, parseFloat(e.target.value) || 0) : handleInputChange(key, parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client Spec (Min Bond Strength)
              <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded">Client Spec</span>
            </label>
            <input
              type="number"
              step="any"
              value={clientSpecs.client_spec_min_bond_strength || ''}
              onChange={(e) => handleClientSpecChange('client_spec_min_bond_strength', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
            />
          </div>
          
          <div>
            <h5 className="font-medium text-slate-900 mb-3">16-Point Measurements</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
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
                      <tr key={i} className={passes ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="py-2 font-medium">{i + 1}</td>
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
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400"
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
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400"
                          />
                        </td>
                        <td className="py-2 font-mono">{bondStrength}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded ${passes ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
            <h5 className="font-medium text-slate-900 mb-3">Dry Conditions</h5>
            <div className="space-y-2">
              {cycleStages.map(stage => {
                const stageData = inputData.dry_stages?.[stage] || { required: false, status: 'OK', damage_type: '', remarks: '' };
                return (
                  <div key={stage} className="flex items-center space-x-4 p-3 border border-slate-200 rounded-lg">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={stageData.required || false}
                        onChange={(e) => {
                          const newDryStages = { ...inputData.dry_stages };
                          newDryStages[stage] = { ...stageData, required: e.target.checked };
                          handleInputChange('dry_stages', newDryStages);
                        }}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="font-medium">{stage} cycles</span>
                    </label>
                    
                    <select
                      value={stageData.status}
                      onChange={(e) => {
                        const newDryStages = { ...inputData.dry_stages };
                        newDryStages[stage] = { ...stageData, status: e.target.value };
                        handleInputChange('dry_stages', newDryStages);
                      }}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
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
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400"
                      disabled={!stageData.required}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h5 className="font-medium text-slate-900 mb-3">Wet Conditions</h5>
            <div className="space-y-2">
              {cycleStages.map(stage => {
                const stageData = inputData.wet_stages?.[stage] || { required: false, status: 'OK', damage_type: '', remarks: '' };
                return (
                  <div key={stage} className="flex items-center space-x-4 p-3 border border-slate-200 rounded-lg">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={stageData.required || false}
                        onChange={(e) => {
                          const newWetStages = { ...inputData.wet_stages };
                          newWetStages[stage] = { ...stageData, required: e.target.checked };
                          handleInputChange('wet_stages', newWetStages);
                        }}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="font-medium">{stage} cycles</span>
                    </label>
                    
                    <select
                      value={stageData.status}
                      onChange={(e) => {
                        const newWetStages = { ...inputData.wet_stages };
                        newWetStages[stage] = { ...stageData, status: e.target.value };
                        handleInputChange('wet_stages', newWetStages);
                      }}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
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
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400"
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
        {Object.entries(test.input_parameters).map(([key, param]: [string, any]) => (
          <div key={key}>
            {renderInputField(key, param)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h5 className="font-medium text-slate-900 mb-4">Input Parameters</h5>
        {renderSpecialCalculators()}
        
        {/* Manual Calculate Button */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={() => calculateResults(inputData, clientSpecs)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Results'}
          </button>
          
          {/* Debug Info */}
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
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h5 className="font-medium text-slate-900 mb-4">Calculation Results</h5>
          
          {/* Pass/Fail Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold ${
              results.result === 'PASS' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {results.result}
            </span>
          </div>

          {/* Detailed Results */}
          <div className="space-y-3">
            {Object.entries(results).map(([key, value]: [string, any]) => {
              if (key === 'result') return null;
              
              return (
                <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-sm text-slate-900 font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : value?.toString()}
                  </span>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="text-slate-600">Calculating...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
