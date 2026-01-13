import axios from 'axios';
import {
  WarehouseTransfer,
  ProductStock,
  TransferRequest,
  StockAdjustment,
  ApiResponse,
  PaginatedResponse,
  DashboardStats
} from '../../types/warehouse.types';
import { API_ENDPOINTS } from '../../constant/warehouse.constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const warehouseApi = {
  // Transfer operations
  createTransfer: (data: TransferRequest): Promise<ApiResponse<WarehouseTransfer>> =>
    api.post(API_ENDPOINTS.TRANSFER, data).then(res => res.data),

  getTransfers: (params?: any): Promise<ApiResponse<PaginatedResponse<WarehouseTransfer>>> =>
    api.get(API_ENDPOINTS.TRANSFER, { params }).then(res => res.data),

  getTransfer: (id: number): Promise<ApiResponse<WarehouseTransfer>> =>
    api.get(`${API_ENDPOINTS.TRANSFER}/${id}`).then(res => res.data),

  completeTransfer: (id: number, notes?: string): Promise<ApiResponse<WarehouseTransfer>> =>
    api.post(`${API_ENDPOINTS.TRANSFER}/${id}/complete`, { notes }).then(res => res.data),

  cancelTransfer: (id: number, reason: string): Promise<ApiResponse<WarehouseTransfer>> =>
    api.post(`${API_ENDPOINTS.TRANSFER}/${id}/cancel`, { reason }).then(res => res.data),

  // Stock operations
  getProductStock: (product_id: number): Promise<ApiResponse<ProductStock>> =>
    api.get(`${API_ENDPOINTS.STOCK}/product/${product_id}`).then(res => res.data),

  getWarehouseStock: (params?: any): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(`${API_ENDPOINTS.STOCK}/warehouse`, { params }).then(res => res.data),

  checkStockAvailability: (
    product_id: number,
    warehouse: string,
    quantity: number
  ): Promise<ApiResponse<{ available: boolean; currentStock: number }>> =>
    api.get(`${API_ENDPOINTS.STOCK}/check`, {
      params: { product_id, warehouse, quantity }
    }).then(res => res.data),

  updateStock: (data: StockAdjustment): Promise<ApiResponse<any>> =>
    api.post(`${API_ENDPOINTS.STOCK}/update`, data).then(res => res.data),

  // Alternative warehouses
  getAlternativeWarehouses: (
    product_id: number,
    requiredQuantity: number,
    excludeWarehouse?: string
  ): Promise<ApiResponse<any[]>> =>
    api.get(API_ENDPOINTS.ALTERNATIVES, {
      params: { product_id, requiredQuantity, excludeWarehouse }
    }).then(res => res.data),

  // Stock history
  getStockHistory: (
    product_id: number,
    warehouse?: string,
    page?: number,
    limit?: number
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(API_ENDPOINTS.HISTORY, {
      params: { product_id, warehouse, page, limit }
    }).then(res => res.data),

  // Dashboard and stats
  getTransferStats: (timeframe?: string): Promise<ApiResponse<any>> =>
    api.get(API_ENDPOINTS.STATS, { params: { timeframe } }).then(res => res.data),

  getDashboardData: (): Promise<ApiResponse<DashboardStats>> =>
    api.get(API_ENDPOINTS.DASHBOARD).then(res => res.data)
};