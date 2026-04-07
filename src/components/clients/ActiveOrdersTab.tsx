'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Eye, Plus } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  client_id: string;
  status: 'draft' | 'in_progress' | 'completed' | 'report_sent';
  created_at: string;
  total_tests: number;
  completed_tests: number;
  client_name: string;
}

export default function ActiveOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(publicApiUrl('/api/clients/orders/active'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      setError('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      report_sent: { label: 'Report Sent', className: 'bg-green-100 text-green-700' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-slate-500" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
      case 'report_sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Active Orders</h2>
          <p className="text-slate-600">Monitor ongoing test orders across all clients</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Order Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-900">{order.order_number}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-slate-600">{order.client_name || 'Unknown Client'}</p>
                    </div>
                  </div>

                  {/* Test Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Test Progress</span>
                      <span className="text-sm text-slate-600">
                        {order.completed_tests || 0} of {order.total_tests || 0} tests completed
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${order.total_tests > 0 ? ((order.completed_tests || 0) / order.total_tests) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Created {new Date(order.created_at).toLocaleDateString()}
                    </span>
                    <button className="flex items-center space-x-2 px-3 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>View Order</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No active orders</h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              Orders will appear here once clients submit test requests.
            </p>
          </div>
        )
      )}
    </div>
  );
}
