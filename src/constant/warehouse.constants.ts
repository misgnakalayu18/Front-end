import { Warehouse, TransferStatus } from '../types/warehouse.types';

export const WAREHOUSES: Warehouse[] = [
  Warehouse.SHEGOLE_MULUNEH,
  Warehouse.EMBILTA,
  Warehouse.NEW_SHEGOLE,
  Warehouse.MERKATO,
  Warehouse.DAMAGE,
  Warehouse.BACKUP
];

export const WAREHOUSE_LABELS: Record<Warehouse, string> = {
  [Warehouse.SHEGOLE_MULUNEH]: 'Shegole Muluneh',
  [Warehouse.EMBILTA]: 'Embilta',
  [Warehouse.NEW_SHEGOLE]: 'New Shegole',
  [Warehouse.MERKATO]: 'Merkato (Main)',
  [Warehouse.DAMAGE]: 'Damage Storage',
  [Warehouse.BACKUP]: 'Backup Storage'
};

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'Pending',
  [TransferStatus.APPROVED]: 'Approved',
  [TransferStatus.COMPLETED]: 'Completed',
  [TransferStatus.REJECTED]: 'Rejected',
  [TransferStatus.CANCELLED]: 'Cancelled'
};

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'blue',
  [TransferStatus.APPROVED]: 'orange',
  [TransferStatus.COMPLETED]: 'green',
  [TransferStatus.REJECTED]: 'red',
  [TransferStatus.CANCELLED]: 'gray'
};

export const STOCK_STATUS_COLORS: Record<string, string> = {
  'OK': 'green',
  'LOW': 'orange',
  'REORDER': 'red',
  'OUT_OF_STOCK': 'gray',
  'DAMAGE': 'purple',
  'BACKUP': 'blue'
};

export const ADJUSTMENT_TYPES = [
  { value: 'SET', label: 'Set to' },
  { value: 'ADD', label: 'Add' },
  { value: 'SUBTRACT', label: 'Subtract' }
] as const;

export const API_ENDPOINTS = {
  TRANSFER: '/api/warehouse/transfer',
  STOCK: '/api/warehouse/stock',
  DASHBOARD: '/api/warehouse/dashboard',
  STATS: '/api/warehouse/stats',
  ALTERNATIVES: '/api/warehouse/alternatives',
  HISTORY: '/api/warehouse/history'
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_STOCK_PAGE_SIZE = 20;