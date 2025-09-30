"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Palette,
  Ruler,
  AlertTriangle,
  X,
} from "lucide-react";
import { StockItem, StockGroupDisplay } from "@/types/stock";
import { StockDisplayService } from "@/services/stockDisplayService";
import { SettingsService } from "@/services/settingsService";

function InventoryStocksContent() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("inventory");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // API state
  const [stockGroups, setStockGroups] = useState<StockGroupDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<StockGroupDisplay | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Success/Error feedback state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Currency state
  const [defaultCurrency, setDefaultCurrency] = useState<'THB' | 'MMK'>('THB');

  // Fetch stocks from API
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both stocks and currency settings
        const [stocksResponse, settings] = await Promise.all([
          fetch("/api/stocks"),
          SettingsService.getBusinessSettings()
        ]);

        if (!stocksResponse.ok) {
          throw new Error("Failed to fetch stocks");
        }

        const stocksData = await stocksResponse.json();

        if (!stocksData.success || !stocksData.data) {
          throw new Error(stocksData.error || "Invalid response format");
        }

        // Set currency from settings
        const currency = (settings?.defaultCurrency as 'THB' | 'MMK') || 'THB';
        setDefaultCurrency(currency);

        // Transform API data using the display service with currency
        const transformedGroups = StockDisplayService.transformStocksForDisplay(
          stocksData.data,
          currency
        );
        setStockGroups(transformedGroups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stocks");
        console.error("Error fetching stocks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter groups based on search term
  const filteredGroups = stockGroups.filter(
    (group) =>
      group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.groupId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.variants.some(
        (variant) =>
          variant.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
          variant.sizes.some((size) =>
            size.size.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          variant.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const totalPages = Math.ceil(filteredGroups.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentGroups = filteredGroups.slice(startIndex, endIndex);

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle edit navigation
  const handleEditGroup = (group: StockGroupDisplay) => {
    // Navigate to edit page with the group ID
    router.push(`/owner/inventory/stocks/edit/${group.groupId}`);
  };

  // Handle delete confirmation
  const handleDeleteGroup = (group: StockGroupDisplay) => {
    setDeletingGroup(group);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  // Confirm delete operation
  const confirmDelete = async () => {
    if (!deletingGroup) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/stocks/${deletingGroup.groupId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete stock item");
      }

      // Remove the deleted group from the state
      setStockGroups((prevGroups) =>
        prevGroups.filter((group) => group.groupId !== deletingGroup.groupId)
      );

      // Show success message
      setSuccessMessage(
        `Stock group "${deletingGroup.groupName}" has been deleted successfully.`
      );

      // Close modal
      setShowDeleteModal(false);
      setDeletingGroup(null);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error deleting stock:", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete stock item"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingGroup(null);
    setDeleteError(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeItem={activeItem}
        onItemClick={(item) => setActiveItem(item.id)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCartModalOpen={isCartModalOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <TopNavBar onCartModalStateChange={setIsCartModalOpen} />

        {/* Page Title */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Inventory Stocks
          </h1>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Controls */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by Group, Item ID, Barcode, Color, or Shop..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-80"
                  />
                </div>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  className="flex items-center"
                  onClick={() =>
                    router.push("/owner/inventory/stocks/new-stock")
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Stock
                </Button>
              </div>
            </div>

            {/* Stock Groups Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading stocks...
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-red-600">
                    <p className="font-medium">Error loading stocks</p>
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  </div>
                </div>
              ) : currentGroups.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="font-medium">No stocks found</p>
                    <p className="text-sm mt-1">
                      {searchTerm
                        ? "Try adjusting your search criteria"
                        : "Start by adding your first stock item"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {currentGroups.map((group) => (
                    <div key={group.groupId} className="p-6">
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={group.groupImage}
                              alt={group.groupName}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {group.groupName}
                              </h3>
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                ID: {group.groupId}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Package className="h-4 w-4 mr-1" />
                                {group.totalQuantity} items
                              </span>
                              <span className="flex items-center">
                                <Palette className="h-4 w-4 mr-1" />
                                {group.variants.length} colors
                              </span>
                              <span className="flex items-center">
                                <Ruler className="h-4 w-4 mr-1" />
                                {group.sizeSummary}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {group.formattedPrice}
                            </p>
                            <p className="text-sm text-gray-600">
                              {group.formattedReleaseDate}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditGroup(group)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit stock group"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete stock group"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                toggleGroupExpansion(group.groupId)
                              }
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expandedGroups.has(group.groupId) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Variants Display */}
                      {expandedGroups.has(group.groupId) && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Color Variants
                          </h4>
                          <div className="space-y-3">
                            {group.variants.map((variant, variantIndex) => (
                              <div
                                key={variantIndex}
                                className="bg-white rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-300">
                                      <Image
                                        src={variant.image || group.groupImage}
                                        alt={`${group.groupName} - ${variant.color}`}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    </div>
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                                      style={variant.colorStyle}
                                    ></div>
                                    <span className="font-medium text-gray-900">
                                      {variant.color}
                                    </span>
                                    {variant.barcode && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {variant.barcode}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Size Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                  {variant.sizes.map((sizeInfo, sizeIndex) => (
                                    <div
                                      key={sizeIndex}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                    >
                                      <span className="text-sm font-medium text-gray-700">
                                        {sizeInfo.size}
                                      </span>
                                      <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                          sizeInfo.quantity > 10
                                            ? "bg-green-100 text-green-800"
                                            : sizeInfo.quantity > 0
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {sizeInfo.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-700">Rows per page:</p>
                    <select
                      title="Select number of rows per page"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <p className="text-sm text-gray-700">
                      Showing {startIndex + 1}–
                      {Math.min(endIndex, filteredGroups.length)} of{" "}
                      {filteredGroups.length} stock groups
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        title="Go to previous page"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        title="Go to next page"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={cancelDelete}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Stock Group
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the stock group &quot;
                        {deletingGroup.groupName}&quot;? This action cannot be
                        undone and will remove all {deletingGroup.totalQuantity}{" "}
                        items across {deletingGroup.variants.length} color
                        variants.
                      </p>
                    </div>
                    {deleteError && (
                      <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {deleteError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryStocksPage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <InventoryStocksContent />
    </ProtectedRoute>
  );
}
