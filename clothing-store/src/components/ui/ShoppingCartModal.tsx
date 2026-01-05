"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSettings } from "@/contexts/SettingsContext";
import {
  X,
  Minus,
  Plus,
  Settings,
  ShoppingCart,
  Eye,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import { CustomerSelectionModal } from "@/components/cart/CustomerSelectionModal";
import { PaymentClearanceModal } from "@/components/payment/PaymentClearanceModal";

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShoppingCartModal({ isOpen, onClose }: ShoppingCartModalProps) {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    completePurchase,
    applyGroupDiscount,
    applyVariantDiscount,
    removeGroupDiscount,
    removeVariantDiscount,
    applyWholesalePricing,
    removeWholesalePricing,
    setSelectedCustomer,
    getSelectedCustomer,
  } = useCart();
  const { formatPrice, getCurrencySymbol } = useCurrency();
  const { taxRate } = useSettings();
  const [discountAmount, setDiscountAmount] = React.useState<string>("");
  const [cartDiscountPercent, setCartDiscountPercent] =
    React.useState<number>(0);
  const [isBigViewOpen, setIsBigViewOpen] = React.useState<boolean>(false);

  // Shop name mapping
  const [shopNames, setShopNames] = React.useState<Record<string, string>>({});

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

  // Discount type state (percentage or amount)
  const [discountType, setDiscountType] = React.useState<
    "percentage" | "amount"
  >("amount");
  const [groupDiscountType, setGroupDiscountType] = React.useState<
    "percentage" | "amount"
  >("amount");
  const [variantDiscountType, setVariantDiscountType] = React.useState<
    "percentage" | "amount"
  >("amount");

  // Search state for group and variant selection
  const [groupSearchTerm, setGroupSearchTerm] = React.useState<string>("");
  const [variantSearchTerm, setVariantSearchTerm] = React.useState<string>("");
  const [showGroupDropdown, setShowGroupDropdown] =
    React.useState<boolean>(false);
  const [showVariantDropdown, setShowVariantDropdown] =
    React.useState<boolean>(false);

  // Customer selection state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);

  // Payment clearance state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  // Refs for detecting clicks outside dropdowns
  const groupDropdownRef = React.useRef<HTMLDivElement>(null);
  const variantDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(event.target as Node)
      ) {
        setShowGroupDropdown(false);
      }
      if (
        variantDropdownRef.current &&
        !variantDropdownRef.current.contains(event.target as Node)
      ) {
        setShowVariantDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prevent background scrolling when modal is open and auto-open big view
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Automatically open big view when cart is opened
      setIsBigViewOpen(true);

      // Fetch shop names
      const fetchShops = async () => {
        try {
          const response = await fetch("/api/shops");
          if (response.ok) {
            const data = await response.json();
            const shopsMap: Record<string, string> = {};
            data.data?.forEach((shop: { id: string; name: string }) => {
              shopsMap[shop.id] = shop.name;
            });
            setShopNames(shopsMap);
          }
        } catch (error) {
          console.error("Error fetching shops:", error);
        }
      };
      fetchShops();
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
      setCartDiscountPercent(0);
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
    const value = parseFloat(discountAmount) || 0;
    if (discountType === "percentage") {
      if (value >= 0 && value <= 100) {
        // Store the cart discount percentage - it will be applied to subtotal after individual discounts
        setCartDiscountPercent(value);
      } else {
        alert("Please enter a valid discount percentage (0-100)");
      }
    } else {
      // Custom amount discount - convert to percentage based on subtotal
      if (value >= 0) {
        if (subtotal > 0) {
          const percentEquivalent = (value / subtotal) * 100;
          setCartDiscountPercent(percentEquivalent);
        } else {
          alert("Cart is empty or subtotal is 0");
        }
      } else {
        alert("Please enter a valid discount amount (0 or greater)");
      }
    }
  };

  // New discount handlers
  const handleApplyGroupDiscount = () => {
    const value = parseFloat(groupDiscountAmount) || 0;
    if (!selectedGroupForDiscount) {
      alert("Please select a group");
      return;
    }

    if (groupDiscountType === "percentage") {
      if (value >= 0 && value <= 100) {
        applyGroupDiscount(selectedGroupForDiscount, value);
        setGroupDiscountAmount("");
        setSelectedGroupForDiscount("");
      } else {
        alert("Please enter a valid discount percentage (0-100)");
      }
    } else {
      // Custom amount discount - convert to percentage based on group total
      const groupTotal = cart.items
        .filter((item) => item.groupName === selectedGroupForDiscount)
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      if (value >= 0) {
        if (groupTotal > 0) {
          const percentEquivalent = (value / groupTotal) * 100;
          applyGroupDiscount(selectedGroupForDiscount, percentEquivalent);
          setGroupDiscountAmount("");
          setSelectedGroupForDiscount("");
        } else {
          alert("Group total is 0");
        }
      } else {
        alert("Please enter a valid discount amount (0 or greater)");
      }
    }
  };

  const handleApplyVariantDiscount = () => {
    const value = parseFloat(variantDiscountAmount) || 0;
    if (!selectedVariantForDiscount) {
      alert("Please select a variant");
      return;
    }

    if (variantDiscountType === "percentage") {
      if (value >= 0 && value <= 100) {
        applyVariantDiscount(selectedVariantForDiscount, value);
        setVariantDiscountAmount("");
        setSelectedVariantForDiscount("");
      } else {
        alert("Please enter a valid discount percentage (0-100)");
      }
    } else {
      // Custom amount discount - convert to percentage based on variant total
      const variantItem = cart.items.find(
        (item) => item.id === selectedVariantForDiscount
      );

      if (variantItem && value >= 0) {
        const variantTotal = variantItem.unitPrice * variantItem.quantity;
        if (variantTotal > 0) {
          const percentEquivalent = (value / variantTotal) * 100;
          applyVariantDiscount(selectedVariantForDiscount, percentEquivalent);
          setVariantDiscountAmount("");
          setSelectedVariantForDiscount("");
        } else {
          alert("Variant total is 0");
        }
      } else {
        alert("Please enter a valid discount amount (0 or greater)");
      }
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

  // Filtered groups based on search
  const filteredGroups = uniqueGroups.filter((group) =>
    group.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  // Filtered variants based on search
  const filteredVariants = cart.items.filter((item) => {
    const variantLabel = `${item.groupName} - ${item.selectedColor} / ${item.selectedSize}`;
    return variantLabel.toLowerCase().includes(variantSearchTerm.toLowerCase());
  });

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = (paymentData: {
    transactionId: string;
    total: number;
    // add other known fields here as needed
  }) => {
    // In a real application, you would send this data to your backend
    console.log("Payment completed:", paymentData);

    // Complete purchase and reset states
    completePurchase();
    setCartDiscountPercent(0);
    setDiscountAmount("");
    setGroupDiscountAmount("");
    setSelectedGroupForDiscount("");
    setVariantDiscountAmount("");
    setSelectedVariantForDiscount("");
    setDiscountMode("cart");

    // Close modals
    setIsPaymentModalOpen(false);
    onClose();

    // Show success message and navigate to transactions page
    alert(
      `Payment completed successfully!\n\nTransaction ID: ${
        paymentData.transactionId
      }\nTotal: ${formatPrice(
        paymentData.total
      )}\n\nRedirecting to transactions page...`
    );

    // Navigate to transactions page after a short delay
    setTimeout(() => {
      router.push("/owner/sales/transactions");
    }, 1500);
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
    return total + item.unitPrice * item.quantity;
  }, 0);

  // Calculate group discount savings
  const groupDiscountSavings = cart.items.reduce((total, item) => {
    if (item.groupDiscount && item.groupDiscount > 0) {
      const originalItemTotal = item.unitPrice * item.quantity;
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
      const originalItemTotal = item.unitPrice * item.quantity;
      const variantDiscountAmount =
        originalItemTotal * (item.variantDiscount / 100);
      return total + variantDiscountAmount;
    }
    return total;
  }, 0);

  // Calculate wholesale pricing savings (items with wholesale pricing but no group/variant discounts)
  const wholesaleSavings = cart.items.reduce((total, item) => {
    // Check if item has wholesale pricing applied (discounted price exists, is less than unit price, and no discount percentages)
    if (
      item.discountedPrice !== undefined &&
      item.discountedPrice < item.unitPrice &&
      (!item.groupDiscount || item.groupDiscount === 0) &&
      (!item.variantDiscount || item.variantDiscount === 0)
    ) {
      const originalItemTotal = item.unitPrice * item.quantity;
      const wholesaleItemTotal = item.discountedPrice * item.quantity;
      const savings = originalItemTotal - wholesaleItemTotal;
      console.log(
        "Wholesale item:",
        item.groupName,
        "Original:",
        originalItemTotal,
        "Wholesale:",
        wholesaleItemTotal,
        "Savings:",
        savings
      );
      return total + savings;
    }
    return total;
  }, 0);

  // Calculate cart discount dynamically based on percentage and current subtotal (after individual discounts)
  const appliedDiscount = subtotal * (cartDiscountPercent / 100);
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
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Full Screen Cart - Combined View */}
      <div className="absolute inset-0 bg-white shadow-xl flex">
        {/* Left Side - Cart Big View */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <Eye className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {cart.totalItems} items
              </span>
            </div>
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
                              Shop: {shopNames[item.shop] || item.shop}
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
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-700">
                                  Size:
                                </span>
                                <span className="text-xs font-medium text-gray-800">
                                  {item.selectedSize}
                                </span>
                              </div>
                            </div>

                            {/* Uint Price */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-700">
                                Price:
                              </span>
                              <span className="text-xs font-bold text-gray-900">
                                {formatPrice(item.unitPrice)}
                              </span>
                            </div>

                            {/* Discounted Price (if any) */}
                            {item.discountedPrice !== undefined &&
                              item.discountedPrice !== item.unitPrice && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    After Discount:
                                  </span>
                                  <span className="text-xs font-bold text-green-600">
                                    {formatPrice(item.discountedPrice)}
                                  </span>
                                </div>
                              )}

                            {/* Group Discount Badge */}
                            {item.groupDiscount && item.groupDiscount > 0 ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                                  Group: {item.groupDiscount}% OFF
                                </span>
                                <button
                                  onClick={() =>
                                    handleRemoveGroupDiscount(item.groupName)
                                  }
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : null}

                            {/* Variant Discount Badge */}
                            {item.variantDiscount &&
                            item.variantDiscount > 0 ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                                  Variant: {item.variantDiscount}% OFF
                                </span>
                                <button
                                  onClick={() =>
                                    handleRemoveVariantDiscount(item.id)
                                  }
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : null}

                            {/* Wholesale Pricing Badge */}
                            {item.isWholesalePricing && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                                  WHOLESALE PRICING
                                </span>
                                <button
                                  onClick={() =>
                                    removeWholesalePricing(item.groupName)
                                  }
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            {/* Wholesale Price Suggestion - Group Based */}
                            {(() => {
                              // Calculate total quantity for this group
                              const groupItems = cart.items.filter(
                                (cartItem) =>
                                  cartItem.groupName === item.groupName
                              );
                              const totalGroupQuantity = groupItems.reduce(
                                (sum, cartItem) => sum + cartItem.quantity,
                                0
                              );

                              // Find matching wholesale tier based on group total
                              const matchingTier = item.wholesaleTiers?.find(
                                (tier) =>
                                  tier.minQuantity === totalGroupQuantity
                              );

                              // Check if this is the first item in the group
                              const isFirstInGroup =
                                cart.items.findIndex(
                                  (cartItem) =>
                                    cartItem.groupName === item.groupName
                                ) ===
                                cart.items.findIndex(
                                  (cartItem) => cartItem.id === item.id
                                );

                              if (
                                matchingTier &&
                                item.unitPrice !== matchingTier.price &&
                                !item.isWholesalePricing // Don't show if wholesale is already applied
                              ) {
                                const wholesalePricePerItem =
                                  matchingTier.price / matchingTier.minQuantity;

                                return (
                                  <div className="mt-2 p-2 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-800 mb-1">
                                          Wholesale Price Available
                                        </p>
                                        <p className="text-xs text-gray-700">
                                          Total {totalGroupQuantity} items ={" "}
                                          {formatPrice(matchingTier.price)}{" "}
                                          total (
                                          {formatPrice(wholesalePricePerItem)}
                                          /item)
                                        </p>
                                      </div>
                                      {isFirstInGroup && (
                                        <button
                                          onClick={() => {
                                            // Calculate current total using the actual price being charged
                                            const currentTotal =
                                              groupItems.reduce(
                                                (sum, cartItem) => {
                                                  const currentPrice =
                                                    cartItem.discountedPrice !==
                                                    undefined
                                                      ? cartItem.discountedPrice
                                                      : cartItem.unitPrice;
                                                  return (
                                                    sum +
                                                    currentPrice *
                                                      cartItem.quantity
                                                  );
                                                },
                                                0
                                              );
                                            const wholesaleTotal =
                                              matchingTier.price;
                                            const savings =
                                              currentTotal - wholesaleTotal;

                                            if (
                                              confirm(
                                                `Apply wholesale pricing to all "${item.groupName}" items?\n\n` +
                                                  `Current Total: ${formatPrice(
                                                    currentTotal
                                                  )}\n` +
                                                  `Wholesale Total: ${formatPrice(
                                                    wholesaleTotal
                                                  )}\n` +
                                                  `(${totalGroupQuantity} items = ${formatPrice(
                                                    wholesalePricePerItem
                                                  )}/item)\n\n` +
                                                  `Total Savings: ${formatPrice(
                                                    savings
                                                  )}`
                                              )
                                            ) {
                                              // Apply wholesale price directly to all items in the group
                                              applyWholesalePricing(
                                                item.groupName,
                                                wholesalePricePerItem
                                              );
                                            }
                                          }}
                                          className="ml-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
                                        >
                                          Apply
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Right Column - Quantity & Subtotal */}
                          <div className="flex flex-col justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">
                                Quantity:
                              </span>
                              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="p-1 hover:bg-white rounded transition-colors"
                                  title="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3 text-gray-600" />
                                </button>
                                <span className="text-sm font-bold text-gray-900 min-w-[30px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  className="p-1 hover:bg-white rounded transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            </div>

                            {/* Item Subtotal */}
                            <div className="mt-2 bg-blue-50 p-2 rounded-lg">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Item Total:
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-700">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-500">×</span>
                                <span className="font-semibold text-gray-900">
                                  {formatPrice(
                                    item.discountedPrice !== undefined
                                      ? item.discountedPrice
                                      : item.unitPrice
                                  )}
                                </span>
                                <span className="text-gray-500">=</span>
                                <span className="font-bold text-blue-600">
                                  {formatPrice(
                                    (item.discountedPrice !== undefined
                                      ? item.discountedPrice
                                      : item.unitPrice) * item.quantity
                                  )}
                                </span>
                              </div>
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
        </div>

        {/* Right Side - Shopping Cart Summary */}
        <div className="w-full max-w-md flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart
            </h2>
            <div className="flex items-center space-x-2">
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
                {getSelectedCustomer()?.customerImage ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={getSelectedCustomer()?.customerImage}
                    alt={
                      getSelectedCustomer()?.displayName ||
                      getSelectedCustomer()?.email ||
                      "Customer"
                    }
                  />
                ) : getSelectedCustomer() ? (
                  <span className="text-white text-sm font-medium">
                    {getSelectedCustomer()
                      ?.displayName?.charAt(0)
                      ?.toUpperCase() ||
                      getSelectedCustomer()?.email?.charAt(0)?.toUpperCase() ||
                      "C"}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getSelectedCustomer()?.displayName || "Unknown Customer"}
                </p>
                <p className="text-xs text-blue-600">
                  {getSelectedCustomer()?.email || "Walk-in customer"}
                </p>
                {getSelectedCustomer()?.customerType && (
                  <p className="text-xs text-gray-500">
                    {getSelectedCustomer()?.customerType}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-gray-400 hover:text-gray-600"
                title="Select customer"
              >
                <Users className="h-4 w-4" />
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
            <div className="flex-1 border-t border-gray-200 overflow-y-auto">
              <div className="px-6 py-6 space-y-6">
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
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder={
                            discountType === "percentage"
                              ? "Enter discount percentage (0-100)"
                              : "Enter discount amount"
                          }
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          min="0"
                          max={
                            discountType === "percentage" ? "100" : undefined
                          }
                          step="0.1"
                        />
                        <button
                          onClick={() => setDiscountType("percentage")}
                          className={`px-3 py-2 text-xs font-medium rounded ${
                            discountType === "percentage"
                              ? "bg-green-600 text-white"
                              : "bg-white text-green-600 border border-green-300"
                          }`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => setDiscountType("amount")}
                          className={`px-3 py-2 text-xs font-medium rounded ${
                            discountType === "amount"
                              ? "bg-green-600 text-white"
                              : "bg-white text-green-600 border border-green-300"
                          }`}
                        >
                          {getCurrencySymbol()}
                        </button>
                        <button
                          onClick={handleApplyDiscount}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 border-2 border-blue-700 shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Group Discount */}
                  {discountMode === "group" && (
                    <div className="space-y-2">
                      <div className="relative" ref={groupDropdownRef}>
                        <input
                          type="text"
                          placeholder="Search group..."
                          value={groupSearchTerm}
                          onChange={(e) => {
                            setGroupSearchTerm(e.target.value);
                            setShowGroupDropdown(true);
                          }}
                          onFocus={() => setShowGroupDropdown(true)}
                          className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        {showGroupDropdown && filteredGroups.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredGroups.map((group) => (
                              <button
                                key={group}
                                onClick={() => {
                                  setSelectedGroupForDiscount(group);
                                  setGroupSearchTerm(group);
                                  setShowGroupDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-900 font-medium hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                              >
                                {group}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder={
                            groupDiscountType === "percentage"
                              ? "Discount %"
                              : "Discount amount"
                          }
                          value={groupDiscountAmount}
                          onChange={(e) =>
                            setGroupDiscountAmount(e.target.value)
                          }
                          className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          min="0"
                          max={
                            groupDiscountType === "percentage"
                              ? "100"
                              : undefined
                          }
                          step="0.1"
                        />
                        <button
                          onClick={() => setGroupDiscountType("percentage")}
                          className={`px-3 py-2 text-xs font-medium rounded ${
                            groupDiscountType === "percentage"
                              ? "bg-green-600 text-white"
                              : "bg-white text-green-600 border border-green-300"
                          }`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => setGroupDiscountType("amount")}
                          className={`px-3 py-2 text-xs font-medium rounded ${
                            groupDiscountType === "amount"
                              ? "bg-green-600 text-white"
                              : "bg-white text-green-600 border border-green-300"
                          }`}
                        >
                          {getCurrencySymbol()}
                        </button>
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
                      <div className="relative" ref={variantDropdownRef}>
                        <input
                          type="text"
                          placeholder="Search variant..."
                          value={variantSearchTerm}
                          onChange={(e) => {
                            setVariantSearchTerm(e.target.value);
                            setShowVariantDropdown(true);
                          }}
                          onFocus={() => setShowVariantDropdown(true)}
                          className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        {showVariantDropdown && filteredVariants.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredVariants.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedVariantForDiscount(item.id);
                                  setVariantSearchTerm(
                                    `${item.groupName} - ${item.selectedColor} / ${item.selectedSize}`
                                  );
                                  setShowVariantDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-900 font-medium hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                              >
                                {item.groupName} - {item.selectedColor} /{" "}
                                {item.selectedSize}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder={
                            variantDiscountType === "percentage"
                              ? "Discount %"
                              : "Discount amount"
                          }
                          value={variantDiscountAmount}
                          onChange={(e) =>
                            setVariantDiscountAmount(e.target.value)
                          }
                          className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          min="0"
                          max={
                            variantDiscountType === "percentage"
                              ? "100"
                              : undefined
                          }
                          step="0.1"
                        />
                        <button
                          onClick={() => setVariantDiscountType("percentage")}
                          className={`px-3 py-2 text-xs font-medium rounded ${
                            variantDiscountType === "percentage"
                              ? "bg-green-600 text-white"
                              : "bg-white text-green-600 border border-green-300"
                          }`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => setVariantDiscountType("amount")}
                          className={`px-3 py-2 text-xs font-medium rounded ${
                            variantDiscountType === "amount"
                              ? "bg-green-600 text-white"
                              : "bg-white text-green-600 border border-green-300"
                          }`}
                        >
                          {getCurrencySymbol()}
                        </button>
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

                  {/* Wholesale Pricing Display */}
                  {wholesaleSavings > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-800">
                      <span className="flex items-center space-x-1">
                        <span>Wholesale Pricing:</span>
                        <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          WHOLESALE
                        </span>
                      </span>
                      <span className="font-bold text-red-600">
                        -{formatPrice(wholesaleSavings)}
                      </span>
                    </div>
                  )}

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
                          {cartDiscountPercent > 0
                            ? ` (${cartDiscountPercent}%)`
                            : ""}
                          :
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
                    <span className="font-bold">
                      {formatPrice(subtotalAfterAllDiscounts)}
                    </span>
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
            </div>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={setSelectedCustomer}
        selectedCustomer={getSelectedCustomer()}
      />

      {/* Payment Clearance Modal */}
      <PaymentClearanceModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentComplete={() => {
          // Generate a transaction ID
          const transactionId = `TXN-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;
          // Call the original handler with the expected shape
          handlePaymentComplete({
            transactionId,
            total: grandTotal,
          });
        }}
        customer={getSelectedCustomer()}
        items={cart.items}
        subtotal={subtotal}
        discount={appliedDiscount}
        tax={tax}
        total={grandTotal}
        currency="B"
      />
    </div>
  );
}
