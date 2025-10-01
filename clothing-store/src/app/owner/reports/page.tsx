'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { transactionService, Transaction } from '@/services/transactionService';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ReportData {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  averageOrderValue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

function ReportsPageContent() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const transactions = await transactionService.getTransactions();
      
      // Filter transactions based on date range
      let filteredTransactions = transactions;
      
      if (dateRange !== 'all') {
        const now = new Date();
        const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
        const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        
        filteredTransactions = transactions.filter(t => 
          new Date(t.timestamp) >= startDate
        );
      }

      // Calculate report data
      const data = calculateReportData(filteredTransactions);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReportData = (transactions: Transaction[]): ReportData => {
    // Filter for revenue-generating transactions (completed, partially refunded, and refunded)
    const revenueTransactions = transactions.filter(t => 
      t.status === 'completed' || t.status === 'partially_refunded' || t.status === 'refunded'
    );
    
    // Calculate net revenue after refunds
    const totalRevenue = revenueTransactions.reduce((sum, t) => {
      const refundedAmount = t.refunds?.reduce((refundSum, refund) => refundSum + refund.totalAmount, 0) || 0;
      // Ensure net revenue is never negative (safeguard against data inconsistencies)
      return sum + Math.max(0, t.total - refundedAmount);
    }, 0);
    const totalTransactions = transactions.length;
    const uniqueCustomers = new Set(transactions.map(t => t.customer?.uid).filter(Boolean)).size;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Top selling items
    const itemSales: { [key: string]: { quantity: number; revenue: number } } = {};
    
    // Only include items from revenue-generating transactions
    revenueTransactions.forEach(transaction => {
      // Calculate refunded quantities for each item in this transaction
      const refundedQuantities: { [itemIndex: number]: number } = {};
      if (transaction.refunds) {
        transaction.refunds.forEach(refund => {
          refund.items.forEach(refundItem => {
            refundedQuantities[refundItem.itemIndex] = (refundedQuantities[refundItem.itemIndex] || 0) + refundItem.quantity;
          });
        });
      }

      transaction.items.forEach((item, index) => {
        const key = `${item.groupName} - ${item.selectedColor} - ${item.selectedSize}`;
        if (!itemSales[key]) {
          itemSales[key] = { quantity: 0, revenue: 0 };
        }
        
        // Calculate net quantity (original quantity minus refunded quantity)
        const refundedQty = refundedQuantities[index] || 0;
        const netQuantity = item.quantity - refundedQty;
        const netRevenue = item.unitPrice * netQuantity;
        
        // Only add positive quantities and revenue
        if (netQuantity > 0) {
          itemSales[key].quantity += netQuantity;
          itemSales[key].revenue += netRevenue;
        }
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Daily sales (last 7 days)
    const dailySales: { [key: string]: { revenue: number; transactions: number } } = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => {
      dailySales[date] = { revenue: 0, transactions: 0 };
    });

    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toISOString().split('T')[0];
      if (dailySales[date]) {
        // Only include revenue from completed, partially_refunded, and refunded transactions
        if (transaction.status === 'completed' || transaction.status === 'partially_refunded' || transaction.status === 'refunded') {
          // Calculate refunded amount from refunds array
          const refundedAmount = transaction.refunds?.reduce((sum, refund) => sum + refund.totalAmount, 0) || 0;
          const netAmount = transaction.total - refundedAmount;
          dailySales[date].revenue += Math.max(0, netAmount);
        }
        dailySales[date].transactions += 1;
      }
    });

    const dailySalesArray = Object.entries(dailySales).map(([date, data]) => ({
      date,
      ...data
    }));

    // Payment method breakdown
    const paymentMethods: { [key: string]: number } = {};
    transactions.forEach(transaction => {
      paymentMethods[transaction.paymentMethod] = (paymentMethods[transaction.paymentMethod] || 0) + 1;
    });

    const paymentMethodBreakdown = Object.entries(paymentMethods).map(([method, count]) => ({
      method,
      count,
      percentage: totalTransactions > 0 ? (count / totalTransactions) * 100 : 0
    }));

    return {
      totalRevenue,
      totalTransactions,
      totalCustomers: uniqueCustomers,
      averageOrderValue,
      topSellingItems,
      dailySales: dailySalesArray,
      paymentMethodBreakdown
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `THB ${amount.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isCartModalOpen={isCartModalOpen}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavBar onCartModalStateChange={setIsCartModalOpen} />
          
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCartModalOpen={isCartModalOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavBar onCartModalStateChange={setIsCartModalOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
          </div>
          <div className="flex space-x-4">
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | '1y' | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData?.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12.5% from last period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.totalTransactions || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+8.2% from last period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.totalCustomers || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+15.3% from last period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData?.averageOrderValue || 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+5.7% from last period</span>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Sales Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales (Last 7 Days)</h3>
            <div className="space-y-4">
              {reportData?.dailySales.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(day.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.transactions} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {reportData?.paymentMethodBreakdown.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                    <span className="text-sm text-gray-900 capitalize">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {method.count} transactions
                    </div>
                    <div className="text-xs text-gray-500">
                      {method.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.topSellingItems.map((item, index) => (
                  <tr key={item.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (item.quantity / (reportData?.topSellingItems[0]?.quantity || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round((item.quantity / (reportData?.topSellingItems[0]?.quantity || 1)) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <ReportsPageContent />
    </ProtectedRoute>
  );
}