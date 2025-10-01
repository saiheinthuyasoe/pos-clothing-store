export interface Customer {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  totalPurchases?: number;
  totalSpent?: number;
  lastPurchaseDate?: string;
  customerType?: 'retailer' | 'wholesaler' | 'distributor' | 'individual' | 'other';
  receivables?: number;
  phone?: string;
  address?: string;
  secondaryPhone?: string;
  township?: string;
  city?: string;
  customerImage?: string;
}

export interface CustomerFilters {
  customerType?: 'retailer' | 'wholesaler' | 'distributor' | 'individual' | 'other';
  search?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  retailerCustomers: number;
  wholesalerCustomers: number;
  totalReceivables: number;
}

export interface CustomerResponse {
  success: boolean;
  data?: Customer;
  error?: string;
  message?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data?: Customer[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface CustomerStatsResponse {
  success: boolean;
  data?: CustomerStats;
  error?: string;
}

export interface CreateCustomerRequest {
  email: string;
  displayName: string;
  customerType?: 'retailer' | 'wholesaler' | 'distributor' | 'individual' | 'other';
  phone?: string;
  address?: string;
  secondaryPhone?: string;
  township?: string;
  city?: string;
  customerImage?: string;
}

export interface UpdateCustomerRequest {
  displayName?: string;
  customerType?: 'retailer' | 'wholesaler' | 'distributor' | 'individual' | 'other';
  phone?: string;
  address?: string;
  receivables?: number;
  secondaryPhone?: string;
  township?: string;
  city?: string;
  customerImage?: string;
}