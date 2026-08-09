export type PromotionScope = "group" | "variant";
export type PromotionDiscountType = "percentage" | "fixed";

export interface Promotion {
  id: string;
  name: string;
  scope: PromotionScope;
  stockId: string;
  stockName: string;
  variantId?: string;
  variantColor?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string; // ISO date string (yyyy-mm-dd)
  endDate: string; // ISO date string (yyyy-mm-dd)
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreatePromotionRequest {
  name: string;
  scope: PromotionScope;
  stockId: string;
  variantId?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface PromotionResponse {
  success: boolean;
  data?: Promotion;
  error?: string;
  message?: string;
}

export interface PromotionListResponse {
  success: boolean;
  data?: Promotion[];
  error?: string;
  total?: number;
}
