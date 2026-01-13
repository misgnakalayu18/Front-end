// client/src/redux/services/bulkUploadService.ts
import { CSVProductData } from '../../types/product.types';

export class BulkUploadService {
  static async processBulkProducts(
    csvData: CSVProductData[], 
    userId: number
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      // Call your new backend endpoint
      const response = await fetch('/api/upload/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if needed
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          data: csvData,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      // Handle network errors
      return {
        success: 0,
        failed: csvData.length,
        errors: [`Network error: ${error.message}`]
      };
    }
  }

  // You can keep client-side validation here (optional)
  static validateCSVData(csvData: CSVProductData[]): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    // ... (your client-side validation logic, but NO database checks)
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}