'use client';

import { useState } from 'react';
import { Calculator, CheckCircle, XCircle, AlertTriangle, Plus, Minus } from 'lucide-react';

interface ManualTestInputProps {
  testStandard: string;
  clientRequirement: string;
}

export default function ManualTestInput({ testStandard, clientRequirement }: ManualTestInputProps) {
  const [inputData, setInputData] = useState<any>({});
  const [results, setResults] = useState<any>(null);

  // Simple manual calculations for common test types
  const performManualCalculation = () => {
    let calculatedResults = {};
    let passFailResult = 'FAIL';

    if (testStandard === 'SATRA-TM-281') {
      // Bond Strength calculation
      const { client_spec_min_bond_strength = 2.0, point_data } = inputData;
      
      if (point_data && point_data.length > 0) {
        const point_results = point_data.map((point: any) => {
          const bond_strength = point.width > 0 ? (point.force_applied / point.width) : 0;
          const passes = bond_strength >= client_spec_min_bond_strength;
          return {
            ...point,
            bond_strength,
            passes
          };
        });

        const average_bond_strength = point_results.reduce((sum: number, point: any) => sum + point.bond_strength, 0) / point_results.length;
        const points_passed = point_results.filter((p: any) => p.passes).length;
        const points_failed = point_results.filter((p: any) => !p.passes).length;

        passFailResult = points_failed === 0 ? 'PASS' : 'FAIL';

        calculatedResults = {
          point_results,
          average_bond_strength,
          points_passed,
          points_failed,
          result: passFailResult
        };
      }
    } else if (testStandard === 'SATRA-TM-174') {
      // Sole Abrasion calculation
      const { 
        reference_rubber_run_1, 
        reference_rubber_run_2, 
        reference_rubber_run_3,
        sample_initial_weight,
        sample_final_weight,
        client_spec_max_volume = 200,
        density = 1.3
      } = inputData;

      if (sample_initial_weight && sample_final_weight) {
        const runs = [reference_rubber_run_1, reference_rubber_run_2, reference_rubber_run_3].filter(r => r && r > 0);
        const reference_rubber_avg = runs.length > 0 ? runs.reduce((sum: number, run: number) => sum + run, 0) / runs.length : 0;
        
        const weight_loss = parseFloat(sample_initial_weight) - parseFloat(sample_final_weight);
        const volume_loss = weight_loss > 0 ? (400 * reference_rubber_avg) / weight_loss : 0;
        const corrected_volume = volume_loss / parseFloat(density);

        passFailResult = corrected_volume <= client_spec_max_volume ? 'PASS' : 'FAIL';

        calculatedResults = {
          reference_rubber_avg: Math.round(reference_rubber_avg * 100) / 100,
          weight_loss: Math.round(weight_loss * 100) / 100,
          volume_loss: Math.round(volume_loss * 100) / 100,
          corrected_volume: Math.round(corrected_volume * 100) / 100,
          client_spec_max_volume,
          result: passFailResult
        };
      }
    } else if (testStandard === 'PH-001') {
      const {
        beaker_1_ph_1,
        beaker_1_ph_2,
        beaker_2_ph_1,
        beaker_2_ph_2,
        client_spec_min_avg_ph = 6.0,
        client_spec_max_difference = 0.5
      } = inputData;

      const hasAllReadings = [beaker_1_ph_1, beaker_1_ph_2, beaker_2_ph_1, beaker_2_ph_2].every(
        (value) => value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value))
      );

      if (hasAllReadings) {
        const beaker1Average = (parseFloat(beaker_1_ph_1) + parseFloat(beaker_1_ph_2)) / 2;
        const beaker1Difference = Math.abs(parseFloat(beaker_1_ph_1) - parseFloat(beaker_1_ph_2));
        const beaker2Average = (parseFloat(beaker_2_ph_1) + parseFloat(beaker_2_ph_2)) / 2;
        const beaker2Difference = Math.abs(parseFloat(beaker_2_ph_1) - parseFloat(beaker_2_ph_2));

        const beaker_1_avg_passes = beaker1Average >= client_spec_min_avg_ph;
        const beaker_1_difference_passes = beaker1Difference <= client_spec_max_difference;
        const beaker_2_avg_passes = beaker2Average >= client_spec_min_avg_ph;
        const beaker_2_difference_passes = beaker2Difference <= client_spec_max_difference;

        passFailResult =
          beaker_1_avg_passes &&
          beaker_1_difference_passes &&
          beaker_2_avg_passes &&
          beaker_2_difference_passes
            ? 'PASS'
            : 'FAIL';

        calculatedResults = {
          beaker_1_average: Math.round(beaker1Average * 100) / 100,
          beaker_1_difference: Math.round(beaker1Difference * 100) / 100,
          beaker_2_average: Math.round(beaker2Average * 100) / 100,
          beaker_2_difference: Math.round(beaker2Difference * 100) / 100,
          average_pH: Math.round(((beaker1Average + beaker2Average) / 2) * 100) / 100,
          difference: Math.round(Math.max(beaker1Difference, beaker2Difference) * 100) / 100,
          client_spec_min_avg_ph,
          client_spec_max_difference,
          beaker_1_avg_passes,
          beaker_1_difference_passes,
          beaker_2_avg_passes,
          beaker_2_difference_passes,
          result: passFailResult
        };
      }
    } else {
      // Generic calculation
      calculatedResults = {
        message: 'Manual calculation for this test type',
        test_standard: testStandard,
        input_data: inputData,
        result: 'PASS' // Default for demo
      };
    }

    setResults(calculatedResults);
  };

  const renderInputForm = () => {
    if (testStandard === 'SATRA-TM-281') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Client Requirement</h4>
            <p className="text-sm text-blue-800 mb-3">{clientRequirement}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Bond Strength (N/mm)
                <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={inputData.client_spec_min_bond_strength || ''}
                onChange={(e) => setInputData({...inputData, client_spec_min_bond_strength: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 2.0"
              />
            </div>
          </div>

          <div>
            <h5 className="font-medium text-slate-900 mb-3">16-Point Bond Strength Measurements</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 16 }, (_, i) => {
                const pointData = inputData.point_data?.[i] || { point_number: i + 1, force_applied: 0, width: 0 };
                const bondStrength = pointData.width > 0 ? (pointData.force_applied / pointData.width).toFixed(2) : '0.00';
                const passes = parseFloat(bondStrength) >= (inputData.client_spec_min_bond_strength || 0);
                
                return (
                  <div key={i} className={`border rounded-lg p-3 ${passes ? 'bg-green-50 border-green-200' : pointData.force_applied > 0 && pointData.width > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-medium text-sm mb-2">Point {i + 1}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Force (N)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pointData.force_applied || ''}
                          onChange={(e) => {
                            const newPointData = [...(inputData.point_data || Array(16).fill(null).map((_, idx) => ({ point_number: idx + 1, force_applied: 0, width: 0 })))];
                            newPointData[i] = { ...newPointData[i], force_applied: parseFloat(e.target.value) || 0 };
                            setInputData({...inputData, point_data: newPointData});
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Width (mm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pointData.width || ''}
                          onChange={(e) => {
                            const newPointData = [...(inputData.point_data || Array(16).fill(null).map((_, idx) => ({ point_number: idx + 1, force_applied: 0, width: 0 })))];
                            newPointData[i] = { ...newPointData[i], width: parseFloat(e.target.value) || 0 };
                            setInputData({...inputData, point_data: newPointData});
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="font-mono">{bondStrength} N/mm</span>
                      {pointData.force_applied > 0 && pointData.width > 0 && (
                        <span className={`ml-2 px-2 py-1 rounded-full ${passes ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {passes ? 'PASS' : 'FAIL'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (testStandard === 'SATRA-TM-174') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Client Requirement</h4>
            <p className="text-sm text-blue-800 mb-3">{clientRequirement}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Volume Loss (mm³)
                <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={inputData.client_spec_max_volume || ''}
                onChange={(e) => setInputData({...inputData, client_spec_max_volume: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reference Rubber Run 1</label>
              <input
                type="number"
                step="0.1"
                value={inputData.reference_rubber_run_1 || ''}
                onChange={(e) => setInputData({...inputData, reference_rubber_run_1: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reference Rubber Run 2</label>
              <input
                type="number"
                step="0.1"
                value={inputData.reference_rubber_run_2 || ''}
                onChange={(e) => setInputData({...inputData, reference_rubber_run_2: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reference Rubber Run 3</label>
              <input
                type="number"
                step="0.1"
                value={inputData.reference_rubber_run_3 || ''}
                onChange={(e) => setInputData({...inputData, reference_rubber_run_3: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Density</label>
              <input
                type="number"
                step="0.1"
                value={inputData.density || '1.3'}
                onChange={(e) => setInputData({...inputData, density: parseFloat(e.target.value) || 1.3})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="1.3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sample Initial Weight (g)</label>
              <input
                type="number"
                step="0.1"
                value={inputData.sample_initial_weight || ''}
                onChange={(e) => setInputData({...inputData, sample_initial_weight: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sample Final Weight (g)</label>
              <input
                type="number"
                step="0.1"
                value={inputData.sample_final_weight || ''}
                onChange={(e) => setInputData({...inputData, sample_final_weight: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
              />
            </div>
          </div>
        </div>
      );
    }

    if (testStandard === 'PH-001') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Client Requirement</h4>
            <p className="text-sm text-blue-800 mb-3">{clientRequirement}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Average pH (per beaker)
                  <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputData.client_spec_min_avg_ph || ''}
                  onChange={(e) => setInputData({...inputData, client_spec_min_avg_ph: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 6.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Reading Difference (per beaker)
                  <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Client Spec</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputData.client_spec_max_difference || ''}
                  onChange={(e) => setInputData({...inputData, client_spec_max_difference: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 0.5"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Beaker 1 — Reading 1', key: 'beaker_1_ph_1' },
              { label: 'Beaker 1 — Reading 2', key: 'beaker_1_ph_2' },
              { label: 'Beaker 2 — Reading 1', key: 'beaker_2_ph_1' },
              { label: 'Beaker 2 — Reading 2', key: 'beaker_2_ph_2' }
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputData[key] || ''}
                  onChange={(e) => setInputData({ ...inputData, [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Generic input form for other tests
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Client Requirement</h4>
          <p className="text-sm text-blue-800">{clientRequirement}</p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              Generic input form for {testStandard}. Specific test parameters will be available when the backend is connected.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Test Value 1</label>
            <input
              type="number"
              step="0.1"
              value={inputData.test_value_1 || ''}
              onChange={(e) => setInputData({...inputData, test_value_1: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Test Value 2</label>
            <input
              type="number"
              step="0.1"
              value={inputData.test_value_2 || ''}
              onChange={(e) => setInputData({...inputData, test_value_2: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observation</label>
            <input
              type="text"
              value={inputData.observation || ''}
              onChange={(e) => setInputData({...inputData, observation: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter observation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              value={inputData.remarks || ''}
              onChange={(e) => setInputData({...inputData, remarks: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter remarks"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calculator className="w-6 h-6 text-green-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Test Input & Calculation</h2>
          <p className="text-sm text-slate-600">Enter test results and get pass/fail determination</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Input Form */}
        <div>
          <h3 className="font-medium text-slate-900 mb-4">Input Parameters</h3>
          {renderInputForm()}
        </div>

        {/* Calculate Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            <p>Manual calculation mode - works without backend connection</p>
          </div>
          <button
            onClick={performManualCalculation}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate Result</span>
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
