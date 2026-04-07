'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import ExtractionReviewTable from './ExtractionReviewTable';

interface NewArticleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
  onArticleCreated?: () => void;
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

export default function NewArticleDrawer({ isOpen, onClose, clientId, clientName, onArticleCreated }: NewArticleDrawerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [articleNumber, setArticleNumber] = useState('');
  const [articleName, setArticleName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Article Information', icon: FileText },
    { number: 2, title: 'Upload Specification', icon: Upload },
    { number: 3, title: 'Review Extracted Tests', icon: CheckCircle },
    { number: 4, title: 'Confirm & Create Article', icon: CheckCircle }
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
      formData.append('clientId', String(clientId));

      const uploadResponse = await fetch(publicApiUrl('/api/documents/upload-file'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json().catch(() => null);
        throw new Error(uploadError?.error || 'Failed to upload document');
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
        
        // Auto-populate article info from extracted data if available
        if (extractResult.data.component) {
          const component = extractResult.data.component;
          if (component.name && !articleName) {
            setArticleName(component.name);
          }
          if (component.material_type && !materialType) {
            setMaterialType(component.material_type);
          }
          if (component.color && !color) {
            setColor(component.color);
          }
        }
        
        setCurrentStep(3); // Move to review step
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
    if (currentStep === 1) {
      // Validate article information
      if (!articleNumber.trim() || !articleName.trim()) {
        setError('Article number and name are required');
        return;
      }
      setError('');
    }
    
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
      // Validate article data
      if (!articleNumber.trim() || !articleName.trim()) {
        throw new Error('Article number and name are required');
      }

      const payload = {
        articleNumber: articleNumber.trim(),
        articleName: articleName.trim(),
        materialType: materialType.trim() || null,
        color: color.trim() || null,
        description: description.trim() || null,
        specifications: extractedData?.component || null,
        tests: extractedData?.tests ? extractedData.tests.map((test) => ({
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
        })) : []
      };

      const response = await fetch(publicApiUrl(`/api/clients/${clientId}/articles`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Article ${result.article.article_number} created successfully!`);
        setTimeout(() => {
          onClose();
          if (onArticleCreated) {
            onArticleCreated();
          }
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create article');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create article');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBulkTemplate = () => {
    window.open(publicApiUrl(`/api/clients/${clientId}/articles/bulk-template`), '_blank');
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(publicApiUrl(`/api/clients/${clientId}/articles/bulk-upload`), {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Bulk upload failed');
      }

      setSuccess(`Bulk upload successful: ${result.createdCount} articles created`);
      setTimeout(() => {
        onClose();
        onArticleCreated?.();
      }, 1200);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bulk upload failed');
    } finally {
      setIsBulkUploading(false);
      event.target.value = '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Article Information</h3>
              <p className="text-sm text-slate-600 mb-6">
                Provide basic information about the article you want to onboard for testing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Article Number *
                </label>
                <input
                  type="text"
                  value={articleNumber}
                  onChange={(e) => setArticleNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g., ART-001, SKU-12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Article Name *
                </label>
                <input
                  type="text"
                  value={articleName}
                  onChange={(e) => setArticleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g., Running Shoe Model X"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Material Type
                </label>
                <input
                  type="text"
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g., Leather, Synthetic, Rubber"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g., Black, White, Blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Brief description of the article and its intended use..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Upload Test Specification</h3>
              <p className="text-sm text-slate-600 mb-6">
                Upload the test specification document to automatically extract test requirements for this article.
              </p>
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Test Specification Document (Optional)
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Skip Document Upload</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                You can skip document upload and manually add tests later, or continue without any tests for now.
              </p>
              <button
                onClick={() => setCurrentStep(4)} // Skip to final step
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Continue Without Document
              </button>
            </div>
          </div>
        );

      case 3:
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
                  handleNext(); // Move to step 4
                }}
                onBack={handleBack}
              />
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Confirm Article Details</h3>
              <p className="text-sm text-slate-600 mb-6">
                Review the final article details before creating the article.
              </p>
            </div>

            {/* Article Summary */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h4 className="font-medium text-slate-900 mb-4">Article Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Client:</span>
                  <span className="ml-2 font-medium">{clientName}</span>
                </div>
                <div>
                  <span className="text-slate-600">Article Number:</span>
                  <span className="ml-2 font-medium">{articleNumber}</span>
                </div>
                <div>
                  <span className="text-slate-600">Article Name:</span>
                  <span className="ml-2 font-medium">{articleName}</span>
                </div>
                <div>
                  <span className="text-slate-600">Material Type:</span>
                  <span className="ml-2 font-medium">{materialType || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Color:</span>
                  <span className="ml-2 font-medium">{color || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Total Tests:</span>
                  <span className="ml-2 font-medium">{extractedData?.tests?.length || 0}</span>
                </div>
              </div>
              {description && (
                <div className="mt-4">
                  <span className="text-slate-600">Description:</span>
                  <p className="mt-1 text-slate-900">{description}</p>
                </div>
              )}
            </div>

            {/* Test Summary */}
            {extractedData && extractedData.tests && extractedData.tests.length > 0 && (
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
            <h2 className="text-xl font-semibold text-slate-900">Create New Article</h2>
            <p className="text-sm text-slate-600">Client: {clientName} • Step {currentStep} of {steps.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadBulkTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Template
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
              <Upload className="h-4 w-4" />
              {isBulkUploading ? 'Uploading...' : 'Bulk Upload'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleBulkUpload}
                className="hidden"
                disabled={isBulkUploading}
              />
            </label>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                {isCreating ? 'Creating Article...' : 'Create Article'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentStep === 2 && !extractedData && !!document}
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
