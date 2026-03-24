'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Building2, User, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface OnboardClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: () => void;
}


interface ClientData {
  companyName: string;
  clientCode: string;
  industry: string;
  country: string;
  address: string;
  status: 'active' | 'inactive';
  primaryContact: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  secondaryContacts: Array<{
    name: string;
    designation: string;
    email: string;
    phone: string;
  }>;
}

export default function OnboardClientDrawer({ isOpen, onClose, onClientCreated }: OnboardClientDrawerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState<ClientData>({
    companyName: '',
    clientCode: 'VRL-001',
    industry: '',
    country: '',
    address: '',
    status: 'active',
    primaryContact: {
      name: '',
      designation: '',
      email: '',
      phone: ''
    },
    secondaryContacts: []
  });

  const steps = [
    { number: 1, title: 'Company Information', icon: Building2 },
    { number: 2, title: 'Point of Contact', icon: User },
    { number: 3, title: 'Confirm & Save', icon: CheckCircle }
  ];

  const industries = [
    'Footwear',
    'Apparel',
    'Leather Goods',
    'Accessories',
    'Other'
  ];

  const inhouseTests = [
    'SATRA-TM-174',
    'SATRA-TM-92',
    'SATRA-TM-161',
    'SATRA-TM-281',
    'PH-001',
    'ISO-19574',
    'FZ-001',
    'HAO-001',
    'SATRA-TM-31'
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!clientData.companyName || !clientData.primaryContact.name || !clientData.primaryContact.email) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: clientData.companyName,
          clientCode: clientData.clientCode || `VRL-${String(Date.now()).slice(-6)}`,
          industry: clientData.industry,
          country: clientData.country,
          address: clientData.address,
          status: clientData.status,
          primaryContact: clientData.primaryContact,
          secondaryContacts: clientData.secondaryContacts
        }),
      });

      if (response.ok) {
        alert('Client created successfully!');
        onClientCreated?.();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to create client: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    }
  };

  const addSecondaryContact = () => {
    setClientData(prev => ({
      ...prev,
      secondaryContacts: [...prev.secondaryContacts, { name: '', designation: '', email: '', phone: '' }]
    }));
  };

  const removeSecondaryContact = (index: number) => {
    setClientData(prev => ({
      ...prev,
      secondaryContacts: prev.secondaryContacts.filter((_, i) => i !== index)
    }));
  };

  
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={clientData.companyName}
                onChange={(e) => setClientData(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client Code
              </label>
              <input
                type="text"
                value={clientData.clientCode}
                onChange={(e) => setClientData(prev => ({ ...prev, clientCode: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Auto-generated if left empty (e.g., ABC-1234)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Industry
              </label>
              <select
                value={clientData.industry}
                onChange={(e) => setClientData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              >
                <option value="">Select industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={clientData.country}
                onChange={(e) => setClientData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Enter country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address
              </label>
              <textarea
                value={clientData.address}
                onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Enter full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="active"
                    checked={clientData.status === 'active'}
                    onChange={(e) => setClientData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  Active
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="inactive"
                    checked={clientData.status === 'inactive'}
                    onChange={(e) => setClientData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  Inactive
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Primary Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={clientData.primaryContact.name}
                    onChange={(e) => setClientData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={clientData.primaryContact.designation}
                    onChange={(e) => setClientData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, designation: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={clientData.primaryContact.email}
                    onChange={(e) => setClientData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    placeholder="email@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={clientData.primaryContact.phone}
                    onChange={(e) => setClientData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {clientData.secondaryContacts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Secondary Contacts</h3>
                {clientData.secondaryContacts.map((contact, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-700">Contact {index + 1}</h4>
                      <button
                        onClick={() => removeSecondaryContact(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => {
                          const updatedContacts = [...clientData.secondaryContacts];
                          updatedContacts[index].name = e.target.value;
                          setClientData(prev => ({ ...prev, secondaryContacts: updatedContacts }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={contact.designation}
                        onChange={(e) => {
                          const updatedContacts = [...clientData.secondaryContacts];
                          updatedContacts[index].designation = e.target.value;
                          setClientData(prev => ({ ...prev, secondaryContacts: updatedContacts }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                        placeholder="Designation"
                      />
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          const updatedContacts = [...clientData.secondaryContacts];
                          updatedContacts[index].email = e.target.value;
                          setClientData(prev => ({ ...prev, secondaryContacts: updatedContacts }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                        placeholder="Email"
                      />
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => {
                          const updatedContacts = [...clientData.secondaryContacts];
                          updatedContacts[index].phone = e.target.value;
                          setClientData(prev => ({ ...prev, secondaryContacts: updatedContacts }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={addSecondaryContact}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Contact</span>
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Confirm & Save Client</h3>
              <p className="text-sm text-slate-600 mb-6">
                Please review the client information below before creating the client. You can add articles and tests after the client is created.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Company Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Company Name:</span>
                    <p className="font-medium text-slate-900">{clientData.companyName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Client Code:</span>
                    <p className="font-medium text-slate-900">{clientData.clientCode || 'Auto-generated'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Industry:</span>
                    <p className="font-medium text-slate-900">{clientData.industry || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Country:</span>
                    <p className="font-medium text-slate-900">{clientData.country || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Address:</span>
                    <p className="font-medium text-slate-900">{clientData.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 mb-2">Primary Contact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <p className="font-medium text-slate-900">{clientData.primaryContact.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Designation:</span>
                    <p className="font-medium text-slate-900">{clientData.primaryContact.designation || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium text-slate-900">{clientData.primaryContact.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>
                    <p className="font-medium text-slate-900">{clientData.primaryContact.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {clientData.secondaryContacts.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Secondary Contacts ({clientData.secondaryContacts.length})</h4>
                  <div className="text-sm text-slate-600">
                    {clientData.secondaryContacts.map((contact, index) => (
                      <div key={index} className="mb-1">
                        {contact.name} - {contact.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After creating the client, you can add articles and upload specification documents for each article separately.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Onboard New Client</h2>
            <p className="text-sm text-slate-600">Step {currentStep} of {steps.length}</p>
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
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ml-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
