// services/csvMappingService.ts
import { Warehouse, CSVProductData, ProcessedProductData } from '../../types/product.types';

export class CSVMappingService {
  static mapCSVToProduct(csvData: CSVProductData, userId: number): ProcessedProductData {
    // Validate and map CSV headers to product fields
    const code = csvData.code?.trim();
    const name = csvData.productName?.trim();
    const price = this.parseNumber(csvData.price, 'Price');
    const qty = this.parseNumber(csvData.qty, 'Quantity');
    const totalPrice = this.parseNumber(csvData.totalPrice, 'Total Price') || price * qty;
    const warehouse = this.mapWarehouse(csvData.warehouse);
    const unit = csvData.unit?.trim() || 'PC'; // Add default value
    const ctn = csvData.ctn ? this.parseNumber(csvData.ctn, 'CTN') : 1; // Add default value

    // Validate required fields
    if (!code) throw new Error('Product code is required');
    if (!name) throw new Error('Product name is required');
    if (price === null) throw new Error('Valid price is required');
    if (qty === null) throw new Error('Valid quantity is required');

    return {
      code,
      name,
      warehouse,
      price,
      qty,
      totalPrice,
      userId,
      unit: unit as any, // Cast to Unit enum
      ctn
    };
  }

  private static parseNumber(value: string, fieldName: string): number | null {
    if (!value?.trim()) return null;
    
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num) || num < 0) {
      throw new Error(`${fieldName} must be a valid positive number`);
    }
    
    return num;
  }

  private static mapWarehouse(warehouse: string): Warehouse {
    const warehouseMap: { [key: string]: Warehouse } = {
      // Direct matches
      'SHEGOLE_MULUNEH': Warehouse.SHEGOLE_MULUNEH,
      'EMBILTA': Warehouse.EMBILTA,
      'NEW_SHEGOLE': Warehouse.NEW_SHEGOLE,
      'MERKATO': Warehouse.MERKATO,
      'DAMAGE': Warehouse.DAMAGE,
      'BACKUP': Warehouse.BACKUP,
      
      // Alternative spellings/abbreviations
      'SHEGOLE': Warehouse.SHEGOLE_MULUNEH,
      'SHEGOLE MULUNEH': Warehouse.SHEGOLE_MULUNEH,
      'NEW SHEGOLE': Warehouse.NEW_SHEGOLE,
    };

    const normalizedWarehouse = warehouse?.trim().toUpperCase().replace(/\s+/g, '_');
    return warehouseMap[normalizedWarehouse] || Warehouse.SHEGOLE_MULUNEH;
  }

  static validateCSVHeaders(headers: string[]): boolean {
    const requiredHeaders = ['code', 'productName', 'warehouse', 'unit', 'qty', 'price'];
    const actualHeaders = headers.map(h => h.toLowerCase().trim());
    
    return requiredHeaders.every(header => 
      actualHeaders.includes(header.toLowerCase())
    );
  }

  // Helper to get display names for warehouses
  static getWarehouseDisplayName(warehouse: Warehouse): string {
    const displayNames = {
      [Warehouse.SHEGOLE_MULUNEH]: 'SHEGOLE_MULUNEH',
      [Warehouse.EMBILTA]: 'EMBILTA',
      [Warehouse.NEW_SHEGOLE]: 'NEW_SHEGOLE',
      [Warehouse.MERKATO]: 'MERKATO',
      [Warehouse.DAMAGE]: 'DAMAGE',
      [Warehouse.BACKUP]: 'BACKUP',
    };
    
    return displayNames[warehouse];
  }
}