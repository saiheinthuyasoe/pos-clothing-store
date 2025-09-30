export interface Shop {
  id: string;
  name: string;
  address: string;
  primaryPhone: string;
  secondaryPhone?: string;
  township: string;
  city: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID who created this shop
}

export interface CreateShopRequest {
  name: string;
  address: string;
  primaryPhone: string;
  secondaryPhone?: string;
  township: string;
  city: string;
  status?: 'active' | 'inactive';
}

export interface UpdateShopRequest {
  name?: string;
  address?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  township?: string;
  city?: string;
  status?: 'active' | 'inactive';
}

export interface ShopResponse {
  success: boolean;
  data?: Shop;
  error?: string;
}

export interface ShopListResponse {
  success: boolean;
  data?: Shop[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface ShopFilters {
  status?: 'active' | 'inactive';
  city?: string;
  township?: string;
  search?: string;
}

export interface ShopStats {
  totalShops: number;
  activeShops: number;
  inactiveShops: number;
  citiesCount: number;
  townshipsCount: number;
}

export interface ShopStatsResponse {
  success: boolean;
  data?: ShopStats;
  error?: string;
}