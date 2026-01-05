"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { transactionService, Transaction } from "@/services/transactionService";
import { ShopService } from "@/services/shopService";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import {
  CreditCard,
  Smartphone,
  Wallet,
  DollarSign,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Truck,
} from "lucide-react";

interface PaymentStats {
  totalAmount: number;
  totalProfit: number;
  totalCount: number;
  successfulPayments: number;
  cancelledPayments: number;
  refundPayments: number;
  partialRefundPayments: number;
  cashPayments: { count: number; amount: number };
  scanPayments: { count: number; amount: number };
  walletPayments: { count: number; amount: number };
  codPayments: { count: number; amount: number };
}

function PaymentsPageContent() {
  const { formatPrice } = useCurrency();
  const { businessSettings } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [filterMethod, setFilterMethod] = useState<
    "all" | "cash" | "scan" | "wallet" | "cod"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending" | "failed"
  >("all");
  const [dateRange, setDateRange] = useState<
    "today" | "7d" | "30d" | "90d" | "all"
  >("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactions();

      // Filter by date range
      let filteredData = data;

      if (dateRange !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        filteredData = data.filter((t) => new Date(t.timestamp) >= startDate);
      }

      // Filter by branch
      if (filterBranch && filterBranch !== "all") {
        filteredData = filteredData.filter(
          (t) => t.branchName === filterBranch
        );
      }

      setTransactions(filteredData);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterBranch]);

  // Load shops and set initial branch filter
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopsData = await ShopService.getAllShops();
        setShops(shopsData || []);
      } catch (error) {
        console.error("Error fetching shops:", error);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    if (businessSettings?.currentBranch && filterBranch === "") {
      setFilterBranch(businessSettings.currentBranch);
    }
  }, [businessSettings, filterBranch]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const calculatePaymentStats = (): PaymentStats => {
    const stats: PaymentStats = {
      totalAmount: 0,
      totalProfit: 0,
      totalCount: transactions.length,
      successfulPayments: 0,
      cancelledPayments: 0,
      refundPayments: 0,
      partialRefundPayments: 0,
      cashPayments: { count: 0, amount: 0 },
      scanPayments: { count: 0, amount: 0 },
      walletPayments: { count: 0, amount: 0 },
      codPayments: { count: 0, amount: 0 },
    };

    transactions.forEach((transaction) => {
      // Calculate net amount after refunds only for revenue-generating transactions
      const totalRefunded =
        transaction.refunds?.reduce(
          (sum, refund) => sum + refund.totalAmount,
          0
        ) || 0;
      const netAmount = Math.max(0, transaction.total - totalRefunded);

      // Only add to total sales if transaction is completed, partially_refunded, or refunded
      // Exclude pending COD transactions
      if (
        (transaction.status === "completed" ||
          transaction.status === "partially_refunded" ||
          transaction.status === "refunded") &&
        transaction.paymentMethod !== "cod"
      ) {
        stats.totalAmount += netAmount;

        // Calculate profit for this transaction
        const transactionProfit = transaction.items.reduce(
          (itemTotal, item) => {
            const profitPerItem =
              (item.unitPrice - item.originalPrice) * item.quantity;
            console.log(
              "Payment - Item:",
              item.groupName,
              "Original:",
              item.originalPrice,
              "Unit:",
              item.unitPrice,
              "Qty:",
              item.quantity,
              "Profit:",
              profitPerItem
            );
            return itemTotal + profitPerItem;
          },
          0
        );

        // Subtract refunded profit
        const refundedProfit =
          transaction.refunds?.reduce((refundTotal, refund) => {
            return (
              refundTotal +
              refund.items.reduce((refundItemTotal, refundItem) => {
                const originalItem = transaction.items[refundItem.itemIndex];
                if (originalItem) {
                  const refundedProfitPerItem =
                    (originalItem.unitPrice - originalItem.originalPrice) *
                    refundItem.quantity;
                  return refundItemTotal + refundedProfitPerItem;
                }
                return refundItemTotal;
              }, 0)
            );
          }, 0) || 0;

        stats.totalProfit += Math.max(0, transactionProfit - refundedProfit);
      }

      // Status counts
      switch (transaction.status) {
        case "completed":
          stats.successfulPayments++;
          break;
        case "refunded":
          stats.refundPayments++;
          break;
        case "partially_refunded":
          stats.partialRefundPayments++;
          break;
        case "pending":
          // Count pending as successful since payment was processed
          stats.successfulPayments++;
          break;
        case "cancelled":
          stats.cancelledPayments++;
          break;
      }

      // Payment method breakdown (using net amounts after refunds, only for revenue-generating transactions)
      if (
        transaction.status === "completed" ||
        transaction.status === "partially_refunded" ||
        transaction.status === "refunded"
      ) {
        switch (transaction.paymentMethod) {
          case "cash":
            stats.cashPayments.count++;
            stats.cashPayments.amount += netAmount;
            break;
          case "scan":
            stats.scanPayments.count++;
            stats.scanPayments.amount += netAmount;
            break;
          case "wallet":
            stats.walletPayments.count++;
            stats.walletPayments.amount += netAmount;
            break;
          case "cod":
            stats.codPayments.count++;
            stats.codPayments.amount += netAmount;
            break;
        }
      }
    });

    return stats;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.customer?.displayName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesMethod =
      filterMethod === "all" || transaction.paymentMethod === filterMethod;
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const paymentStats = calculatePaymentStats();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <DollarSign className="h-5 w-5" />;
      case "scan":
        return <Smartphone className="h-5 w-5" />;
      case "wallet":
        return <Wallet className="h-5 w-5" />;
      case "cod":
        return <Truck className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "failed":
      case "cancelled":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeItem="payments"
        onItemClick={() => {}}
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Payment Management
                </h1>
                <p className="text-gray-600">
                  Monitor and manage all payment transactions
                </p>
              </div>
              <div className="flex space-x-4">
                <select
                  title="Filter by Date Range"
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(
                      e.target.value as "today" | "7d" | "30d" | "90d" | "all"
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All Time</option>
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Payment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Sales
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(paymentStats.totalAmount)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +12.5% from last period
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Profit
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(paymentStats.totalProfit)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">
                    Margin:{" "}
                    {paymentStats.totalAmount > 0
                      ? (
                          (paymentStats.totalProfit /
                            paymentStats.totalAmount) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Successful Payments
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {paymentStats.successfulPayments}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">
                    {paymentStats.totalCount > 0
                      ? (
                          (paymentStats.successfulPayments /
                            paymentStats.totalCount) *
                          100
                        ).toFixed(1)
                      : 0}
                    % success rate
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Refund Payments
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {paymentStats.refundPayments}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <XCircle className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">
                    {paymentStats.totalCount > 0
                      ? (
                          (paymentStats.refundPayments /
                            paymentStats.totalCount) *
                          100
                        ).toFixed(1)
                      : 0}
                    % of total
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Partial Refunds
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {paymentStats.partialRefundPayments}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">
                    {paymentStats.totalCount > 0
                      ? (
                          (paymentStats.partialRefundPayments /
                            paymentStats.totalCount) *
                          100
                        ).toFixed(1)
                      : 0}
                    % of total
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Cancelled Payments
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {paymentStats.cancelledPayments}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">
                    {paymentStats.totalCount > 0
                      ? (
                          (paymentStats.cancelledPayments /
                            paymentStats.totalCount) *
                          100
                        ).toFixed(1)
                      : 0}
                    % of total
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Methods Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Cash Payments
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(paymentStats.cashPayments.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {paymentStats.cashPayments.count} transactions
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Scan Payments
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(paymentStats.scanPayments.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {paymentStats.scanPayments.count} transactions
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Wallet Payments
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(paymentStats.walletPayments.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {paymentStats.walletPayments.count} transactions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Transactions
                  </h2>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>

                    <select
                      value={filterMethod}
                      onChange={(e) => setFilterMethod(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Methods</option>
                      <option value="cash">Cash</option>
                      <option value="scan">Scan</option>
                      <option value="wallet">Wallet</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cash Payments
                  </h3>
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Count:</span>
                    <span className="text-sm font-medium">
                      {paymentStats.cashPayments.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium">
                      {formatPrice(paymentStats.cashPayments.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Scan Payments
                  </h3>
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Count:</span>
                    <span className="text-sm font-medium">
                      {paymentStats.scanPayments.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium">
                      {formatPrice(paymentStats.scanPayments.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Wallet Payments
                  </h3>
                  <Wallet className="h-6 w-6 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Count:</span>
                    <span className="text-sm font-medium">
                      {paymentStats.walletPayments.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium">
                      {formatPrice(paymentStats.walletPayments.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  title="Filter by Payment Method"
                  value={filterMethod}
                  onChange={(e) =>
                    setFilterMethod(
                      e.target.value as
                        | "all"
                        | "cash"
                        | "scan"
                        | "wallet"
                        | "cod"
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash</option>
                  <option value="scan">Scan Payment</option>
                  <option value="wallet">Wallet</option>
                  <option value="cod">COD</option>
                </select>

                <select
                  title="Filter by Status"
                  value={filterStatus}
                  aria-label="Filter by branch"
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Branches</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.name}>
                      {shop.name}
                    </option>
                  ))}
                </select>

                <select
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as
                        | "all"
                        | "completed"
                        | "pending"
                        | "failed"
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading payments...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No payments found</p>
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
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selling Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount (THB)
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.transactionId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transaction.customer?.displayName ||
                                "Walk-in customer"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.customer?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.branchName || "Main Branch"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.sellingCurrency &&
                            transaction.exchangeRate &&
                            transaction.sellingTotal ? (
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {transaction.sellingCurrency === "MMK"
                                    ? "Ks"
                                    : transaction.sellingCurrency}{" "}
                                  {transaction.sellingTotal.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Rate: 1 THB = {transaction.exchangeRate}{" "}
                                  {transaction.sellingCurrency === "MMK"
                                    ? "Ks"
                                    : transaction.sellingCurrency}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(transaction.total)}
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
                            <div className="flex items-center">
                              {getStatusIcon(transaction.status)}
                              <span
                                className={`ml-2 ${getStatusBadge(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <PaymentsPageContent />
    </ProtectedRoute>
  );
}
