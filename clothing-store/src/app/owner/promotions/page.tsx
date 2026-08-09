"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Promotion,
  PromotionDiscountType,
  PromotionScope,
} from "@/types/promotion";
import { StockItem } from "@/types/stock";
import { Trash2 } from "lucide-react";

function PromotionsContent() {
  const [activeMenuItem, setActiveMenuItem] = useState("promotions");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [scope, setScope] = useState<PromotionScope>("group");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [discountType, setDiscountType] =
    useState<PromotionDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [stocksRes, promotionsRes] = await Promise.all([
        fetch("/api/stocks"),
        fetch("/api/promotions"),
      ]);

      const stocksData = await stocksRes.json();
      const promotionsData = await promotionsRes.json();

      if (stocksData.success) setStocks(stocksData.data || []);
      if (promotionsData.success) setPromotions(promotionsData.data || []);
    } catch (error) {
      console.error("Error fetching promotions data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset the target selection when the scope changes
  useEffect(() => {
    setSelectedTarget("");
  }, [scope]);

  const groupOptions = useMemo(
    () =>
      stocks.map((s) => ({
        key: s.id,
        value: s.id,
        label: s.groupName,
      })),
    [stocks],
  );

  const variantOptions = useMemo(
    () =>
      stocks.flatMap((s) =>
        (s.colorVariants || [])
          .filter((v) => !!v.id)
          .map((v, idx) => ({
            key: `${s.id}-${v.id}-${idx}`,
            value: `${s.id}::${v.id}`,
            label: `${s.groupName} / ${v.color}`,
          })),
      ),
    [stocks],
  );

  const resetForm = () => {
    setName("");
    setScope("group");
    setSelectedTarget("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxDiscountAmount("");
    setStartDate("");
    setEndDate("");
    setDescription("");
  };

  const handleCreatePromotion = async () => {
    if (!name.trim()) {
      toast.error("Promotion name is required");
      return;
    }
    if (!selectedTarget) {
      toast.error(
        scope === "group"
          ? "Please select a product group"
          : "Please select a variant",
      );
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }
    if (discountType === "percentage" && parseFloat(discountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after the start date");
      return;
    }

    let stockId = selectedTarget;
    let variantId: string | undefined;
    if (scope === "variant") {
      const [sId, vId] = selectedTarget.split("::");
      stockId = sId;
      variantId = vId;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scope,
          stockId,
          variantId,
          discountType,
          discountValue,
          maxDiscountAmount: maxDiscountAmount || undefined,
          startDate,
          endDate,
          description,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create promotion");
      }

      toast.success("Promotion created successfully");
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating promotion:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create promotion",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      setTogglingId(promotion.id);
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promotion.isActive }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update promotion");
      }
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promotion.id ? { ...p, isActive: !promotion.isActive } : p,
        ),
      );
      toast.success(
        !promotion.isActive ? "Promotion enabled" : "Promotion disabled",
      );
    } catch (error) {
      console.error("Error updating promotion:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update promotion",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeletePromotion = async (promotion: Promotion) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${promotion.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(promotion.id);
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete promotion");
      }
      setPromotions((prev) => prev.filter((p) => p.id !== promotion.id));
      toast.success("Promotion deleted");
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete promotion",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}%`;
    }
    return `THB ${Number(promotion.discountValue).toFixed(2)}`;
  };

  const formatTarget = (promotion: Promotion) => {
    if (promotion.scope === "variant") {
      return `${promotion.stockName} / ${promotion.variantColor || "—"}`;
    }
    return promotion.stockName;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeItem={activeMenuItem}
          onItemClick={(item) => setActiveMenuItem(item.id)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="h-screen"
        />
      </div>

      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        <Sidebar
          activeItem={activeMenuItem}
          onItemClick={(item) => {
            setActiveMenuItem(item.id);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={false}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <TopNavBar
          onCartModalStateChange={() => {}}
          onMenuToggle={() => setIsMobileSidebarOpen((s) => !s)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Online Promotions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create targeted discounts for product groups or variants.
              </p>
            </div>

            {/* Create Promotion Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Create Promotion
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Promotion name"
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                />

                <select
                  title="Promotion scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as PromotionScope)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="group">Group Promotion</option>
                  <option value="variant">Variant Promotion</option>
                </select>

                <SearchableSelect
                  options={scope === "group" ? groupOptions : variantOptions}
                  value={selectedTarget}
                  onChange={setSelectedTarget}
                  placeholder={
                    scope === "group"
                      ? "Select product group"
                      : "Select variant"
                  }
                  emptyMessage={
                    scope === "group"
                      ? "No product groups found"
                      : "No variants found"
                  }
                />

                <select
                  title="Discount type"
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as PromotionDiscountType)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={
                    discountType === "percentage"
                      ? "Discount %"
                      : "Discount Amount (THB)"
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                />

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  disabled={discountType === "fixed"}
                  placeholder="Max discount THB (optional)"
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                />

                <input
                  type="date"
                  title="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                />

                <input
                  type="date"
                  title="End date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                />

                <div />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 md:col-span-3"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleCreatePromotion} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Promotion"}
                </Button>
              </div>
            </div>

            {/* Existing Promotions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Existing Promotions
              </h2>

              {loading ? (
                <div className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading promotions...
                    </span>
                  </div>
                </div>
              ) : promotions.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No promotions yet. Create one above to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="py-3 pr-3 text-left text-sm font-semibold text-gray-900">
                          Name
                        </th>
                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                          Scope
                        </th>
                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                          Target
                        </th>
                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                          Discount
                        </th>
                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-3 py-3 text-right text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {promotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-50">
                          <td className="py-3 pr-3 text-sm text-gray-900">
                            {promotion.name}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700 capitalize">
                            {promotion.scope}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            {formatTarget(promotion)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            {formatDiscount(promotion)}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                promotion.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {promotion.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(promotion)}
                              disabled={togglingId === promotion.id}
                              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              {promotion.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDeletePromotion(promotion)}
                              disabled={deletingId === promotion.id}
                              className="px-3 py-1.5 border border-red-300 rounded-md text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 inline-flex items-center"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </button>
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

export default function PromotionsPage() {
  return (
    <ProtectedRoute requiredRole={["owner", "manager"]}>
      <PromotionsContent />
    </ProtectedRoute>
  );
}
