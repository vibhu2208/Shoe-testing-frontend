'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, FileText, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import ExtractionReviewTable from './ExtractionReviewTable';

interface NewOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
  onOrderCreated?: () => void;
}

interface ComponentInfo {
  name: string;
  material_type: string;
  color: string | null;
}

interface TestRow {
  id: string;
  serial_number: number;
  test_name: string;
  standard_method: string | null;
  client_requirement: string;
  category: 'Raw Material' | 'Work In Progress' | 'Finished Good';
  execution_type: 'inhouse' | 'outsource' | 'both';
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

interface ExtractedData {
  component: ComponentInfo | null;
  tests: TestRow[];
  extraction_meta: {
    total_tests_found: number;
    inhouse_count: number;
    outsource_count: number;
    raw_material_count: number;
    wip_count: number;
    finished_good_count: number;
  };
}

export default function NewOrderDrawer({ isOpen, onClose, clientId, clientName, onOrderCreated }: NewOrderDrawerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Upload Specification', icon: Upload },
    { number: 2, title: 'Review Extracted Tests', icon: FileText },
    { number: 3, title: 'Confirm & Create Order', icon: CheckCircle }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setDocument(file);
      setExtractionError('');
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleExtractData = async () => {
    if (!document) return;

    setIsExtracting(true);
    setExtractionError('');

    try {
      // First, upload the document to get a document ID
      const formData = new FormData();
      formData.append('file', document);
      formData.append('fileName', document.name);
      formData.append('clientId', 'temp-client-id'); // Will be replaced when order is created

      const uploadResponse = await fetch(publicApiUrl('/api/documents/upload-file'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document');
      }

      const uploadResult = await uploadResponse.json();
      const documentId = uploadResult.documentId;

      // Start extraction pipeline
      const extractResponse = await fetch(publicApiUrl('/api/extraction/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clientDocumentId: documentId,
          filePath: uploadResult.filePath
        })
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to start extraction');
      }

      const extractResult = await extractResponse.json();

      if (extractResult.success) {
        setExtractedData(extractResult.data);
        setCurrentStep(2); // Move to review step
      } else {
        throw new Error(extractResult.error || 'Extraction failed');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError(error instanceof Error ? error.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      // Validate extracted data
      if (!extractedData || !extractedData.tests || extractedData.tests.length === 0) {
        throw new Error('No tests found to create order');
      }

      const payload = {
        orderNumber: orderNumber.trim() || undefined,
        tests: extractedData.tests.map((test) => ({
          testName: test.test_name,
          standard: test.standard_method,
          clientRequirement: test.client_requirement,
          category: test.category,
          executionType: test.execution_type,
          inhouseTestId: test.inhouse_test_id,
          vendorName: test.vendor_name,
          vendorContact: test.vendor_contact,
          vendorEmail: test.vendor_email,
          expectedReportDate: test.expected_report_date,
          assignedTesterId: test.assigned_tester_id,
          testDeadline: test.test_deadline,
          notes: test.notes
        }))
      };

      const response = await fetch(publicApiUrl(`/api/clients/${clientId}/orders`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Order ${result.order.order_number} created successfully!`);
        setTimeout(() => {
          onClose();
          if (onOrderCreated) {
            onOrderCreated();
          }
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Order Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Order Number (optional)
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Auto-generated if left empty (e.g., ORD-123456)"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Upload Test Specification Document
              </label>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-700">
                  Drop your PDF file here, or{' '}
                  <label className="text-green-600 hover:text-green-700 cursor-pointer">
                    browse
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-sm text-slate-500">PDF files only, up to 10MB</p>
              </div>
            </div>

            {document && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">{document.name}</p>
                    <p className="text-sm text-green-600">
                      {(document.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <button
                  onClick={handleExtractData}
                  disabled={isExtracting}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? 'Extracting test requirements...' : 'Extract Data & Continue'}
                </button>
              </div>
            )}

            {isExtracting && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Extracting test requirements...</p>
              </div>
            )}

            {extractionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">Extraction Failed</span>
                </div>
                <p className="text-sm text-red-700">{extractionError}</p>
                <button
                  onClick={handleExtractData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Retry Extraction
                </button>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Review Extracted Tests</h3>
              <p className="text-sm text-slate-600 mb-6">
                Review and edit the test requirements extracted from your specification document.
              </p>
            </div>

            {extractedData && (
              <ExtractionReviewTable
                extractedData={extractedData}
                onConfirm={(tests, componentInfo) => {
                  setExtractedData(prev => prev ? {
                    ...prev,
                    tests,
                    component: componentInfo
                  } : null);
                  handleNext(); // Move to step 3
                }}
                onBack={handleBack}
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Confirm Order Details</h3>
              <p className="text-sm text-slate-600 mb-6">
                Review the final order details before creating the order.
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h4 className="font-medium text-slate-900 mb-4">Order Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Client:</span>
                  <span className="ml-2 font-medium">{clientName}</span>
                </div>
                <div>
                  <span className="text-slate-600">Order Number:</span>
                  <span className="ml-2 font-medium">{orderNumber || 'Auto-generated'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Total Tests:</span>
                  <span className="ml-2 font-medium">{extractedData?.tests?.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-600">Document:</span>
                  <span className="ml-2 font-medium">{document?.name}</span>
                </div>
              </div>
            </div>

            {/* Test Summary */}
            {extractedData && extractedData.tests && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="font-medium text-slate-900 mb-4">Test Summary</h4>
                <div className="space-y-2 text-sm">
                  {extractedData.tests.slice(0, 5).map((test, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-slate-600">{test.test_name}</span>
                      <span className="text-slate-900">{test.execution_type}</span>
                    </div>
                  ))}
                  {extractedData.tests.length > 5 && (
                    <div className="text-slate-500 italic">
                      ... and {extractedData.tests.length - 5} more tests
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create New Order</h2>
            <p className="text-sm text-slate-600">Client: {clientName} • Step {currentStep} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                    ${isActive ? 'border-green-600 bg-green-600 text-white' : 
                      isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                      'border-slate-300 bg-white text-slate-400'}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-300 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">{success}</span>
              </div>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Cancel</span>
            </button>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div>
            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating Order...' : 'Create Order'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !extractedData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
