// features/warehouse/warehouseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  Product,
  WarehouseTransfer,
  StockAdjustment,
  InventoryLog,
  TransferFilters,
  TransferData,
  StockAdjustmentData,
  DashboardStats,
  WarehouseStats
} from '../../../types/warehouse.types';

// Define local interfaces that might be missing
interface ProductStock {
  product_id: number;
  warehouse: string;
  quantity: number;
  unit: string;
  minStockLevel?: number;
  reorderPoint?: number;
}

interface TransferRequest {
  product_id: number;
  from_warehouse: string;
  to_warehouse: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TransfersResponse {
  transfers: WarehouseTransfer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard data response interface
interface DashboardResponse {
  stats: DashboardStats;
  warehouseStats: WarehouseStats[];
  lowStockItems: Product[];
  recentTransfers: WarehouseTransfer[];
}

export const warehouseApi = createApi({
  reducerPath: 'warehouseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Products', 'Transfers', 'Stock', 'Adjustments', 'Logs', 'Dashboard'],
  endpoints: (builder) => ({
    // Products
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
      providesTags: ['Products'],
      transformResponse: (response: ApiResponse<Product[]>) => response.data
    }),
    
    getProductById: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
      transformResponse: (response: ApiResponse<Product>) => response.data
    }),
    
    // Warehouse Stock
    getWarehouseStock: builder.query<Product[], { warehouse?: string }>({
      query: (params) => ({
        url: '/warehouse/stock',
        params
      }),
      providesTags: ['Stock'],
      transformResponse: (response: ApiResponse<Product[]>) => response.data
    }),
    
    getProductStock: builder.query<Product, number>({
      query: (id) => `/products/${id}/stock`,
      providesTags: ['Stock'],
      transformResponse: (response: ApiResponse<Product>) => response.data
    }),
    
    // Transfers
    getTransfers: builder.query<TransfersResponse, TransferFilters>({
      query: (params) => ({
        url: '/warehouse/transfers',
        params
      }),
      providesTags: ['Transfers'],
      transformResponse: (response: ApiResponse<PaginatedResponse<WarehouseTransfer>>) => ({
        transfers: response.data.data,
        pagination: response.data.pagination
      })
    }),
    
    createTransfer: builder.mutation<WarehouseTransfer, TransferData>({
      query: (data) => ({
        url: '/warehouse/transfers',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transfers', 'Stock'],
      transformResponse: (response: ApiResponse<WarehouseTransfer>) => response.data
    }),
    
    approveTransfer: builder.mutation<WarehouseTransfer, { 
      id: number; 
      notes?: string;
      approved_by: number;
    }>({
      query: ({ id, ...data }) => ({
        url: `/warehouse/transfers/${id}/approve`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transfers', 'Stock'],
      transformResponse: (response: ApiResponse<WarehouseTransfer>) => response.data
    }),
    
    completeTransfer: builder.mutation<WarehouseTransfer, { 
      id: number; 
      notes?: string;
      completedBY: number;
    }>({
      query: ({ id, ...data }) => ({
        url: `/warehouse/transfers/${id}/complete`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transfers', 'Stock'],
      transformResponse: (response: ApiResponse<WarehouseTransfer>) => response.data
    }),
    
    rejectTransfer: builder.mutation<WarehouseTransfer, { 
      id: number; 
      reason: string;
      rejectedBy: number;
    }>({
      query: ({ id, ...data }) => ({
        url: `/warehouse/transfers/${id}/reject`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transfers'],
      transformResponse: (response: ApiResponse<WarehouseTransfer>) => response.data
    }),
    
    cancelTransfer: builder.mutation<WarehouseTransfer, { 
      id: number; 
      reason: string;
      cancelledBy: number;
    }>({
      query: ({ id, ...data }) => ({
        url: `/warehouse/transfers/${id}/cancel`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transfers'],
      transformResponse: (response: ApiResponse<WarehouseTransfer>) => response.data
    }),
    
    // Stock Adjustments
    createStockAdjustment: builder.mutation<StockAdjustment, StockAdjustmentData>({
      query: (data) => ({
        url: '/warehouse/adjustments',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Stock', 'Adjustments', 'Logs'],
      transformResponse: (response: ApiResponse<StockAdjustment>) => response.data
    }),
    
    getAdjustments: builder.query<StockAdjustment[], { 
      product_id?: number; 
      warehouse?: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/warehouse/adjustments',
        params
      }),
      providesTags: ['Adjustments'],
      transformResponse: (response: ApiResponse<StockAdjustment[]>) => response.data
    }),
    
    // Inventory Logs
    getInventoryLogs: builder.query<InventoryLog[], {
      product_id?: number;
      warehouse?: string;
      changeType?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/warehouse/logs',
        params
      }),
      providesTags: ['Logs'],
      transformResponse: (response: ApiResponse<PaginatedResponse<InventoryLog>>) => response.data.data
    }),
    
    // Dashboard
    getDashboardData: builder.query<DashboardResponse, void>({
      query: () => '/warehouse/dashboard',
      providesTags: ['Dashboard'],
      transformResponse: (response: ApiResponse<DashboardResponse>) => response.data
    }),
    
    // Low Stock Alerts
    getLowStockItems: builder.query<Product[], { warehouse?: string }>({
      query: (params) => ({
        url: '/warehouse/low-stock',
        params
      }),
      providesTags: ['Stock'],
      transformResponse: (response: ApiResponse<Product[]>) => response.data
    }),
    
    // Auto Replenish
    autoReplenish: builder.mutation<WarehouseTransfer, {
      product_id: number;
      requiredQuantity: number;
      targetWarehouse: string;
    }>({
      query: (data) => ({
        url: '/warehouse/auto-replenish',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transfers', 'Stock'],
      transformResponse: (response: ApiResponse<WarehouseTransfer>) => response.data
    })
  })
});

export const {
  // Products
  useGetProductsQuery,
  useGetProductByIdQuery,
  
  // Warehouse Stock
  useGetWarehouseStockQuery,
  useGetProductStockQuery,
  
  // Transfers
  useGetTransfersQuery,
  useCreateTransferMutation,
  useApproveTransferMutation,
  useCompleteTransferMutation,
  useRejectTransferMutation,
  useCancelTransferMutation,
  
  // Stock Adjustments
  useCreateStockAdjustmentMutation,
  useGetAdjustmentsQuery,
  
  // Inventory Logs
  useGetInventoryLogsQuery,
  
  // Dashboard
  useGetDashboardDataQuery,
  
  // Low Stock
  useGetLowStockItemsQuery,
  useAutoReplenishMutation
} = warehouseApi;