'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Package, Eye, MoreVertical, Calendar, FileText, CheckCircle } from 'lucide-react';
import ArticleDetails from './ArticleDetails';

interface Article {
  id: number;
  article_number: string;
  article_name: string;
  material_type: string | null;
  color: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  total_tests: number;
  total_batches: number;
  completed_tests: number;
  created_at: string;
  updated_at: string;
}

interface ClientArticlesProps {
  clientId: number;
  clientName: string;
  onBack: () => void;
}

export default function ClientArticles({ clientId, clientName, onBack }: ClientArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingArticle, setViewingArticle] = useState<{ articleId: number; articleNumber: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [clientId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.article-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}/articles`);
      if (response.ok) {
        const articlesData = await response.json();
        setArticles(articlesData);
      } else {
        console.error('Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArticle = (articleId: number, articleNumber: string) => {
    setViewingArticle({ articleId, articleNumber });
  };

  const handleBackToArticles = () => {
    setViewingArticle(null);
  };

  const handleDropdownToggle = (articleId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === articleId.toString() ? null : articleId.toString());
  };

  const handleEditArticle = (articleId: number) => {
    console.log('✏️ Editing article:', articleId);
    alert(`Editing article ${articleId} - Feature coming soon!`);
    setActiveDropdown(null);
  };

  const handleNewTestBatch = (articleId: number) => {
    console.log('🧪 Creating new test batch for article:', articleId);
    alert(`Creating new test batch for article ${articleId} - Feature coming soon!`);
    setActiveDropdown(null);
  };

  const handleDeactivateArticle = (articleId: number) => {
    console.log('🚫 Deactivating article:', articleId);
    alert(`Deactivating article ${articleId} - Feature coming soon!`);
    setActiveDropdown(null);
  };

  if (viewingArticle) {
    return (
      <ArticleDetails
        clientId={clientId}
        articleId={viewingArticle.articleId}
        clientName={clientName}
        onBack={handleBackToArticles}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Clients</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Articles</h2>
            <p className="text-slate-600">{clientName}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Articles</p>
              <p className="text-3xl font-bold text-slate-900">{articles.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Articles</p>
              <p className="text-3xl font-bold text-slate-900">
                {articles.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Tests</p>
              <p className="text-3xl font-bold text-slate-900">
                {articles.reduce((sum, article) => sum + (article.total_tests || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Test Batches</p>
              <p className="text-3xl font-bold text-slate-900">
                {articles.reduce((sum, article) => sum + (article.total_batches || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading articles...</p>
          </div>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{article.article_number}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      article.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {article.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{article.article_name}</p>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => handleDropdownToggle(article.id, e)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === article.id.toString() && (
                    <div className="article-dropdown absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                      <button
                        onClick={() => handleEditArticle(article.id)}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit Article Details
                      </button>
                      <button
                        onClick={() => handleNewTestBatch(article.id)}
                        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                      >
                        ➕ New Test Batch
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleDeactivateArticle(article.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Deactivate Article
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Article Details */}
              <div className="mb-4 space-y-2">
                {article.material_type && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Material:</span>
                    <span className="text-sm text-slate-700">{article.material_type}</span>
                  </div>
                )}
                {article.color && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Color:</span>
                    <span className="text-sm text-slate-700">{article.color}</span>
                  </div>
                )}
                {article.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{article.description}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                <span>{article.total_tests || 0} Tests</span>
                <span>{article.total_batches || 0} Batches</span>
                <span>{article.completed_tests || 0} Completed</span>
              </div>

              {/* Progress Bar */}
              {article.total_tests > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Test Progress</span>
                    <span>{Math.round((article.completed_tests / article.total_tests) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(article.completed_tests / article.total_tests) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleViewArticle(article.id, article.article_number)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>

              {/* Created Date */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Created {new Date(article.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No articles yet</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            This client doesn't have any articles onboarded yet. Create the first article to get started with testing.
          </p>
        </div>
      )}
    </div>
  );
}
