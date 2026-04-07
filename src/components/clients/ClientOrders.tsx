'use client';

import { publicApiUrl } from '@/lib/apiBase';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react';
import OrderDetails from '@/components/clients/OrderDetails';

interface Order {
  id: number;
  order_number: string;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  test_count: number;
  completed_tests: number;
}

interface ClientOrdersProps {
  clientId: number;
  clientName: string;
  onBack: () => void;
}

export default function ClientOrders({ clientId, clientName, onBack }: ClientOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrderDetails, setViewingOrderDetails] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [clientId]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(publicApiUrl(`/api/clients/${clientId}/orders`));
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (orderId: number) => {
    setViewingOrderDetails(orderId);
  };

  const handleBackToOrders = () => {
    setViewingOrderDetails(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewingOrderDetails ? (
        <OrderDetails
          clientId={clientId}
          orderId={viewingOrderDetails}
          clientName={clientName}
          onBack={handleBackToOrders}
        />
      ) : (
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
            <h2 className="text-2xl font-bold text-slate-900">{clientName} Orders</h2>
            <p className="text-slate-600">Manage test orders and track progress</p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{order.order_number}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status.replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{order.test_count} Tests</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{order.completed_tests} Completed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewDetails(order.id)}
                    className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Manage Tests
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((order.completed_tests / order.test_count) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(order.completed_tests / order.test_count) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
          <p className="text-slate-600 mb-6">
            This client hasn't placed any test orders yet.
          </p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Create First Order
          </button>
        </div>
      )}
        </div>
      )}
    </>
  );
}
