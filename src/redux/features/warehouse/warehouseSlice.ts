// features/warehouse/warehouseSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Warehouse,
  WarehouseTransfer,
  TransferStatus,
  TransferType,
  Product,
  StockAdjustment,
  InventoryLog,
  WarehouseStats,
  DashboardStats,
  TransferFilters,
  TransferData,
  StockAdjustmentData
} from '../../../types/warehouse.types';

interface WarehouseState {
  // Products and stock
  products: Product[];
  warehouseStock: Product[];
  selectedProduct: Product | null;
  
  // Transfers
  transfers: WarehouseTransfer[];
  selectedTransfer: WarehouseTransfer | null;
  transferFilters: TransferFilters;
  transferPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Adjustments and logs
  adjustments: StockAdjustment[];
  inventoryLogs: InventoryLog[];
  
  // Dashboard data
  dashboardStats: DashboardStats | null;
  warehouseStats: WarehouseStats[];
  lowStockItems: Product[];
  recentTransfers: WarehouseTransfer[];
  
  // Loading states
  loading: {
    products: boolean;
    transfers: boolean;
    dashboard: boolean;
    warehouseStock: boolean;
    adjustments: boolean;
    inventoryLogs: boolean;
  };
  
  // Error states
  error: {
    products: string | null;
    transfers: string | null;
    dashboard: string | null;
    warehouseStock: string | null;
    adjustments: string | null;
    inventoryLogs: string | null;
  };
  
  // Operation states
  creatingTransfer: boolean;
  updatingTransfer: boolean;
  adjustingStock: boolean;
}

const initialState: WarehouseState = {
  products: [],
  warehouseStock: [],
  selectedProduct: null,
  
  transfers: [],
  selectedTransfer: null,
  transferFilters: {
    status: '',
    from_warehouse: '',
    to_warehouse: '',
    transferType: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  },
  transferPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  
  adjustments: [],
  inventoryLogs: [],
  
  dashboardStats: null,
  warehouseStats: [],
  lowStockItems: [],
  recentTransfers: [],
  
  loading: {
    products: false,
    transfers: false,
    dashboard: false,
    warehouseStock: false,
    adjustments: false,
    inventoryLogs: false
  },
  
  error: {
    products: null,
    transfers: null,
    dashboard: null,
    warehouseStock: null,
    adjustments: null,
    inventoryLogs: null
  },
  
  creatingTransfer: false,
  updatingTransfer: false,
  adjustingStock: false
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    // Products
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    
    // Warehouse stock
    setWarehouseStock: (state, action: PayloadAction<Product[]>) => {
      state.warehouseStock = action.payload;
    },
    updateProductStock: (state, action: PayloadAction<{
      product_id: number;
      warehouse: Warehouse;
      newQuantity: number;
    }>) => {
      const { product_id, warehouse, newQuantity } = action.payload;
      const productIndex = state.warehouseStock.findIndex(p => p.id === product_id);
      
      if (productIndex !== -1) {
        const product = state.warehouseStock[productIndex];
        const warehouseField = getWarehouseField(warehouse);
        
        // Update specific warehouse quantity
        state.warehouseStock[productIndex] = {
          ...product,
          [warehouseField]: newQuantity,
          totalQty: calculateTotalQuantity({
            ...product,
            [warehouseField]: newQuantity
          })
        };
      }
    },
    
    // Transfers
    setTransfers: (state, action: PayloadAction<{
      transfers: WarehouseTransfer[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>) => {
      state.transfers = action.payload.transfers;
      state.transferPagination = action.payload.pagination;
    },
    addTransfer: (state, action: PayloadAction<WarehouseTransfer>) => {
      state.transfers.unshift(action.payload);
      if (state.transferPagination) {
        state.transferPagination.total += 1;
      }
    },
    updateTransfer: (state, action: PayloadAction<WarehouseTransfer>) => {
      const index = state.transfers.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.transfers[index] = action.payload;
      }
    },
    setSelectedTransfer: (state, action: PayloadAction<WarehouseTransfer | null>) => {
      state.selectedTransfer = action.payload;
    },
    setTransferFilters: (state, action: PayloadAction<Partial<TransferFilters>>) => {
      state.transferFilters = { ...state.transferFilters, ...action.payload };
    },
    resetTransferFilters: (state) => {
      state.transferFilters = initialState.transferFilters;
    },
    
    // Adjustments
    setAdjustments: (state, action: PayloadAction<StockAdjustment[]>) => {
      state.adjustments = action.payload;
    },
    addAdjustment: (state, action: PayloadAction<StockAdjustment>) => {
      state.adjustments.unshift(action.payload);
    },
    
    // Inventory logs
    setInventoryLogs: (state, action: PayloadAction<InventoryLog[]>) => {
      state.inventoryLogs = action.payload;
    },
    addInventoryLog: (state, action: PayloadAction<InventoryLog>) => {
      state.inventoryLogs.unshift(action.payload);
    },
    
    // Dashboard data
    setDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
      state.dashboardStats = action.payload;
    },
    setWarehouseStats: (state, action: PayloadAction<WarehouseStats[]>) => {
      state.warehouseStats = action.payload;
    },
    setLowStockItems: (state, action: PayloadAction<Product[]>) => {
      state.lowStockItems = action.payload;
    },
    setRecentTransfers: (state, action: PayloadAction<WarehouseTransfer[]>) => {
      state.recentTransfers = action.payload;
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<{
      key: keyof WarehouseState['loading'];
      value: boolean;
    }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    setCreatingTransfer: (state, action: PayloadAction<boolean>) => {
      state.creatingTransfer = action.payload;
    },
    setUpdatingTransfer: (state, action: PayloadAction<boolean>) => {
      state.updatingTransfer = action.payload;
    },
    setAdjustingStock: (state, action: PayloadAction<boolean>) => {
      state.adjustingStock = action.payload;
    },
    
    // Error states
    setError: (state, action: PayloadAction<{
      key: keyof WarehouseState['error'];
      value: string | null;
    }>) => {
      state.error[action.payload.key] = action.payload.value;
    },
    clearErrors: (state) => {
      state.error = initialState.error;
    },
    
    // Reset state
    resetWarehouseState: () => initialState
  }
});

