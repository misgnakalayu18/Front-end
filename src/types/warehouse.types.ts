// types/warehouse.types.ts

export enum Warehouse {
  SHEGOLE_MULUNEH = 'SHEGOLE_MULUNEH',
  EMBILTA = 'EMBILTA',
  NEW_SHEGOLE = 'NEW_SHEGOLE',
  MERKATO = 'MERKATO',
  DAMAGE = 'DAMAGE',
  BACKUP = 'BACKUP'
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum TransferType {
  WAREHOUSE_TO_WAREHOUSE = 'WAREHOUSE_TO_WAREHOUSE',
  RESTOCK = 'RESTOCK',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum Unit {
  PC = 'PC',
  DOZ = 'DOZ',
  SET = 'SET'
}

// Extended types for API responses
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
  productCode?: string;
  productName?: string;
  warehouse: Warehouse;
  quantity: number;
  unit: Unit;
  minStockLevel?: number;
  reorderPoint?: number;
  currentStock?: number;
  price?: number;
}

export interface TransferRequest {
  product_id: number;
  from_warehouse: Warehouse;
  to_warehouse: Warehouse;
  quantity: number;
  reason?: string;
  notes?: string;
  transferType?: TransferType;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  unit: Unit;
  price: number;
  minStockLevel: number;
  reorderPoint: number;
  
  // Warehouse quantities
  shegoleMulunehQty: number;
  embiltaQty: number;
  newShegoleQty: number;
  merkatoQty: number;
  damageQty: number;
  backupQty: number;
  totalQty: number;
  
  // Calculated fields
  totalPrice?: number;
  warehouse?: Warehouse;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseTransfer {
  id: number;
  transfer_number: string;
  product_id: number;
  productCode: string;
  productName: string;
  from_warehouse: Warehouse;
  to_warehouse: Warehouse;
  quantity: number;
  unit: Unit;
  transferType: TransferType;
  status: TransferStatus;
  
  // User references
  requested_by: number;
  approved_by?: number;
  completedBy?: number;
  
  // Timestamps
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  
  // Additional info
  reason?: string;
  notes?: string;
  
  // Joined user info (optional)
  requesterName?: string;
  approverName?: string;
  completerName?: string;
}

export interface StockAdjustment {
  id: number;
  product_id: number;
  productCode: string;
  productName: string;
  warehouse: Warehouse;
  currentQuantity: number;
  newQuantity: number;
  adjustmentType: 'SET' | 'ADD' | 'SUBTRACT';
  adjustmentReason: string;
  quantity: number;
  notes?: string;
  createdBy: number;
  createdAt: string;
  
  // Joined user info
  creatorName?: string;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  warehouse: Warehouse;
  quantity: number;
  unit: Unit;
  changeType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  referenceId?: number;
  referenceType?: 'SALE' | 'TRANSFER' | 'ADJUSTMENT';
  notes?: string;
  createdBy: number;
  createdAt: string;
  
  // Joined info
  productCode?: string;
  productName?: string;
  creatorName?: string;
}

export interface WarehouseStats {
  warehouse: Warehouse;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  totalTransfers: number;
  pendingTransfers: number;
  completedTransfers: number;
  lowStockItems: number;
  criticalStockItems: number;
  outOfStockItems: number;
}

export interface TransferFilters {
  status?: TransferStatus | '';
  from_warehouse?: Warehouse | '';
  to_warehouse?: Warehouse | '';
  transferType?: TransferType | '';
  search?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface StockAdjustmentData {
  product_id: number;
  warehouse: Warehouse;
  adjustmentType: 'SET' | 'ADD' | 'SUBTRACT';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface TransferData {
  product_id: number;
  from_warehouse: Warehouse;
  to_warehouse: Warehouse;
  quantity: number;
  transferType?: TransferType;
  reason?: string;
  notes?: string;
}

// Additional utility types
export interface LowStockItem {
  id: number;
  product_id: number;
  productCode: string;
  productName: string;
  warehouse: Warehouse;
  currentStock: number;
  minStockLevel: number;
  reorderPoint: number;
  unit: Unit;
  requiredQuantity: number;
}

export interface DashboardData {
  stats: DashboardStats;
  warehouseStats: WarehouseStats[];
  lowStockItems: LowStockItem[];
  recentTransfers: WarehouseTransfer[];
}

// Type guards and utilities
export const isWarehouse = (value: any): value is Warehouse => {
  return Object.values(Warehouse).includes(value);
};

export const isTransferStatus = (value: any): value is TransferStatus => {
  return Object.values(TransferStatus).includes(value);
};

export const isTransferType = (value: any): value is TransferType => {
  return Object.values(TransferType).includes(value);
};

export const isUnit = (value: any): value is Unit => {
  return Object.values(Unit).includes(value);
};