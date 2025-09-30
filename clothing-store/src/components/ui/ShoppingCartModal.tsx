"use client";

import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSettings } from "@/contexts/SettingsContext";
import { X, Minus, Plus, Settings, ShoppingCart, Eye } from "lucide-react";
import Image from "next/image";

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShoppingCartModal({ isOpen, onClose }: ShoppingCartModalProps) {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyGroupDiscount,
    applyVariantDiscount,
    removeGroupDiscount,
    removeVariantDiscount,
  } = useCart();
  const { formatPrice } = useCurrency();
  const { taxRate } = useSettings();
  const [discountAmount, setDiscountAmount] = React.useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = React.useState<number>(0);
  const [isBigViewOpen, setIsBigViewOpen] = React.useState<boolean>(false);

  // New discount management state
  const [groupDiscountAmount, setGroupDiscountAmount] =
    React.useState<string>("");
  const [selectedGroupForDiscount, setSelectedGroupForDiscount] =
    React.useState<string>("");
  const [variantDiscountAmount, setVariantDiscountAmount] =
    React.useState<string>("");
  const [selectedVariantForDiscount, setSelectedVariantForDiscount] =
    React.useState<string>("");
  const [discountMode, setDiscountMode] = React.useState<
    "cart" | "group" | "variant"
  >("cart");

  // Prevent background scrolling when modal is open and auto-open big view
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Automatically open big view when cart is opened
      setIsBigViewOpen(true);
    } else {
      document.body.style.overflow = "unset";
      // Reset big view when cart is closed
      setIsBigViewOpen(false);
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset all discounts when cart becomes empty
  React.useEffect(() => {
    if (cart.items.length === 0) {
      setDiscountAmount("");
      setAppliedDiscount(0);
      setGroupDiscountAmount("");
      setSelectedGroupForDiscount("");
      setVariantDiscountAmount("");
      setSelectedVariantForDiscount("");
      setDiscountMode("cart");
    }
  }, [cart.items.length]);

  // Get existing group discount amount
  const getExistingGroupDiscount = (groupName: string): string => {
    const groupItem = cart.items.find((item) => item.groupName === groupName);
    return groupItem?.groupDiscount ? groupItem.groupDiscount.toString() : "";
  };

  // Get existing variant discount amount
  const getExistingVariantDiscount = (itemId: string): string => {
    const variantItem = cart.items.find((item) => item.id === itemId);
    return variantItem?.variantDiscount
      ? variantItem.variantDiscount.toString()
      : "";
  };

  // Update input fields when selections change
  React.useEffect(() => {
    if (selectedGroupForDiscount) {
      const existingDiscount = getExistingGroupDiscount(
        selectedGroupForDiscount
      );
      setGroupDiscountAmount(existingDiscount);
    }
  }, [selectedGroupForDiscount, cart.items]);

  React.useEffect(() => {
    if (selectedVariantForDiscount) {
      const existingDiscount = getExistingVariantDiscount(
        selectedVariantForDiscount
      );
      setVariantDiscountAmount(existingDiscount);
    }
  }, [selectedVariantForDiscount, cart.items]);

  if (!isOpen) return null;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleApplyDiscount = () => {
    const discountPercent = parseFloat(discountAmount) || 0;
    if (discountPercent >= 0 && discountPercent <= 100) {
      const discountValue = (subtotal * discountPercent) / 100;
      setAppliedDiscount(discountValue);
    } else {
      alert("Please enter a valid discount percentage (0-100)");
    }
  };

  // New discount handlers
  const handleApplyGroupDiscount = () => {
    const discountPercent = parseFloat(groupDiscountAmount) || 0;
    if (
      discountPercent >= 0 &&
      discountPercent <= 100 &&
      selectedGroupForDiscount
    ) {
      applyGroupDiscount(selectedGroupForDiscount, discountPercent);
      setGroupDiscountAmount("");
      setSelectedGroupForDiscount("");
    } else {
      alert(
        "Please select a group and enter a valid discount percentage (0-100)"
      );
    }
  };

  const handleApplyVariantDiscount = () => {
    const discountPercent = parseFloat(variantDiscountAmount) || 0;
    if (
      discountPercent >= 0 &&
      discountPercent <= 100 &&
      selectedVariantForDiscount
    ) {
      applyVariantDiscount(selectedVariantForDiscount, discountPercent);
      setVariantDiscountAmount("");
      setSelectedVariantForDiscount("");
    } else {
      alert(
        "Please select a variant and enter a valid discount percentage (0-100)"
      );
    }
  };

  const handleRemoveGroupDiscount = (groupName: string) => {
    removeGroupDiscount(groupName);
  };

  const handleRemoveVariantDiscount = (itemId: string) => {
    removeVariantDiscount(itemId);
  };

  // Get unique groups from cart items
  const uniqueGroups = Array.from(
    new Set(cart.items.map((item) => item.groupName))
  );

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Here you would typically integrate with a payment system
    // For now, we'll just show a success message and clear the cart
    const confirmed = confirm(
      `Proceed with checkout for ${formatPrice(grandTotal)}?`
    );
    if (confirmed) {
      clearCart();
      // Reset all discount states
      setAppliedDiscount(0);
      setDiscountAmount("");
      setGroupDiscountAmount("");
      setSelectedGroupForDiscount("");
      setVariantDiscountAmount("");
      setSelectedVariantForDiscount("");
      setDiscountMode("cart");
      onClose();
      alert("Checkout completed successfully!");
    }
  };

  // Calculate subtotal using discounted prices when available
  const subtotal = cart.items.reduce((total, item) => {
    const price =
      item.discountedPrice !== undefined
        ? item.discountedPrice
        : item.unitPrice;
    return total + price * item.quantity;
  }, 0);

  // Calculate original subtotal (without any discounts)
  const originalSubtotal = cart.items.reduce((total, item) => {
    return total + item.originalPrice * item.quantity;
  }, 0);

  // Calculate group discount savings
  const groupDiscountSavings = cart.items.reduce((total, item) => {
    if (item.groupDiscount && item.groupDiscount > 0) {
      const originalItemTotal = item.originalPrice * item.quantity;
      const groupDiscountAmount =
        originalItemTotal * (item.groupDiscount / 100);
      return total + groupDiscountAmount;
    }
    return total;
  }, 0);

  // Calculate variant discount savings
  const variantDiscountSavings = cart.items.reduce((total, item) => {
    if (item.variantDiscount && item.variantDiscount > 0) {
      // Calculate variant discount on the original price (not after group discount)
      const originalItemTotal = item.originalPrice * item.quantity;
      const variantDiscountAmount =
        originalItemTotal * (item.variantDiscount / 100);
      return total + variantDiscountAmount;
    }
    return total;
  }, 0);

  const discount = appliedDiscount; // Cart-wide discount
  const subtotalAfterAllDiscounts = subtotal - discount; // Subtotal after all discounts including cart discount
  const tax = subtotalAfterAllDiscounts * (taxRate / 100); // Calculate tax based on tax rate from settings
  const grandTotal = subtotalAfterAllDiscounts + tax;

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-hidden"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-gray-200">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart
            </h2>
            <div className="flex items-center space-x-2">
              {cart.items.length > 0 && (
                <button
                  title="Open big view"
                  onClick={() => setIsBigViewOpen(true)}
                  className="rounded-full p-2 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </button>
              )}
              <button
                title="Close cart"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">D</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Default</p>
                <p className="text-xs text-blue-600">Unknown</p>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                title="Edit customer info"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Footer with totals and checkout */}
          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-6 py-4">
              <ShoppingCart className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Add some items to get started</p>
            </div>
          ) : (
            <div className="flex-1 border-t border-gray-200 px-6 py-6 space-y-6">
              {/* Discount section */}
              <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center space-x-2 text-blue-700 mb-3">
                  <div className="w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center border border-blue-300">
                    <span className="text-sm font-bold text-blue-800">%</span>
                  </div>
                  <span className="text-sm font-bold text-blue-800">
                    Discount Management
                  </span>
                </div>

                {/* Discount Mode Selector */}
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => setDiscountMode("cart")}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      discountMode === "cart"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 border border-blue-300"
                    }`}
                  >
                    Cart
                  </button>
                  <button
                    onClick={() => setDiscountMode("group")}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      discountMode === "group"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 border border-blue-300"
                    }`}
                  >
                    Group
                  </button>
                  <button
                    onClick={() => setDiscountMode("variant")}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      discountMode === "variant"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 border border-blue-300"
                    }`}
                  >
                    Variant
                  </button>
                </div>

                {/* Cart-wide Discount */}
                {discountMode === "cart" && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Enter discount percentage (0-100)"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 border-2 border-blue-700 shadow-sm"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Group Discount */}
                {discountMode === "group" && (
                  <div className="space-y-2">
                    <select
                      title="Select a group for discount"
                      value={selectedGroupForDiscount}
                      onChange={(e) =>
                        setSelectedGroupForDiscount(e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Select a group</option>
                      {uniqueGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Discount %"
                        value={groupDiscountAmount}
                        onChange={(e) => setGroupDiscountAmount(e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <button
                        onClick={handleApplyGroupDiscount}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 border-2 border-blue-700 shadow-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Variant Discount */}
                {discountMode === "variant" && (
                  <div className="space-y-2">
                    <select
                      title="Select a variant for discount"
                      value={selectedVariantForDiscount}
                      onChange={(e) =>
                        setSelectedVariantForDiscount(e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Select a variant</option>
                      {cart.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.groupName} - {item.selectedColor} /{" "}
                          {item.selectedSize}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Discount %"
                        value={variantDiscountAmount}
                        onChange={(e) =>
                          setVariantDiscountAmount(e.target.value)
                        }
                        className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <button
                        onClick={handleApplyVariantDiscount}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 border-2 border-blue-700 shadow-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-300 pt-4 space-y-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm font-medium text-gray-800">
                  <span>Original Subtotal:</span>
                  <span className="font-bold">
                    {formatPrice(originalSubtotal)}
                  </span>
                </div>

                {/* Group Discount Display */}
                {groupDiscountSavings > 0 && (
                  <div className="flex justify-between text-sm font-medium text-gray-800">
                    <span className="flex items-center space-x-1">
                      <span>Group Discount:</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        GROUP
                      </span>
                    </span>
                    <span className="font-bold text-red-600">
                      -{formatPrice(groupDiscountSavings)}
                    </span>
                  </div>
                )}

                {/* Variant Discount Display */}
                {variantDiscountSavings > 0 && (
                  <div className="flex justify-between text-sm font-medium text-gray-800">
                    <span className="flex items-center space-x-1">
                      <span>Variant Discount:</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                        VARIANT
                      </span>
                    </span>
                    <span className="font-bold text-red-600">
                      -{formatPrice(variantDiscountSavings)}
                    </span>
                  </div>
                )}

                {/* Cart-wide Discount Display */}
                {discount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-gray-800">
                    <span className="flex items-center space-x-1">
                      <span>
                        Cart Discount
                        {discountAmount ? ` (${discountAmount}%)` : ""}:
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                        CART
                      </span>
                    </span>
                    <span className="font-bold text-red-600">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-medium text-gray-800">
                  <span>Subtotal After Discounts:</span>
                  <span className="font-bold">{formatPrice(subtotalAfterAllDiscounts)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-800">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-bold">{formatPrice(tax)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-bold text-lg text-gray-900">
                      Grand Total:
                    </span>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-700">
                        (Qty. {cart.totalItems})
                      </div>
                      <div className="font-bold text-lg text-green-600">
                        {formatPrice(grandTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Big View - Same Layer */}
      {isBigViewOpen && (
        <div className="absolute left-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl border-r border-gray-200">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <Eye className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Cart Big View
                </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {cart.totalItems} items
                </span>
              </div>
              <button
                title="Close big view"
                onClick={() => setIsBigViewOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart className="h-16 w-16 mb-6 text-gray-300" />
                  <p className="text-xl font-medium">Your cart is empty</p>
                  <p className="text-sm">Add some items to see them here</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {cart.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.groupName}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No Image
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                #{index + 1}. {item.groupName}
                              </h3>
                              <p className="text-xs text-gray-600">
                                Shop: {item.shop}
                              </p>
                            </div>
                            <button
                              title="Remove item from cart"
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Left Column - Color, Size, Price */}
                            <div className="space-y-2">
                              {/* Color and Size */}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    Color:
                                  </span>
                                  <div
                                    className="w-5 h-5 rounded-full border border-gray-300"
                                    style={{
                                      backgroundColor:
                                        item.colorCode || "#ef4444",
                                    }}
                                  />
                                  <span className="text-xs font-medium text-gray-800">
                                    {item.selectedColor}
                                  </span>
                                </div>
                                {item.selectedSize && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs font-medium text-gray-700">
                                      Size:
                                    </span>
                                    <span className="text-xs font-medium text-gray-800 bg-gray-200 px-1.5 py-0.5 rounded border">
                                      {item.selectedSize}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Step-by-Step Discount Calculation */}
                              {item.groupDiscount || item.variantDiscount ? (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-gray-700 mb-2">
                                    Discount Calculation:
                                  </div>
                                  <div className="flex items-center gap-1 text-sm font-mono">
                                    {/* Original Price */}
                                    <span className="font-semibold text-gray-900">
                                      {formatPrice(item.originalPrice)}
                                    </span>

                                    {/* Group Discount */}
                                    {item.groupDiscount &&
                                      item.groupDiscount > 0 && (
                                        <>
                                          <span className="text-red-600 font-medium">
                                            -
                                          </span>
                                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium text-xs">
                                            {item.groupDiscount}%(Group)
                                          </span>
                                        </>
                                      )}

                                    {/* Variant Discount */}
                                    {item.variantDiscount &&
                                      item.variantDiscount > 0 && (
                                        <>
                                          <span className="text-red-600 font-medium">
                                            -
                                          </span>
                                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium text-xs">
                                            {item.variantDiscount}%(Variant)
                                          </span>
                                        </>
                                      )}

                                    {/* Equals */}
                                    <span className="text-blue-600 font-bold mx-1">
                                      =
                                    </span>

                                    {/* Final Unit Price */}
                                    <span className="font-bold text-blue-600">
                                      {formatPrice(
                                        item.discountedPrice || item.unitPrice
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* Original Price Display for items without discounts */
                                <div className="flex items-center gap-2 text-sm mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    Price:
                                  </span>
                                  <span className="font-medium text-gray-700">
                                    {formatPrice(item.originalPrice)}
                                  </span>
                                </div>
                              )}

                              {/* Final Total Calculation */}
                              <div className="mt-2">
                                <div className="text-xs font-medium text-gray-700 mb-1">
                                  Total Calculation:
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-gray-700">
                                    {item.quantity}
                                  </span>
                                  <span className="text-gray-500">×</span>
                                  <span className="font-semibold text-gray-900">
                                    {formatPrice(
                                      item.discountedPrice || item.unitPrice
                                    )}
                                  </span>
                                  <span className="text-gray-500">=</span>
                                  <span className="font-bold text-blue-600">
                                    {formatPrice(
                                      (item.discountedPrice || item.unitPrice) *
                                        item.quantity
                                    )}
                                  </span>
                                  {(item.groupDiscount ||
                                    item.variantDiscount) &&
                                    (() => {
                                      const originalTotal =
                                        item.originalPrice * item.quantity;
                                      const discountedTotal =
                                        (item.discountedPrice ||
                                          item.unitPrice) * item.quantity;
                                      const savedAmount =
                                        originalTotal - discountedTotal;
                                      return (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium ml-2">
                                          Save Money {formatPrice(savedAmount)}
                                        </span>
                                      );
                                    })()}
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Quantity Controls */}
                            <div className="flex items-center justify-end">
                              <div className="flex items-center space-x-2 rounded-lg p-1.5">
                                <button
                                  title="Decrease quantity"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center shadow-sm border border-gray-400 transition-colors text-gray-700 hover:text-gray-900"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-10 text-center font-bold text-sm text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">
                                  {item.quantity}
                                </span>
                                <button
                                  title="Increase quantity"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center shadow-sm border border-gray-400 transition-colors text-gray-700 hover:text-gray-900"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with summary */}
            {cart.items.length > 0 && (
              <div className="border-t border-gray-300 px-6 py-4 bg-gray-100">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                  <div className="text-sm font-medium text-gray-800">
                    Total Items:{" "}
                    <span className="font-bold text-gray-900">
                      {cart.totalItems}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">
                      Cart Total
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(cart.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
