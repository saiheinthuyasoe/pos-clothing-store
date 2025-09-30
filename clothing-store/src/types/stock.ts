import React from "react";

export interface WholesaleTier {
  id: string;
  minQuantity: number;
  price: number;
}

export interface SizeQuantity {
  size: string;
  quantity: number;
}

export interface ColorVariant {
  id: string;
  color: string;
  colorCode: string;
  barcode: string;
  sizeQuantities: SizeQuantity[];
  image?: string;
}

export interface StockItem {
  id: string;
  groupName: string;
  unitPrice: number;
  originalPrice: number;
  releaseDate: string;
  shop: string;
  isColorless: boolean;
  groupImage?: string;
  wholesaleTiers: WholesaleTier[];
  colorVariants: ColorVariant[];
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID who created this stock
}

export interface CreateStockRequest {
  groupName: string;
  unitPrice: number;
  originalPrice: number;
  releaseDate: string;
  shop: string;
  isColorless: boolean;
  groupImage?: string;
  wholesaleTiers: Omit<WholesaleTier, "id">[];
  colorVariants: Omit<ColorVariant, "id">[];
}

export interface StockResponse {
  success: boolean;
  data?: StockItem;
  error?: string;
  message?: string;
}

export interface StockListResponse {
  success: boolean;
  data?: StockItem[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Enhanced types for stock listing display
export interface StockVariantDisplay {
  variantId: string;
  color: string;
  colorCode: string;
  barcode: string;
  image?: string;
  sizeQuantities: SizeQuantity[];
  totalQuantity: number;
  colorStyle: React.CSSProperties;
  sizes: SizeQuantity[];
}

export interface StockGroupDisplay {
  groupId: string;
  groupName: string;
  unitPrice: number;
  originalPrice: number;
  releaseDate: string;
  shop: string;
  isColorless: boolean;
  groupImage: string;
  wholesaleTiers: WholesaleTier[];
  variants: StockVariantDisplay[];
  totalVariants: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  formattedPrice: string;
  formattedReleaseDate: string;
  sizeSummary: string;
}
