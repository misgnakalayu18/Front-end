// utils/warehouse.utils.ts
// Remove or update the problematic functions

// Example: Update the calculateTotalValue function
export const calculateTotalValue = (productStock: any, price: number): number => {
  if (!productStock || !price) return 0;
  // If productStock has quantity property
  return (productStock.quantity || 0) * price;
};

// Or if productStock is actually a Product with warehouse quantities:
export const calculateProductTotalValue = (product: any): number => {
  if (!product || !product.price) return 0;
  
  const totalQty = product.totalQty || 
    (product.shegoleMulunehQty || 0) +
    (product.embiltaQty || 0) +
    (product.newShegoleQty || 0) +
    (product.merkatoQty || 0) +
    (product.damageQty || 0) +
    (product.backupQty || 0);
    
  return totalQty * product.price;
};

// Update getWarehouseStock function
export const getWarehouseStock = (product: any, warehouse: string): number => {
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

// Update getAllWarehouseStock function
export const getAllWarehouseStock = (product: any): Array<{warehouse: string, quantity: number}> => {
  if (!product) return [];
  
  const warehouses = [
    { key: 'SHEGOLE_MULUNEH', name: 'Shegole Muluneh', field: 'shegoleMulunehQty' },
    { key: 'EMBILTA', name: 'Embilta', field: 'embiltaQty' },
    { key: 'NEW_SHEGOLE', name: 'New Shegole', field: 'newShegoleQty' },
    { key: 'MERKATO', name: 'Merkato', field: 'merkatoQty' },
    { key: 'DAMAGE', name: 'Damage', field: 'damageQty' },
    { key: 'BACKUP', name: 'Backup', field: 'backupQty' }
  ];
  
  return warehouses.map(w => ({
    warehouse: w.key,
    quantity: product[w.field] || 0
  }));
};