"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ArrowLeft, Plus, DollarSign, X } from "lucide-react";
import {
  WholesaleTier,
  ColorVariant,
  CreateStockRequest,
  SizeQuantity,
} from "@/types/stock";
import { Shop, ShopListResponse } from "@/types/shop";
import { SettingsService } from "@/services/settingsService";

function NewStockContent() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("inventory");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Form state
  const [groupImage, setGroupImage] = useState<string>("");
  const [groupName, setGroupName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [selectedShop, setSelectedShop] = useState("");

  const [isColorless, setIsColorless] = useState(false);
  const [wholesaleTiers, setWholesaleTiers] = useState<WholesaleTier[]>([]);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [error, setError] = useState<string>("");

  // Currency state
  const [defaultCurrency, setDefaultCurrency] = useState<'THB' | 'MMK'>('THB');
  const [currencySymbol, setCurrencySymbol] = useState<string>('฿');

  // Fetch shops from the API
  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const response = await fetch("/api/shops");
      if (!response.ok) {
        throw new Error("Failed to fetch shops");
      }
      const data: ShopListResponse = await response.json();
      setShops(data.data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
      setError("Failed to load shops");
    } finally {
      setIsLoadingShops(false);
    }
  };

  // Load shops on component mount
  useEffect(() => {
    fetchShops();
  }, []);

  // Load currency settings on component mount
  useEffect(() => {
    const fetchCurrencySettings = async () => {
      try {
        const settings = await SettingsService.getBusinessSettings();
        if (settings) {
          const currency = (settings.defaultCurrency as 'THB' | 'MMK') || 'THB';
          setDefaultCurrency(currency);
          const currencyInfo = SettingsService.getCurrencyInfo(currency);
          setCurrencySymbol(currencyInfo.symbol);
        }
      } catch (error) {
        console.error('Error fetching currency settings:', error);
      }
    };

    fetchCurrencySettings();
  }, []);

  const addWholesaleTier = () => {
    const newTier: WholesaleTier = {
      id: Date.now().toString(),
      minQuantity: 0,
      price: 0,
    };
    setWholesaleTiers([...wholesaleTiers, newTier]);
  };

  const updateWholesaleTier = (
    id: string,
    field: keyof WholesaleTier,
    value: number
  ) => {
    setWholesaleTiers((tiers) =>
      tiers.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier))
    );
  };

  const removeWholesaleTier = (id: string) => {
    setWholesaleTiers((tiers) => tiers.filter((tier) => tier.id !== id));
  };

  const addColorVariant = () => {
    const newVariant: ColorVariant = {
      id: Date.now().toString(),
      color: "",
      colorCode: "#000000",
      barcode: "",
      sizeQuantities: [],
    };
    setColorVariants([...colorVariants, newVariant]);
  };

  const updateColorVariant = (
    id: string,
    field: keyof ColorVariant,
    value: string | number
  ) => {
    setColorVariants((variants) =>
      variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const removeColorVariant = (id: string) => {
    setColorVariants((variants) =>
      variants.filter((variant) => variant.id !== id)
    );
  };

  // Size management functions
  const availableSizes = [
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
  ];

  const addSizeToVariant = (variantId: string, size: string) => {
    setColorVariants((variants) =>
      variants.map((variant) => {
        if (variant.id === variantId) {
          // Check if size already exists
          const existingSize = variant.sizeQuantities.find(
            (sq) => sq.size === size
          );
          if (existingSize) {
            return variant; // Don't add duplicate size
          }

          const newSizeQuantity: SizeQuantity = {
            size,
            quantity: 0,
          };
          return {
            ...variant,
            sizeQuantities: [...variant.sizeQuantities, newSizeQuantity],
          };
        }
        return variant;
      })
    );
  };

  const updateSizeQuantity = (
    variantId: string,
    size: string,
    quantity: number
  ) => {
    setColorVariants((variants) =>
      variants.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            sizeQuantities: variant.sizeQuantities.map((sq) =>
              sq.size === size ? { ...sq, quantity } : sq
            ),
          };
        }
        return variant;
      })
    );
  };

  const removeSizeFromVariant = (variantId: string, size: string) => {
    setColorVariants((variants) =>
      variants.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            sizeQuantities: variant.sizeQuantities.filter(
              (sq) => sq.size !== size
            ),
          };
        }
        return variant;
      })
    );
  };

  const handleSaveStock = async () => {
    setError("");

    // Validation
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      setError("Valid unit price is required");
      return;
    }

    if (!originalPrice || parseFloat(originalPrice) <= 0) {
      setError("Valid original price is required");
      return;
    }

    if (!releaseDate) {
      setError("Release date is required");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the request data
      const stockData: CreateStockRequest = {
        groupName: groupName.trim(),
        unitPrice: parseFloat(unitPrice),
        originalPrice: parseFloat(originalPrice),
        releaseDate,
        shop: selectedShop,
        isColorless,
        groupImage: groupImage, // Use Cloudinary URL directly
        wholesaleTiers: wholesaleTiers.map((tier) => ({
          minQuantity: tier.minQuantity,
          price: tier.price,
        })),
        colorVariants: colorVariants.map((variant) => ({
          color: variant.color,
          colorCode: variant.colorCode,
          barcode: variant.barcode,
          sizeQuantities: variant.sizeQuantities,
          image: variant.image,
        })),
      };

      // Make API call
      const response = await fetch("/api/stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create stock item");
      }

      // Success - redirect to stocks page
      router.push("/owner/inventory/stocks");
    } catch (error) {
      console.error("Error saving stock:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save stock item"
      );
    } finally {
      setIsLoading(false);
    }
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

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                title="Go back to stock list"
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Create Stock Entry
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Group Image Section */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Group Image
                </h2>
              </div>
              <div className="p-6">
                <ImageUpload
                  value={groupImage}
                  onChange={setGroupImage}
                  folder="pos-clothing-store/groups"
                  placeholder="Upload group image"
                />
              </div>
            </div>

            {/* Group Info Section */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Group Info
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="Enter unit price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="Enter original price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Release Date
                    </label>
                    <input
                      title="Select release date"
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop
                    </label>
                    <select
                      title="Select shop"
                      value={selectedShop}
                      onChange={(e) => setSelectedShop(e.target.value)}
                      disabled={isLoadingShops}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingShops ? "Loading shops..." : "Select a shop"}
                      </option>
                      {shops &&
                        shops.length > 0 &&
                        shops.map((shop) => (
                          <option key={shop.id} value={shop.id}>
                            {shop.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isColorless}
                      onChange={(e) => setIsColorless(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Is colorless stock?
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Wholesale Pricing Tiers Section */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Wholesale Pricing Tiers
                </h2>
                <Button
                  onClick={addWholesaleTier}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>
              <div className="p-6">
                {wholesaleTiers.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">No wholesale tiers</p>
                    <p className="text-sm text-gray-400">
                      Get started by adding your first wholesale pricing tier.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wholesaleTiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Quantity
                          </label>
                          <input
                            aria-label="Enter minimum quantity"
                            type="number"
                            value={tier.minQuantity}
                            onChange={(e) =>
                              updateWholesaleTier(
                                tier.id,
                                "minQuantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price ({currencySymbol})
                          </label>
                          <input
                            aria-label="Enter price"
                            type="number"
                            value={tier.price}
                            onChange={(e) =>
                              updateWholesaleTier(
                                tier.id,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          />
                        </div>
                        <button
                          title="Remove wholesale tier"
                          onClick={() => removeWholesaleTier(tier.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Color Variants Section */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Color Variants
                </h2>
              </div>
              <div className="p-6">
                {colorVariants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No color variants added yet. Click &quot;+ Add
                      Variant&quot; to begin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {colorVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700">
                            Variant #{variant.id.slice(-4)}
                          </h3>
                          <button
                            aria-label="Remove color variant"
                            onClick={() => removeColorVariant(variant.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left side - Image Upload */}
                          <div>
                            <ImageUpload
                              value={variant.image || ""}
                              onChange={(url) =>
                                updateColorVariant(variant.id, "image", url)
                              }
                              folder="pos-clothing-store/variants"
                              placeholder="Upload variant image"
                              className="h-48"
                            />
                          </div>

                          {/* Right side - Form Fields */}
                          <div className="space-y-4">
                            {/* Color Detection Display */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color (Detected)
                              </label>
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-8 h-8 rounded border border-gray-300"
                                  style={{ backgroundColor: variant.colorCode }}
                                ></div>
                                <input
                                  type="text"
                                  value={variant.color}
                                  onChange={(e) =>
                                    updateColorVariant(
                                      variant.id,
                                      "color",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Color name"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                />
                                <input
                                  aria-label="Select color code"
                                  type="color"
                                  value={variant.colorCode}
                                  onChange={(e) =>
                                    updateColorVariant(
                                      variant.id,
                                      "colorCode",
                                      e.target.value
                                    )
                                  }
                                  className="w-10 h-10 border border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            {/* Barcode Number */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Barcode Number
                              </label>
                              <input
                                type="text"
                                value={variant.barcode}
                                onChange={(e) =>
                                  updateColorVariant(
                                    variant.id,
                                    "barcode",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter barcode"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                              />
                            </div>

                            {/* Size Selector */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Available Sizes
                              </label>
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {availableSizes.map((size) => {
                                  const isSelected =
                                    variant.sizeQuantities.some(
                                      (sq) => sq.size === size
                                    );
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          removeSizeFromVariant(
                                            variant.id,
                                            size
                                          );
                                        } else {
                                          addSizeToVariant(variant.id, size);
                                        }
                                      }}
                                      className={`flex items-center justify-center p-3 border-2 rounded-md cursor-pointer transition-colors min-h-[44px] ${
                                        isSelected
                                          ? "bg-blue-500 border-blue-500 text-white font-semibold"
                                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
                                      }`}
                                    >
                                      <span className="text-sm font-semibold">
                                        {size}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Quantity inputs for selected sizes */}
                              {variant.sizeQuantities.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    Quantities by Size
                                  </h4>
                                  {variant.sizeQuantities.map((sizeQty) => (
                                    <div
                                      key={sizeQty.size}
                                      className="flex items-center space-x-2"
                                    >
                                      <span className="text-sm font-medium text-gray-600 w-16">
                                        {sizeQty.size}:
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={sizeQty.quantity}
                                        onChange={(e) =>
                                          updateSizeQuantity(
                                            variant.id,
                                            sizeQty.size,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                        placeholder="0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSizeFromVariant(
                                            variant.id,
                                            sizeQty.size
                                          )
                                        }
                                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                                        aria-label={`Remove ${sizeQty.size} size`}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Multiple
                </Button>
                <Button
                  variant="outline"
                  onClick={addColorVariant}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
                    {error}
                  </div>
                )}
                <Button
                  onClick={handleSaveStock}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save Stock Entry"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function NewStockPage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <NewStockContent />
    </ProtectedRoute>
  );
}
