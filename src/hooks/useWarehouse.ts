// hooks/useWarehouse.ts
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
  addTransfer,
  updateTransfer,
  updateProductStock,
  setLoading,
  setCreatingTransfer,
  setAdjustingStock,
  setDashboardStats,
  setWarehouseStats,
  setLowStockItems,
  setRecentTransfers
} from '../redux/features/warehouse/warehouseSlice';

export const useWarehouse = () => {
  const dispatch = useDispatch<AppDispatch>();
  const warehouseState = useSelector((state: RootState) => state.warehouse);
  const authState = useSelector((state: RootState) => state.auth);

  // Check if user is admin
  const isAdmin = authState.user?.role === 'ADMIN';

  // Transfer functions
  const createTransfer = async (transferData: any) => {
    dispatch(setCreatingTransfer(true));
    
    try {
      const mockTransfer = {
        id: Math.floor(Math.random() * 1000),
        ...transferData,
        status: 'PENDING',
        requested_at: new Date().toISOString(),
        requesterName: authState.user?.role || authState.user?.email || 'Unknown'
      };

      dispatch(addTransfer(mockTransfer));
      
      dispatch(updateProductStock({
        product_id: transferData.product_id,
        warehouse: transferData.from_warehouse,
        newQuantity: 0
      }));

      return { success: true, transfer: mockTransfer };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to create transfer' 
      };
    } finally {
      dispatch(setCreatingTransfer(false));
    }
  };

  // Stock adjustment functions
  const createStockAdjustment = async (adjustmentData: any) => {
    dispatch(setAdjustingStock(true));
    
    try {
      const mockAdjustment = {
        id: Math.floor(Math.random() * 1000),
        ...adjustmentData,
        createdAt: new Date().toISOString(),
        creatorName: authState.user?.role || authState.user?.email || 'Unknown'
      };

      if (adjustmentData.adjustmentType === 'SET') {
        dispatch(updateProductStock({
          product_id: adjustmentData.product_id,
          warehouse: adjustmentData.warehouse,
          newQuantity: adjustmentData.quantity
        }));
      }

      return { success: true, adjustment: mockAdjustment };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to adjust stock' 
      };
    } finally {
      dispatch(setAdjustingStock(false));
    }
  };

  // Alias for backward compatibility
  const updateStock = createStockAdjustment;

  // Helper functions
  const getWarehouseStockByProduct = (product: any, warehouse: string) => {
    if (!product) return 0;
    
    const warehouseMap: Record<string, string> = {
      SHEGOLE_MULUNEH: 'shegoleMulunehQty',
      EMBILTA: 'embiltaQty',
      NEW_SHEGOLE: 'newShegoleQty',
      MERKATO: 'merkatoQty',
      DAMAGE: 'damageQty',
      BACKUP: 'backupQty'
    };
    
    const fieldName = warehouseMap[warehouse];
    return product[fieldName] || 0;
  };

  // Dashboard data
  const getDashboardData = async () => {
    dispatch(setLoading({ key: 'dashboard', value: true }));
    
    try {
      const mockDashboardData = {
        stats: {
          totalProducts: 150,
          totalQuantity: 5000,
          totalValue: 25000,
          totalTransfers: 45,
          pendingTransfers: 8,
          completedTransfers: 35,
          lowStockItems: 12,
          criticalStockItems: 3,
          outOfStockItems: 2
        },
        warehouseStats: [],
        lowStockItems: [],
        recentTransfers: []
      };

      dispatch(setDashboardStats(mockDashboardData.stats));
      dispatch(setWarehouseStats(mockDashboardData.warehouseStats));
      dispatch(setLowStockItems(mockDashboardData.lowStockItems));
      dispatch(setRecentTransfers(mockDashboardData.recentTransfers));

      return { success: true, data: mockDashboardData };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to load dashboard data' 
      };
    } finally {
      dispatch(setLoading({ key: 'dashboard', value: false }));
    }
  };

  // Other helper functions
  const getProductStock = async (product_id: number) => {
    dispatch(setLoading({ key: 'products', value: true }));
    try {
      const mockProduct = {
        id: product_id,
        shegoleMulunehQty: 100,
        embiltaQty: 50,
        newShegoleQty: 75,
        merkatoQty: 25,
        damageQty: 5,
        backupQty: 10,
        totalQty: 265
      };
      return { success: true, data: mockProduct };
    } finally {
      dispatch(setLoading({ key: 'products', value: false }));
    }
  };

  const getWarehouseStock = async (warehouse?: string) => {
    dispatch(setLoading({ key: 'warehouseStock', value: true }));
    try {
      const mockStock = [];
      return { success: true, data: mockStock };
    } finally {
      dispatch(setLoading({ key: 'warehouseStock', value: false }));
    }
  };

  const getTransfers = async () => {
    dispatch(setLoading({ key: 'transfers', value: true }));
    try {
      return { success: true, data: [] };
    } finally {
      dispatch(setLoading({ key: 'transfers', value: false }));
    }
  };

  // Transfer management
  const approveTransfer = async (transferId: number, approved_by: number) => {
    try {
      const mockTransfer = {
        id: transferId,
        status: 'APPROVED',
        approved_by,
        approved_at: new Date().toISOString()
      };
      
      dispatch(updateTransfer(mockTransfer as any));
      return { success: true, transfer: mockTransfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const completeTransfer = async (transferId: number, completedBy: number) => {
    try {
      const mockTransfer = {
        id: transferId,
        status: 'COMPLETED',
        completedBy,
        completed_at: new Date().toISOString()
      };
      
      dispatch(updateTransfer(mockTransfer as any));
      return { success: true, transfer: mockTransfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const rejectTransfer = async (transferId: number, reason: string, rejectedBy: number) => {
    try {
      const mockTransfer = {
        id: transferId,
        status: 'REJECTED',
        reason,
        rejectedBy
      };
      
      dispatch(updateTransfer(mockTransfer as any));
      return { success: true, transfer: mockTransfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const cancelTransfer = async (transferId: number, reason: string, cancelledBy: number) => {
    try {
      const mockTransfer = {
        id: transferId,
        status: 'CANCELLED',
        reason,
        cancelledBy
      };
      
      dispatch(updateTransfer(mockTransfer as any));
      return { success: true, transfer: mockTransfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Filter updates
  const updateFilters = (filters: any) => {
    console.log('Update filters:', filters);
  };

  // Return all required properties
  return {
    // Admin status
    isAdmin,
    
    // Loading states
    warehouseStockLoading: warehouseState.loading.warehouseStock,
    transfersLoading: warehouseState.loading.transfers,
    dashboardLoading: warehouseState.loading.dashboard,
    productStockLoading: warehouseState.loading.products,
    creatingTransfer: warehouseState.creatingTransfer,
    adjustingStock: warehouseState.adjustingStock,
    
    // State data - IMPORTANT: Add these missing properties
    dashboard: warehouseState.dashboardStats,
    productStock: warehouseState.selectedProduct, // Using selectedProduct as productStock
    updatingStock: warehouseState.adjustingStock, // Alias
    
    // Other state
    transfers: warehouseState.transfers,
    warehouseStock: warehouseState.warehouseStock,
    pagination: warehouseState.transferPagination,
    filters: warehouseState.transferFilters,
    
    // Functions
    getDashboardData,
    getProductStock,
    getWarehouseStock,
    getTransfers,
    createTransfer,
    createStockAdjustment,
    updateStock, // Alias for createStockAdjustment
    getWarehouseStockByProduct,
    approveTransfer,
    completeTransfer,
    rejectTransfer,
    cancelTransfer,
    updateFilters,
    
    // Refetch functions
    refetchTransfers: async () => {
      return getTransfers();
    },
    refetchDashboard: async () => {
      return getDashboardData();
    },
    refetchLowStock: async () => {
      return { success: true, data: [] };
    }
  };
};