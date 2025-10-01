'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transactionService, Transaction } from '@/services/transactionService';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { Search, Filter, Download, Eye, Calendar, CreditCard, Smartphone, Wallet, RotateCcw, X, AlertTriangle, MoreVertical, ChevronDown } from 'lucide-react';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled' | 'refunded' | 'partially_refunded'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | 'cash' | 'scan' | 'wallet'>('all');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
  
  // Layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  
  // Modal states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundItems, setRefundItems] = useState<{[key: string]: number}>({});
  
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    loadTransactions();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as Element;
        
        // Check if click is on the dropdown button
        const isDropdownButton = Object.values(buttonRefs.current).some(button => 
          button && button.contains(target)
        );
        
        // Check if click is on the dropdown menu
        const isDropdownMenu = target.closest('[data-dropdown-menu]');
        
        if (!isDropdownButton && !isDropdownMenu) {
          setOpenDropdown(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || transaction.paymentMethod === filterPaymentMethod;
    
    // Date range filtering
    let matchesDateRange = true;
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case '30d':
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case '90d':
          startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        default:
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      }
      
      matchesDateRange = new Date(transaction.timestamp) >= startDate;
    }
    
    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDateRange;
  });

  // Filter for revenue-generating transactions (completed, partially refunded, and refunded)
  const revenueTransactions = filteredTransactions.filter(t => 
    t.status === 'completed' || t.status === 'partially_refunded' || t.status === 'refunded'
  );

  // Calculate net revenue (original total minus refunded amounts)
  const calculateNetRevenue = (transactions: Transaction[]) => {
    return transactions.reduce((total, transaction) => {
      const originalAmount = transaction.total;
      const refundedAmount = transaction.refunds?.reduce((sum, refund) => sum + refund.totalAmount, 0) || 0;
      // Ensure net revenue is never negative (safeguard against data inconsistencies)
      return total + Math.max(0, originalAmount - refundedAmount);
    }, 0);
  };

  // Calculate completed transactions count (excluding fully refunded)
  const completedTransactionsCount = revenueTransactions.filter(t => t.status !== 'refunded').length;

  const formatCurrency = (amount: number) => {
    return `THB ${amount.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <CreditCard className="h-4 w-4" />;
      case 'scan':
        return <Smartphone className="h-4 w-4" />;
      case 'wallet':
        return <Wallet className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'refunded':
      case 'partially_refunded':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'refunded':
        return 'Refunded';
      case 'partially_refunded':
        return 'Partially Refunded';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const toggleDropdown = (transactionId: string) => {
    if (openDropdown === transactionId) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[transactionId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right + window.scrollX
        });
      }
      setOpenDropdown(transactionId);
    }
  };

  const handleRefundClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    // Initialize refund items with 0 quantities
    const initialRefundItems: {[key: string]: number} = {};
    transaction.items.forEach((item, index) => {
      initialRefundItems[`${item.id}___${index}`] = 0;
    });
    setRefundItems(initialRefundItems);
    setShowRefundModal(true);
    setOpenDropdown(null); // Close dropdown
    setDropdownPosition(null); // Reset position
  };

  const handleCancelClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowCancelModal(true);
    setOpenDropdown(null); // Close dropdown
    setDropdownPosition(null); // Reset position
  };

  const handleViewClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewDetailsModal(true);
    setOpenDropdown(null); // Close dropdown
    setDropdownPosition(null); // Reset position
  };

  const handleRefundSubmit = async () => {
    if (!selectedTransaction || !selectedTransaction.id) return;
    
    try {
      // Validate that there are items to refund
      const hasItemsToRefund = Object.values(refundItems).some(quantity => quantity > 0);
      if (!hasItemsToRefund) {
        alert('Please select at least one item to refund.');
        return;
      }

      // Validate refund quantities don't exceed available amounts
      const validationErrors: string[] = [];
      Object.entries(refundItems).forEach(([key, quantity]) => {
        if (quantity > 0) {
          const [, index] = key.split('___');
          const itemIndex = parseInt(index);
          const item = selectedTransaction.items[itemIndex];
          
          if (item && !isNaN(itemIndex) && itemIndex >= 0 && itemIndex < selectedTransaction.items.length) {
            // Calculate already refunded quantity for this item
            const alreadyRefunded = selectedTransaction.refunds?.reduce((total, refund) => {
              const refundItem = refund.items.find(ri => ri.itemIndex === itemIndex);
              return total + (refundItem?.quantity || 0);
            }, 0) || 0;
            
            const availableToRefund = item.quantity - alreadyRefunded;
            
            if (quantity > availableToRefund) {
              validationErrors.push(`${item.groupName}: Cannot refund ${quantity} items. Only ${availableToRefund} available.`);
            }
          }
        }
      });

      if (validationErrors.length > 0) {
        alert('Refund validation failed:\n\n' + validationErrors.join('\n'));
        return;
      }

      // Calculate total refund amount for display
      const refundAmount = Object.entries(refundItems).reduce((total, [key, quantity]) => {
        const [, index] = key.split('___');
        const itemIndex = parseInt(index);
        const item = selectedTransaction.items[itemIndex];
        if (!item || isNaN(itemIndex) || itemIndex < 0 || itemIndex >= selectedTransaction.items.length) {
          console.warn(`Invalid item index ${itemIndex} for key ${key}`);
          return total;
        }
        return total + (item.unitPrice * quantity);
      }, 0);

      // Process the refund through the service
      const refundId = await transactionService.processRefund(
        selectedTransaction.id,
        refundItems,
        selectedTransaction,
        'Manual refund processed by owner', // reason
        'Owner' // processedBy
      );

      alert(`Refund processed successfully!\nRefund ID: ${refundId}\nAmount: ${formatCurrency(refundAmount)}`);
      
      setShowRefundModal(false);
      setSelectedTransaction(null);
      setRefundItems({});
      loadTransactions(); // Reload to show updated data
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(`Error processing refund: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleCancelTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      // Validate that the transaction can be cancelled
      if (selectedTransaction.status === 'cancelled') {
        alert('This transaction is already cancelled.');
        return;
      }
      
      // Call the transaction service to cancel transaction with inventory restoration
      await transactionService.cancelTransaction(
        selectedTransaction.id!,
        selectedTransaction,
        'Transaction cancelled by owner',
        user?.email || 'Unknown user'
      );
      
      alert(`Transaction ${selectedTransaction.transactionId} has been cancelled successfully.\nInventory has been restored.`);
      
      setShowCancelModal(false);
      setSelectedTransaction(null);
      loadTransactions(); // Reload to show updated data
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to cancel transaction: ${errorMessage}. Please try again.`);
    }
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
          <p className="text-gray-600">View and manage all sales transactions</p>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
            <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(calculateNetRevenue(revenueTransactions))}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
            <p className="text-2xl font-bold text-blue-600">
              {completedTransactionsCount}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Average Order</h3>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                completedTransactionsCount > 0 
                  ? calculateNetRevenue(revenueTransactions) / completedTransactionsCount 
                  : 0
              )}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              aria-label="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending' | 'cancelled' | 'refunded' | 'partially_refunded')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>

            {/* Payment Method Filter */}
            <select
              aria-label="Filter by payment method"
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value as 'all' | 'cash' | 'scan' | 'wallet')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="scan">Scan Payment</option>
              <option value="wallet">Wallet</option>
            </select>

            {/* Date Range Filter */}
            <select
              aria-label="Filter by date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'today' | '7d' | '30d' | '90d' | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Export Button */}
            <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const hasRefunds = transaction.refunds && transaction.refunds.length > 0;
                    const isFullyRefunded = transaction.status === 'refunded';
                    const isPartiallyRefunded = transaction.status === 'partially_refunded';
                    
                    const rowClass = "hover:bg-gray-50";
                    
                    return (
                    <tr key={transaction.id} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.customer?.displayName || 'Guest'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.customer?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.items.reduce((total, item) => total + item.quantity, 0)} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(() => {
                          const refundedAmount = transaction.refunds?.reduce((sum, refund) => sum + refund.totalAmount, 0) || 0;
                          const netTotal = transaction.total - refundedAmount;
                          const subtotal = transaction.subtotal || (transaction.total - (transaction.tax || 0));
                          const tax = transaction.tax || 0;
                          
                          if (refundedAmount > 0) {
                            return (
                              <div className="flex flex-col group relative">
                                <span className="text-gray-900">{formatCurrency(netTotal)}</span>
                                <span className="text-xs text-gray-500">
                                  (Original: {formatCurrency(transaction.total)})
                                </span>
                                {/* Tooltip */}
                                <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg">
                                  <div>Subtotal: {formatCurrency(subtotal)}</div>
                                  <div>Tax: {formatCurrency(tax)}</div>
                                  <div className="border-t border-gray-600 pt-1 mt-1">
                                    <div>Total: {formatCurrency(transaction.total)}</div>
                                    <div>Refunded: -{formatCurrency(refundedAmount)}</div>
                                    <div className="font-semibold">Net: {formatCurrency(netTotal)}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="group relative">
                              <span className="cursor-help">{formatCurrency(transaction.total)}</span>
                              {/* Tooltip */}
                              <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg">
                                <div>Subtotal: {formatCurrency(subtotal)}</div>
                                <div>Tax: {formatCurrency(tax)}</div>
                                <div className="border-t border-gray-600 pt-1 mt-1 font-semibold">
                                  Total: {formatCurrency(transaction.total)}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.tax || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {transaction.paymentMethod}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(transaction.status)}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative">
                          <button
                            ref={(el) => {
                              if (el) buttonRefs.current[transaction.id as string] = el;
                            }}
                            onClick={() => toggleDropdown(transaction.id!)}
                            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Transaction actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refund Modal */}
        {showRefundModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-300/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Refund Items</h2>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close refund modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Transaction ID: {selectedTransaction.transactionId}
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> You can only refund up to the available quantity for each item. 
                    The system will automatically limit your input to prevent over-refunding.
                  </p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {selectedTransaction.items.map((item, index) => {
                    // Calculate already refunded quantity for this item
                    const alreadyRefunded = selectedTransaction.refunds?.reduce((total, refund) => {
                      const refundItem = refund.items.find(ri => ri.itemIndex === index);
                      return total + (refundItem?.quantity || 0);
                    }, 0) || 0;
                    
                    const availableToRefund = item.quantity - alreadyRefunded;
                    
                    return (
                      <div key={`${item.id}___${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.groupName}</h4>
                          <p className="text-sm text-gray-600">
                            {item.selectedColor && `Color: ${item.selectedColor}`} {item.selectedSize && `Size: ${item.selectedSize}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Price: {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                          {alreadyRefunded > 0 && (
                            <p className="text-sm text-orange-600">
                              Already refunded: {alreadyRefunded}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Refund Qty:</label>
                          <div className="flex flex-col items-center">
                            <input
                              aria-label={`Refund quantity for ${item.groupName}`}
                              type="number"
                              min="0"
                              max={availableToRefund}
                              value={refundItems[`${item.id}___${index}`] || 0}
                              onChange={(e) => {
                                const inputValue = parseInt(e.target.value) || 0;
                                const validatedValue = Math.min(Math.max(inputValue, 0), availableToRefund);
                                setRefundItems(prev => ({
                                  ...prev,
                                  [`${item.id}___${index}`]: validatedValue
                                }));
                              }}
                              onBlur={(e) => {
                                // Additional validation on blur to ensure value is within bounds
                                const inputValue = parseInt(e.target.value) || 0;
                                if (inputValue > availableToRefund) {
                                  setRefundItems(prev => ({
                                    ...prev,
                                    [`${item.id}___${index}`]: availableToRefund
                                  }));
                                }
                              }}
                              className={`w-20 px-2 py-1 border rounded text-center text-gray-900 ${
                                (refundItems[`${item.id}___${index}`] || 0) > availableToRefund 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300 bg-white'
                              }`}
                              disabled={availableToRefund <= 0}
                              placeholder="0"
                            />
                            {(refundItems[`${item.id}___${index}`] || 0) > availableToRefund && (
                              <span className="text-xs text-red-500 mt-1">Max: {availableToRefund}</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">/ {availableToRefund}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  {(() => {
                    // Calculate refund breakdown
                    const totalItemRefundAmount = Object.entries(refundItems).reduce((total, [key, quantity]) => {
                      const [, index] = key.split('___');
                      const itemIndex = parseInt(index);
                      const item = selectedTransaction.items[itemIndex];
                      if (!item || isNaN(itemIndex) || itemIndex < 0 || itemIndex >= selectedTransaction.items.length) {
                        console.warn(`Invalid item index ${itemIndex} for key ${key}`);
                        return total;
                      }
                      return total + (item.unitPrice * quantity);
                    }, 0);

                    const transactionSubtotal = selectedTransaction.subtotal || 0;
                    const transactionCartDiscount = selectedTransaction.discount || 0;
                    
                    let totalProportionalCartDiscount = 0;
                    let cartDiscountRate = 0;
                    if (transactionCartDiscount > 0 && transactionSubtotal > 0) {
                      cartDiscountRate = transactionCartDiscount / transactionSubtotal;
                      totalProportionalCartDiscount = totalItemRefundAmount * cartDiscountRate;
                    }

                    const finalRefundAmount = totalItemRefundAmount - totalProportionalCartDiscount;

                    return (
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-900 text-lg">Refund Calculation</h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items Subtotal:</span>
                            <span className="text-gray-900">{formatCurrency(totalItemRefundAmount)}</span>
                          </div>
                          
                          {transactionCartDiscount > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Cart Discount ({(cartDiscountRate * 100).toFixed(1)}%):
                                </span>
                                <span className="text-orange-600">-{formatCurrency(totalProportionalCartDiscount)}</span>
                              </div>
                              <div className="border-t border-gray-200 pt-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Original transaction had {formatCurrency(transactionCartDiscount)} cart discount</span>
                                </div>
                              </div>
                            </>
                          )}
                          
                          <div className="border-t border-gray-300 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">Total Refund Amount:</span>
                              <span className="text-xl font-bold text-blue-600">
                                {formatCurrency(finalRefundAmount)}
                              </span>
                            </div>
                          </div>
                          
                          {transactionCartDiscount > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                              <div className="flex items-start">
                                <div className="text-amber-600 mr-2">ℹ️</div>
                                <div className="text-xs text-amber-800">
                                  <strong>Note:</strong> The cart discount is proportionally reduced from the refund amount. 
                                  Tax is not refunded as per store policy.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefundSubmit}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Process Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Transaction Modal */}
        {showCancelModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 w-full max-w-md mx-4">
              <div className="p-6 border-b border-gray-300/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Cancel Transaction</h2>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close cancel transaction modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">Are you sure?</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Transaction ID:</p>
                  <p className="font-medium text-gray-900">{selectedTransaction.transactionId}</p>
                  <p className="text-sm text-gray-600 mt-2">Total Amount:</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedTransaction.total)}</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Keep Transaction
                  </button>
                  <button
                    onClick={handleCancelTransaction}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        {showViewDetailsModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-300/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
                  <button
                    onClick={() => setShowViewDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close transaction details modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Transaction ID: {selectedTransaction.transactionId}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Transaction Info */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Transaction ID:</span>
                          <span className="text-sm font-medium text-gray-900">{selectedTransaction.transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={getStatusBadge(selectedTransaction.status)}>
                            {getStatusText(selectedTransaction.status)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-sm font-medium text-gray-900">{formatDate(selectedTransaction.timestamp)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Method:</span>
                          <div className="flex items-center">
                            {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                              {selectedTransaction.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedTransaction.customer?.displayName || 'Guest'}
                          </span>
                        </div>
                        {selectedTransaction.customer?.email && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium text-gray-900">{selectedTransaction.customer.email}</span>
                          </div>
                        )}
                        {selectedTransaction.customer?.customerType && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {selectedTransaction.customer.customerType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedTransaction.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tax:</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedTransaction.tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Discount:</span>
                          <span className="text-sm font-medium text-gray-900">-{formatCurrency(selectedTransaction.discount)}</span>
                        </div>
                        <div className="border-t border-gray-300 pt-3">
                          <div className="flex justify-between">
                            <span className="text-base font-medium text-gray-900">Total:</span>
                            <span className="text-base font-bold text-gray-900">{formatCurrency(selectedTransaction.total)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount Paid:</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedTransaction.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Change:</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedTransaction.change)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Items */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Items ({selectedTransaction.items.reduce((total, item) => total + item.quantity, 0)} items)
                      </h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedTransaction.items.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start space-x-4">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.groupName}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {item.groupName}
                                </h4>
                                <div className="mt-1 flex items-center space-x-4">
                                  {item.selectedColor && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Color:</span>
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{ backgroundColor: item.colorCode || '#ef4444' }}
                                      />
                                      <span className="text-xs text-gray-700">{item.selectedColor}</span>
                                    </div>
                                  )}
                                  {item.selectedSize && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Size:</span>
                                      <span className="text-xs text-gray-700">{item.selectedSize}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">Qty:</span>
                                    <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatCurrency(item.unitPrice * item.quantity)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatCurrency(item.unitPrice)} each
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refunds Section (if any) */}
                    {selectedTransaction.refunds && selectedTransaction.refunds.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Refunds</h3>
                        <div className="space-y-3">
                          {selectedTransaction.refunds.map((refund, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Refund #{refund.refundId}</p>
                                  <p className="text-xs text-gray-500">
                                    {refund.createdAt ? formatDate(refund.createdAt.toDate().toISOString()) : 'N/A'}
                                  </p>
                                  {refund.reason && (
                                    <p className="text-xs text-gray-600 mt-1">Reason: {refund.reason}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-orange-600">
                                    -{formatCurrency(refund.totalAmount)}
                                  </p>
                                  <p className="text-xs text-gray-500 capitalize">{refund.status}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancellation Info (if cancelled) */}
                    {selectedTransaction.status === 'cancelled' && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cancellation Details</h3>
                        <div className="space-y-2">
                          {selectedTransaction.cancelledAt && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Cancelled At:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(selectedTransaction.cancelledAt.toDate().toISOString())}
                              </span>
                            </div>
                          )}
                          {selectedTransaction.cancelReason && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Reason:</span>
                              <span className="text-sm font-medium text-gray-900">{selectedTransaction.cancelReason}</span>
                            </div>
                          )}
                          {selectedTransaction.cancelledBy && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Cancelled By:</span>
                              <span className="text-sm font-medium text-gray-900">{selectedTransaction.cancelledBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowViewDetailsModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portal-based dropdown */}
        {openDropdown && dropdownPosition && typeof window !== 'undefined' && createPortal(
          <div 
            data-dropdown-menu
            className="fixed w-48 bg-white rounded-md shadow-xl border border-gray-200 z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  const transaction = transactions.find(t => t.id === openDropdown);
                  if (transaction) handleViewClick(transaction);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Eye className="h-4 w-4 mr-3" />
                View Details
              </button>
              
              {(() => {
                const transaction = transactions.find(t => t.id === openDropdown);
                return (transaction?.status === 'completed' || transaction?.status === 'partially_refunded') && (
                  <button
                    onClick={() => {
                      if (transaction) handleRefundClick(transaction);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-3" />
                    {transaction?.status === 'partially_refunded' ? 'Refund More' : 'Refund Quantity'}
                  </button>
                );
              })()}
              
              {(() => {
                const transaction = transactions.find(t => t.id === openDropdown);
                return transaction?.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      if (transaction) handleCancelClick(transaction);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-4 w-4 mr-3" />
                    Cancel Checkout
                  </button>
                );
              })()}
            </div>
          </div>,
          document.body
        )}
          </div>
        </main>
      </div>
    </div>
  );
}