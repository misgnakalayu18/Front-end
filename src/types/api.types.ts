// types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductStock {
  product_id: number;
  warehouse: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  reorderPoint: number;
}

export interface TransferRequest {
  product_id: number;
  from_warehouse: string;
  to_warehouse: string;
  quantity: number;
  reason?: string;
  notes?: string;
}