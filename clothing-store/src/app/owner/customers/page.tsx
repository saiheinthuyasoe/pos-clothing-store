"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users,
  Store,
  Building2,
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  Customer,
  CustomerStats,
  CustomerListResponse,
  CustomerStatsResponse,
  CreateCustomerRequest,
} from "@/types/customer";
import NewCustomerModal from "@/components/customers/NewCustomerModal";
import { DeleteConfirmationModal } from "@/components/customers/DeleteConfirmationModal";

function CustomerPageContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    retailerCustomers: 0,
    wholesalerCustomers: 0,
    totalReceivables: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setError(null);

      const response = await fetch("/api/customers");
      const data: CustomerListResponse = await response.json();

      if (data.success && data.data) {
        setCustomers(data.data);
      } else {
        setError(data.error || "Failed to fetch customers");
      }
    } catch (err) {
      setError("Failed to fetch customers");
      console.error("Error fetching customers:", err);
    }
  };

  // Fetch customer statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/customers/stats");
      const data: CustomerStatsResponse = await response.json();

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        console.error("Failed to fetch customer stats:", data.error);
      }
    } catch (err) {
      console.error("Error fetching customer stats:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCustomers(), fetchStats()]);
      setIsLoading(false);
    };

    loadData();
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
        
        // Check if click is inside the dropdown menu
        const isInsideDropdown = target.closest('[data-dropdown-menu]');
        
        // Close dropdown only if click is outside both button and dropdown
        if (!isDropdownButton && !isInsideDropdown) {
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

  // Handle dropdown toggle with position calculation
  const handleDropdownToggle = (customerId: string) => {
    if (openDropdown === customerId) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[customerId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right + window.scrollX
        });
      }
      setOpenDropdown(customerId);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCustomers(), fetchStats()]);
    setIsRefreshing(false);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  // Handle delete customer - open modal
  const handleDeleteCustomer = (customer: Customer) => {
    setDeletingCustomer(customer);
    setShowDeleteModal(true);
    setDeleteError(null);
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/customers/${deletingCustomer.uid}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Show success message
        setSuccessMessage(
          `Customer "${deletingCustomer.displayName || deletingCustomer.email}" has been deleted successfully.`
        );

        // Refresh the customer list
        await fetchCustomers();
        await fetchStats();
        setShowDeleteModal(false);
        setDeletingCustomer(null);

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setDeleteError('Failed to delete customer');
      }
    } catch (err) {
      setDeleteError('Failed to delete customer');
      console.error('Error deleting customer:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete customer
  const cancelDeleteCustomer = () => {
    setShowDeleteModal(false);
    setDeletingCustomer(null);
    setDeleteError(null);
    setIsDeleting(false);
  };

  const handleSubmitCustomer = async (customerData: CreateCustomerRequest) => {
    try {
      if (editingCustomer) {
        // Update existing customer
        const response = await fetch(`/api/customers/${editingCustomer.uid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerData),
        });

        if (!response.ok) {
          throw new Error("Failed to update customer");
        }

        const result = await response.json();

        if (result.success) {
          // Update the customer in the list
          setCustomers((prev) =>
            prev.map((customer) =>
              customer.uid === editingCustomer.uid ? result.data : customer
            )
          );
          
          // Refresh stats to ensure accuracy
          await fetchStats();
        }
      } else {
        // Create new customer
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerData),
        });

        if (!response.ok) {
          throw new Error("Failed to create customer");
        }

        const result = await response.json();

        if (result.success) {
          // Add the new customer to the list
          setCustomers((prev) => [result.data, ...prev]);

          // Update stats
          setStats((prev) => ({
            ...prev,
            totalCustomers: prev.totalCustomers + 1,
            retailerCustomers:
              result.data.customerType === "retailer"
                ? prev.retailerCustomers + 1
                : prev.retailerCustomers,
            wholesalerCustomers:
              result.data.customerType === "wholesaler"
                ? prev.wholesalerCustomers + 1
                : prev.wholesalerCustomers,
          }));
        }
      }
      
      // Reset editing state
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error submitting customer:", error);
      throw error;
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute requiredRole="owner">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavBar />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Customers
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your customer database and relationships
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                  <Button
                    className="flex items-center"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Customer
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Customers */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Customers
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.totalCustomers}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Retailer */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Store className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Retailer
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.retailerCustomers}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wholesaler */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Wholesaler
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.wholesalerCustomers}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receivables */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Receivables
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(stats.totalReceivables)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">
                      Loading customers...
                    </span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-12">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <span className="ml-2 text-red-600">{error}</span>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No customers found
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchTerm
                        ? "No customers match your search criteria."
                        : "Get started by adding your first customer."}
                    </p>
                    <Button
                      className="mt-4 flex items-center"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Spent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receivables
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.uid} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-15 w-15">
                                  {customer.customerImage ? (
                                    <img
                                      className="h-15 w-15 rounded-full object-cover"
                                      src={customer.customerImage}
                                      alt={customer.displayName || customer.email}
                                      onError={(e) => {
                                        // Fallback to default avatar if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`h-15 w-15 rounded-full bg-gray-200 flex items-center justify-center ${customer.customerImage ? 'hidden' : ''}`}>
                                    <User className="h-6 w-6 text-gray-500" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {customer.displayName || "No Name"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {customer.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  customer.customerType === "wholesaler"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {customer.customerType || "Retailer"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1">
                                {customer.phone && (
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 text-gray-400 mr-1" />
                                    {customer.phone}
                                  </div>
                                )}
                                {customer.address && (
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                    {customer.address}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(customer.totalSpent || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(customer.receivables || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(customer.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative">
                                <button
                                  ref={(el) => {
                                    buttonRefs.current[customer.uid] = el;
                                  }}
                                  onClick={() => handleDropdownToggle(customer.uid)}
                                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                  aria-label="Customer actions"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-500" />
                                </button>

                              </div>
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
                const customer = customers.find(c => c.uid === openDropdown);
                if (customer) handleEditCustomer(customer);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </button>
            <button
              onClick={() => {
                const customer = customers.find(c => c.uid === openDropdown);
                if (customer) handleDeleteCustomer(customer);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Customer
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                title="Close success message"
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmitCustomer}
        customer={editingCustomer ?? undefined}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        customer={deletingCustomer}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={confirmDeleteCustomer}
        onCancel={cancelDeleteCustomer}
      />
    </ProtectedRoute>
  );
}

export default function CustomerPage() {
  return <CustomerPageContent />;
}