// Helper functions
const getWarehouseField = (warehouse: Warehouse): keyof Product => {
  const fieldMap: Record<Warehouse, keyof Product> = {
    [Warehouse.SHEGOLE_MULUNEH]: 'shegoleMulunehQty',
    [Warehouse.EMBILTA]: 'embiltaQty',
    [Warehouse.NEW_SHEGOLE]: 'newShegoleQty',
    [Warehouse.MERKATO]: 'merkatoQty',
    [Warehouse.DAMAGE]: 'damageQty',
    [Warehouse.BACKUP]: 'backupQty'
  };
  return fieldMap[warehouse];
};

const calculateTotalQuantity = (product: Product): number => {
  return (
    product.shegoleMulunehQty +
    product.embiltaQty +
    product.newShegoleQty +
    product.merkatoQty +
    product.damageQty +
    product.backupQty
  );
};

export const {
  // Products
  setProducts,
  setSelectedProduct,
  
  // Warehouse stock
  setWarehouseStock,
  updateProductStock,
  
  // Transfers
  setTransfers,
  addTransfer,
  updateTransfer,
  setSelectedTransfer,
  setTransferFilters,
  resetTransferFilters,
  
  // Adjustments
  setAdjustments,
  addAdjustment,
  
  // Inventory logs
  setInventoryLogs,
  addInventoryLog,
  
  // Dashboard
  setDashboardStats,
  setWarehouseStats,
  setLowStockItems,
  setRecentTransfers,
  
  // Loading states
  setLoading,
  setCreatingTransfer,
  setUpdatingTransfer,
  setAdjustingStock,
  
  // Error states
  setError,
  clearErrors,
  
  // Reset
  resetWarehouseState
} = warehouseSlice.actions;

export default warehouseSlice.reducer;