// types/product.types.ts
// In your product.types.ts
export interface IProduct {
  id?: number;
  code: string;
  name: string;
  price: number;
  qty: number; // pieces per carton
  ctn?: number; // number of cartons
  unit?: string;
  merkatoQty: number; // available pieces in Merkato
  shegoleMulunehQty?: number;
  embiltaQty?: number;
  newShegoleQty?: number;
  backupQty?: number;
  damageQty?: number;
  totalQty?: number;
  warehouse?: string;
  minStockLevel?: number;
  reorderPoint?: number;
  createdAt?: string;
  updatedAt?: string;
  default_price?: number;
  min_sale_price?: number;
  max_sale_price?: number;
  totalPrice?: number;
  remark?: string;
  userId?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Updated warehouse types
export type TWarehouse = 
  | 'SHEGOLE_MULUNEH' 
  | 'EMBILTA' 
  | 'NEW_SHEGOLE' 
  | 'MERKATO' 
  | 'DAMAGE' 
  | 'BACKUP';

export enum Warehouse {
  SHEGOLE_MULUNEH = 'SHEGOLE_MULUNEH',
  EMBILTA = 'EMBILTA',
  NEW_SHEGOLE = 'NEW_SHEGOLE',
  MERKATO = 'MERKATO',
  DAMAGE = 'DAMAGE',
  BACKUP = 'BACKUP'
}

export enum Unit {
  PIECE = 'PC',
  DOZEN = 'DOZ',
  SET = 'SET'
}

export interface CreateProductData {
  userId: number;
  code: string;
  name: string;
  price: number;
  unit: Unit;
  ctn: number;
  qty: number;
  totalPrice: number;
  warehouse?: Warehouse;
}

export interface UpdateProductData {
  code?: string;
  name?: string;
  Unit?: Unit;
  ctn?: number;
  price?: number;
  qty?: number;
  totalPrice?: number;
  warehouse?: Warehouse;
}

// Bulk upload types
export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    success: number;
    failed: number;
    errors: string[];
  };
}

export interface CSVProductData {
  code: string;
  productName: string;
  warehouse: string;
  unit: string;
  qty: string;
  ctn: string;
  price: string;
  totalPrice: string;
  remark?: string;
}

export interface ProcessedProductData {
  code: string;
  name: string;
  warehouse: Warehouse;
  unit: Unit;
  qty: number;
  ctn: number;
  price: number;
  totalPrice: number;
  userId: number;
}

// Update ICurrentStockInfo to use snake_case
export interface ICurrentStockInfo {
  qty: number;
  ctn: number;
  totalQty: number; // Keep as totalQty for frontend display
  warehouse: string;
  // Add both snake_case and camelCase for flexibility
  merkato_qty: number;
  embilta_qty: number;
  shegole_muluneh_qty: number;
  new_shegole_qty: number;
  damage_qty: number;
  backup_qty: number;
  
  // Computed camelCase versions (optional)
  merkatoQty?: number;
  embiltaQty?: number;
  shegoleMulunehQty?: number;
  newShegoleQty?: number;
  damageQty?: number;
  backupQty?: number;
  total_qty?: number;
}