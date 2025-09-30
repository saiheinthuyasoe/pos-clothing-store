export interface CartItem {
  id: string;
  stockId: string;
  groupName: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  colorCode?: string;
  image?: string;
  shop: string;
  // Discount tracking
  groupDiscount?: number; // Percentage discount applied to the entire group
  variantDiscount?: number; // Percentage discount applied to specific color/size variant
  discountedPrice?: number; // Final price after applying discounts
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  currency: 'THB' | 'MMK';
}

export interface CartContextType {
  cart: Cart;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  // Discount management functions
  applyGroupDiscount: (groupName: string, discountPercent: number) => void;
  applyVariantDiscount: (itemId: string, discountPercent: number) => void;
  removeGroupDiscount: (groupName: string) => void;
  removeVariantDiscount: (itemId: string) => void;
  setInventoryCallbacks?: (callbacks: {
    reduceStock: (stockId: string, color: string, size: string, quantity: number) => Promise<void> | void;
    restoreStock: (stockId: string, color: string, size: string, quantity: number) => Promise<void> | void;
    checkStock: (stockId: string, color: string, size: string) => number;
  }) => void;
}