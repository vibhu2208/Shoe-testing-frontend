'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Test } from '@/types/test';

interface TestCardProps {
  test: Test;
  onTestClick: (test: Test) => void;
  onCategoryChange: (testId: string, newCategory: string) => void;
}

export default function TestCard({ test, onTestClick, onCategoryChange }: TestCardProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-2">
          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
            {test.id}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getCategoryBadgeStyle(test.category)}`}
            >
              {test.category}
              <ChevronDown className="ml-1 w-3 h-3" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
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
        </div>
        
        <h3 className="font-semibold text-slate-900 mb-1">{test.name}</h3>
        <p className="text-sm text-slate-500">{test.standard}</p>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {test.description}
        </p>

        {/* Key Parameter Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {test.key_tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {test.key_tags.length > 4 && (
            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
              +{test.key_tags.length - 4} more
            </span>
          )}
        </div>

        {/* Formula Preview */}
        <div className="bg-slate-50 rounded p-2 mb-4">
          <code className="text-xs text-slate-700 font-mono">
            {test.formula_preview}
          </code>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => onTestClick(test)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
