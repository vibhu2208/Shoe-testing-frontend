'use client';

import { publicApiUrl } from '@/lib/apiBase';
import { useState, useEffect } from 'react';
import { Calculator, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface TesterReferenceCalculatorProps {
  testStandard: string;
  clientRequirement: string;
  onCalculationComplete?: (result: any) => void;
}

export default function TesterReferenceCalculator({ 
  testStandard, 
  clientRequirement, 
  onCalculationComplete 
}: TesterReferenceCalculatorProps) {
  const [testDetails, setTestDetails] = useState<any>(null);
  const [inputData, setInputData] = useState<any>({});
  const [clientSpecs, setClientSpecs] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(true);

  // Fetch test details from the test library
  useEffect(() => {
    fetchTestDetails();
  }, [testStandard]);

  // Parse client requirements to extract specs
  useEffect(() => {
    if (clientRequirement) {
      parseClientRequirements();
    }
  }, [clientRequirement]);

  const fetchTestDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl(`/api/tests/${testStandard}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const test = await response.json();
        setTestDetails(test);
        initializeInputData(test);
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const parseClientRequirements = () => {
    // Parse common client requirement patterns
    const specs: any = {};
    const requirement = clientRequirement.toLowerCase();

    // Common patterns for different test types
    if (requirement.includes('bond strength')) {
      const match = requirement.match(/(\d+(?:\.\d+)?)\s*n\/mm/);
      if (match) {
        specs.client_spec_min_bond_strength = parseFloat(match[1]);
      }
    }

    if (requirement.includes('volume loss') || requirement.includes('abrasion')) {
      const match = requirement.match(/(\d+(?:\.\d+)?)\s*mm³/);
      if (match) {
        specs.client_spec_max_volume = parseFloat(match[1]);
      }
    }

    if (requirement.includes('ph') || requirement.includes('ph value')) {
      const phMatch = requirement.match(/ph\s*(?:≥|>=|minimum|min)\s*(\d+(?:\.\d+)?)/);
      if (phMatch) {
        specs.client_spec_min_avg_ph = parseFloat(phMatch[1]);
      }
      
      const diffMatch = requirement.match(/difference\s*(?:≤|<=|maximum|max)\s*(\d+(?:\.\d+)?)/);
      if (diffMatch) {
        specs.client_spec_max_difference = parseFloat(diffMatch[1]);
      }
    }

    if (requirement.includes('cycles')) {
      const match = requirement.match(/(\d+(?:,\d{3})*)\s*cycles/);
      if (match) {
        specs.required_cycles = parseInt(match[1].replace(/,/g, ''));
      }
    }

    setClientSpecs(specs);
  };

  const initializeInputData = (test: any) => {
    const initialData: any = {};
    
    if (test.input_parameters && typeof test.input_parameters === 'object') {
      Object.entries(test.input_parameters).forEach(([key, param]: [string, any]) => {
        if (param && typeof param === 'object') {
          if (param.default !== null && param.default !== undefined) {
            initialData[key] = param.default;
          }
        }
      });
    }

    // Initialize special test structures
    if (test.id === 'SATRA-TM-281') {
      initialData.point_data = Array(16).fill(null).map((_, i) => ({
        point_number: i + 1,
        force_applied: 0,
        width: 0
      }));
    }

    if (test.id === 'SATRA-TM-31') {
      const cycleStages = [1600, 3200, 6400, 12800, 25600];
      initialData.dry_stages = {};
      initialData.wet_stages = {};
      
      cycleStages.forEach(stage => {
        initialData.dry_stages[stage] = { required: false, status: 'OK', damage_type: '', remarks: '' };
        initialData.wet_stages[stage] = { required: false, status: 'OK', damage_type: '', remarks: '' };
      });
    }

    setInputData(initialData);
  };

  const handleInputChange = (key: string, value: any) => {
    const newData = { ...inputData, [key]: value };
    setInputData(newData);
  };

  const handleClientSpecChange = (key: string, value: any) => {
    const newSpecs = { ...clientSpecs, [key]: value };
    setClientSpecs(newSpecs);
  };

  const calculateResults = async () => {
    if (!testDetails) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(publicApiUrl(`/api/tests/${testDetails.id}/calculate`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inputData: { ...inputData, ...clientSpecs },
          clientSpecs
        })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result.calculatedResults);
        
        if (onCalculationComplete) {
          onCalculationComplete(result);
        }
      } else {
        const errorData = await response.json();
        console.error('Calculation error:', errorData);
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
            {isClientSpec && <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => isClientSpec ? handleClientSpecChange(key, e.target.value) : handleInputChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
            rows={2}
            placeholder={param.description || `Enter ${key.replace(/_/g, ' ')}`}
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {isClientSpec && <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>}
          {param.unit && <span className="text-slate-500 ml-1">({param.unit})</span>}
        </label>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => isClientSpec ? handleClientSpecChange(key, parseFloat(e.target.value) || 0) : handleInputChange(key, parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
          placeholder={param.description || `Enter ${key.replace(/_/g, ' ')}`}
        />
        {param.description && (
          <p className="text-xs text-slate-500 mt-1">{param.description}</p>
        )}
      </div>
    );
  };

  const renderSpecialCalculators = () => {
    if (!testDetails) return null;

    // Special calculator for SATRA-TM-281 (16-point bond strength)
    if (testDetails.id === 'SATRA-TM-281') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Client Specification</h4>
            </div>
            <p className="text-sm text-blue-800 mb-3">{clientRequirement}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Bond Strength Required
                <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>
              </label>
              <input
                type="number"
                step="any"
                value={clientSpecs.client_spec_min_bond_strength || ''}
                onChange={(e) => handleClientSpecChange('client_spec_min_bond_strength', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                placeholder="Enter minimum bond strength (N/mm)"
              />
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-slate-900 mb-3">16-Point Bond Strength Measurements</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Point</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Force (N)</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Width (mm)</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Bond Strength</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 16 }, (_, i) => {
                    const pointData = inputData.point_data?.[i] || { point_number: i + 1, force_applied: 0, width: 0 };
                    const bondStrength = pointData.width > 0 ? (pointData.force_applied / pointData.width).toFixed(2) : '0.00';
                    const passes = parseFloat(bondStrength) >= (clientSpecs.client_spec_min_bond_strength || 0);
                    
                    return (
                      <tr key={i} className={`border-t border-slate-200 ${passes ? 'bg-green-50' : pointData.force_applied > 0 && pointData.width > 0 ? 'bg-red-50' : ''}`}>
                        <td className="py-3 px-4 font-medium">{i + 1}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="any"
                            value={pointData.force_applied || ''}
                            onChange={(e) => {
                              const newPointData = [...(inputData.point_data || Array(16).fill(null).map((_, idx) => ({ point_number: idx + 1, force_applied: 0, width: 0 })))];
                              newPointData[i] = { ...newPointData[i], force_applied: parseFloat(e.target.value) || 0 };
                              handleInputChange('point_data', newPointData);
                            }}
                            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="any"
                            value={pointData.width || ''}
                            onChange={(e) => {
                              const newPointData = [...(inputData.point_data || Array(16).fill(null).map((_, idx) => ({ point_number: idx + 1, force_applied: 0, width: 0 })))];
                              newPointData[i] = { ...newPointData[i], width: parseFloat(e.target.value) || 0 };
                              handleInputChange('point_data', newPointData);
                            }}
                            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-900">{bondStrength} N/mm</td>
                        <td className="py-3 px-4">
                          {pointData.force_applied > 0 && pointData.width > 0 && (
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                              passes ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {passes ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  PASS
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  FAIL
                                </>
                              )}
                            </span>
                          )}
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
    if (testDetails.id === 'SATRA-TM-31') {
      const cycleStages = [1600, 3200, 6400, 12800, 25600];
      
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Client Specification</h4>
            </div>
            <p className="text-sm text-blue-800">{clientRequirement}</p>
          </div>

          <div>
            <h5 className="font-medium text-slate-900 mb-3">Dry Conditions Testing</h5>
            <div className="space-y-3">
              {cycleStages.map(stage => {
                const stageData = inputData.dry_stages?.[stage] || { required: false, status: 'OK', damage_type: '', remarks: '' };
                return (
                  <div key={stage} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <label className="flex items-center space-x-2 min-w-[120px]">
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
                      <span className="font-medium text-slate-700">{stage.toLocaleString()} cycles</span>
                    </label>
                    
                    <select
                      value={stageData.status}
                      onChange={(e) => {
                        const newDryStages = { ...inputData.dry_stages };
                        newDryStages[stage] = { ...stageData, status: e.target.value };
                        handleInputChange('dry_stages', newDryStages);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[80px]"
                      disabled={!stageData.required}
                    >
                      <option value="OK">OK</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Damage type (if any)"
                      value={stageData.damage_type}
                      onChange={(e) => {
                        const newDryStages = { ...inputData.dry_stages };
                        newDryStages[stage] = { ...stageData, damage_type: e.target.value };
                        handleInputChange('dry_stages', newDryStages);
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                      disabled={!stageData.required}
                    />

                    {stageData.required && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        stageData.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stageData.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h5 className="font-medium text-slate-900 mb-3">Wet Conditions Testing</h5>
            <div className="space-y-3">
              {cycleStages.map(stage => {
                const stageData = inputData.wet_stages?.[stage] || { required: false, status: 'OK', damage_type: '', remarks: '' };
                return (
                  <div key={stage} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <label className="flex items-center space-x-2 min-w-[120px]">
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
                      <span className="font-medium text-slate-700">{stage.toLocaleString()} cycles</span>
                    </label>
                    
                    <select
                      value={stageData.status}
                      onChange={(e) => {
                        const newWetStages = { ...inputData.wet_stages };
                        newWetStages[stage] = { ...stageData, status: e.target.value };
                        handleInputChange('wet_stages', newWetStages);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[80px]"
                      disabled={!stageData.required}
                    >
                      <option value="OK">OK</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Damage type (if any)"
                      value={stageData.damage_type}
                      onChange={(e) => {
                        const newWetStages = { ...inputData.wet_stages };
                        newWetStages[stage] = { ...stageData, damage_type: e.target.value };
                        handleInputChange('wet_stages', newWetStages);
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                      disabled={!stageData.required}
                    />

                    {stageData.required && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        stageData.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stageData.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Default form for other tests
    if (testDetails.input_parameters) {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Client Specification</h4>
            </div>
            <p className="text-sm text-blue-800">{clientRequirement}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(testDetails.input_parameters).map(([key, param]: [string, any]) => (
              <div key={key}>
                {renderInputField(key, param)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (testLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 text-slate-600">
          <AlertTriangle className="w-5 h-5" />
          <p>Test details not found for {testStandard}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calculator className="w-6 h-6 text-green-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reference Calculator</h2>
          <p className="text-sm text-slate-600">Enter test results and get pass/fail determination</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Input Form */}
        <div>
          <h3 className="font-medium text-slate-900 mb-4">Test Input Parameters</h3>
          {renderSpecialCalculators()}
        </div>

        {/* Calculate Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            <p>All calculations use the same logic as the test library</p>
          </div>
          <button
            onClick={calculateResults}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" />
            <span>{loading ? 'Calculating...' : 'Calculate Result'}</span>
          </button>
        </div>

        {/* Results Display */}
        {results && (
          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-medium text-slate-900 mb-4">Calculation Results</h3>
            
            {/* Pass/Fail Badge */}
            <div className="mb-6">
              <div className={`inline-flex items-center px-6 py-3 rounded-lg text-lg font-semibold ${
                results.result === 'PASS' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {results.result === 'PASS' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 mr-2" />
                )}
                {results.result}
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3">Detailed Results</h4>
              <div className="space-y-2">
                {Object.entries(results).map(([key, value]: [string, any]) => {
                  if (key === 'result') return null;
                  
                  return (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
