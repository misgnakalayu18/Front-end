import { MenuProps, message } from "antd";
import {
  ExportOutlined,
  FilterOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { SaleRecord } from "../../types/sale.type";
import * as XLSX from 'xlsx';

// Define the statistics interface
export interface SalesStats {
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  paymentRatio: number;
  transactionCount: number;
  paymentMethodStats: Record<string, number>;
  outstandingDebts: number;
  partialPaymentsCount: number;
  splitPaymentsCount: number;
  totalSplitAmount: number;
  averageSplitAmount: number;
  totalSales: number;
  averageSale: number;
  totalCredit: number;
}

export class SalesExport {
  // ========== STATISTICS CALCULATION ==========
  static calculateStats(data: SaleRecord[]): SalesStats {
    if (data.length === 0) {
      return this.getEmptyStats();
    }

    const totalRevenue = this.sumByField(data, "totalPrice");
    const totalPaid = this.sumByField(data, "paidAmount");
    const totalRemaining = this.sumByField(data, "remainingAmount");
    const paymentRatio = totalRevenue > 0 ? totalPaid / totalRevenue : 0;

    const paymentMethodStats = this.calculatePaymentMethodStats(
      data,
      totalPaid,
    );
    const outstandingDebts = this.calculateOutstandingDebts(data);
    const partialPaymentsCount = this.countPartialPayments(data);
    const splitPayments = this.getSplitPayments(data);
    const splitPaymentsCount = splitPayments.length;
    const totalSplitAmount = this.sumByField(splitPayments, "totalPrice");

    return {
      totalRevenue,
      totalPaid,
      totalRemaining,
      paymentRatio,
      transactionCount: data.length,
      paymentMethodStats,
      outstandingDebts,
      partialPaymentsCount,
      splitPaymentsCount,
      totalSplitAmount,
      averageSplitAmount:
        splitPaymentsCount > 0 ? totalSplitAmount / splitPaymentsCount : 0,
      totalSales: data.length,
      averageSale: data.length > 0 ? totalRevenue / data.length : 0,
      totalCredit: totalRemaining,
    };
  }

  // ========== EXPORT MENU CONFIGURATION ==========
  static getExportMenuItems(
    data: SaleRecord[],
    hasFilters: boolean = false,
    exportLoading: boolean = false,
  ): MenuProps["items"] {
    return [
      {
        key: "current_page",
        label: "Export Current Page",
        icon: <ExportOutlined />,
        disabled: exportLoading || data.length === 0,
      },
      {
        key: "filtered_data",
        label: "Export All Filtered Data",
        icon: <FilterOutlined />,
        disabled: exportLoading || !hasFilters,
        title: hasFilters
          ? "Export all data matching current filters"
          : "No filters applied",
      },
      {
        key: "all_data",
        label: "Export All Sales Data",
        icon: <DatabaseOutlined />,
        disabled: exportLoading,
      },
    ];
  }

  // ========== MAIN EXPORT HANDLER ==========
  static async handleExport(
    type: string,
    currentData: SaleRecord[],
    query: any,
    totalItems: number,
    totalPages: number,
    fetchAllFilteredData?: () => Promise<SaleRecord[]>,
    fetchAllData?: () => Promise<SaleRecord[]>,
  ): Promise<void> {
    try {
      let dataToExport: SaleRecord[] = [];
      let exportType = "";

      switch (type) {
        case "current_page":
          dataToExport = currentData;
          exportType = "Current Page";
          break;

        case "filtered_data":
          if (fetchAllFilteredData) {
            message.loading({ content: "Fetching all filtered sales data...", key: "export" });
            dataToExport = await fetchAllFilteredData();
            message.success({ content: `Found ${dataToExport.length} records`, key: "export" });
            exportType = "All Filtered Data";
          } else {
            dataToExport = currentData;
            exportType = "Current Filtered Data";
            message.info(
              "Using current page data (full filtered export not available)",
            );
          }
          break;

        case "all_data":
          if (fetchAllData) {
            message.loading({ content: "Fetching all sales data...", key: "export" });
            dataToExport = await fetchAllData();
            message.success({ content: `Found ${dataToExport.length} records`, key: "export" });
            exportType = "All Data";
          } else {
            dataToExport = currentData;
            exportType = "Current Page Data";
            message.info(
              "Using current page data (full data export not available)",
            );
          }
          break;

        default:
          message.warning("Unknown export type");
          return;
      }

      if (dataToExport.length === 0) {
        message.warning(`No data to export for ${exportType}`);
        return;
      }

      // Try Excel export first
      try {
        await this.generateExcelFile(dataToExport, query, exportType, totalItems);
      } catch (excelError) {
        console.warn("Excel export failed, falling back to CSV:", excelError);
        // Fall back to CSV
        await this.generateCSVFallback(dataToExport, query, exportType, totalItems);
      }
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to export data");
      throw error;
    }
  }

  // ========== EXCEL GENERATION ==========
  private static async generateExcelFile(
    data: SaleRecord[],
    query: any,
    exportType: string,
    totalItems: number,
  ): Promise<void> {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create main sales data sheet
      const exportData = this.prepareExportData(data);
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws["!cols"] = this.getColumnWidths();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Data");

      // Add summary sheet
      const summarySheet = this.createSummarySheet(data, query, exportType, totalItems);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Generate filename
      const filename = this.generateFilename(exportType);
      
      // Write file
      XLSX.writeFile(wb, filename);
      
      message.success(`✅ Exported ${data.length} transactions as Excel file!`);
    } catch (error) {
      console.error("❌ Excel generation error:", error);
      throw error; // Re-throw to trigger fallback
    }
  }

  // ========== SUMMARY SHEET ==========
  private static createSummarySheet(
    data: SaleRecord[],
    query: any,
    exportType: string,
    totalItems: number,
  ): XLSX.WorkSheet {
    const stats = this.calculateStats(data);
    const now = new Date();
    
    const summaryData = [
      ["EXPORT SUMMARY"],
      [""],
      ["Export Information"],
      ["Export Date", now.toLocaleDateString()],
      ["Export Time", now.toLocaleTimeString()],
      ["Export Type", exportType],
      ["Total Records in Database", totalItems],
      ["Records Exported", data.length],
      [""],
      ["Filter Information"],
      ["Search Term", query?.search || "None"],
      ["Date Range", query?.startDate && query?.endDate ? `${query.startDate} to ${query.endDate}` : "All"],
      ["Payment Method", query?.paymentMethod || "All"],
      ["Payment Status", query?.paymentStatus || "All"],
      [""],
      ["SALES STATISTICS"],
      ["Total Revenue", `ETB ${stats.totalRevenue.toLocaleString()}`],
      ["Total Paid", `ETB ${stats.totalPaid.toLocaleString()}`],
      ["Total Remaining", `ETB ${stats.totalRemaining.toLocaleString()}`],
      ["Payment Ratio", `${(stats.paymentRatio * 100).toFixed(2)}%`],
      ["Average Sale Value", `ETB ${stats.averageSale.toLocaleString()}`],
      ["Total Transactions", stats.transactionCount],
      [""],
      ["PAYMENT BREAKDOWN"],
      ["Payment Method", "Amount (ETB)", "Percentage"],
      ...Object.entries(stats.paymentMethodStats).map(([method, amount]) => [
        method,
        amount.toLocaleString(),
        `${((amount / stats.totalPaid) * 100).toFixed(2)}%`
      ]),
      [""],
      ["SPLIT PAYMENT SUMMARY"],
      ["Split Payments Count", stats.splitPaymentsCount],
      ["Total Split Amount", `ETB ${stats.totalSplitAmount.toLocaleString()}`],
      ["Average Split Amount", `ETB ${stats.averageSplitAmount.toLocaleString()}`],
      [""],
      ["CREDIT SUMMARY"],
      ["Outstanding Debts", `ETB ${stats.outstandingDebts.toLocaleString()}`],
      ["Partial Payments", stats.partialPaymentsCount],
      ["Total Credit", `ETB ${stats.totalCredit.toLocaleString()}`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
    
    return ws;
  }

  // ========== CSV FALLBACK ==========
  private static async generateCSVFallback(
    data: SaleRecord[],
    query: any,
    exportType: string,
    totalItems: number,
  ): Promise<void> {
    try {
      const csvContent = this.createCSVContent(data);
      const filename = this.generateFilename(exportType).replace('.xlsx', '.csv');

      // Add summary as comments at the top of CSV
      const stats = this.calculateStats(data);
      const summary = [
        `# Export Type: ${exportType}`,
        `# Date: ${new Date().toLocaleDateString()}`,
        `# Total Records: ${data.length}`,
        `# Total Revenue: ETB ${stats.totalRevenue.toLocaleString()}`,
        `# Total Paid: ETB ${stats.totalPaid.toLocaleString()}`,
        `# Total Remaining: ETB ${stats.totalRemaining.toLocaleString()}`,
        `#`,
        ``,
        csvContent
      ].join('\n');

      this.downloadFile(summary, filename, "text/csv;charset=utf-8;");
      message.success(`✅ Exported ${data.length} transactions as CSV file (Excel format failed, fallback used)`);
    } catch (error) {
      console.error("CSV fallback error:", error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  private static getEmptyStats(): SalesStats {
    return {
      totalRevenue: 0,
      totalPaid: 0,
      totalRemaining: 0,
      paymentRatio: 0,
      transactionCount: 0,
      paymentMethodStats: {},
      outstandingDebts: 0,
      partialPaymentsCount: 0,
      splitPaymentsCount: 0,
      totalSplitAmount: 0,
      averageSplitAmount: 0,
      totalSales: 0,
      averageSale: 0,
      totalCredit: 0,
    };
  }

  private static sumByField(
    data: SaleRecord[],
    field: keyof SaleRecord,
  ): number {
    return data.reduce((sum, item) => sum + ((item[field] as number) || 0), 0);
  }

  private static calculatePaymentMethodStats(
    data: SaleRecord[],
    totalPaid: number,
  ): Record<string, number> {
    return data.reduce(
      (acc, item) => {
        const method = item.paymentMethod || "OTHER";
        acc[method] = (acc[method] || 0) + item.paidAmount;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private static calculateOutstandingDebts(data: SaleRecord[]): number {
    return data
      .filter((t) => t.remainingAmount > 0)
      .reduce((sum, t) => sum + t.remainingAmount, 0);
  }

  private static countPartialPayments(data: SaleRecord[]): number {
    return data.filter(
      (t) => t.paymentStatus === "PARTIAL" || t.remainingAmount > 0,
    ).length;
  }

  private static getSplitPayments(data: SaleRecord[]): SaleRecord[] {
    return data.filter((t) => t.isSplitPayment);
  }

  private static prepareExportData(data: SaleRecord[]): any[] {
    return data.map((item, index) => ({
      "No.": index + 1,
      "Transaction ID": item.id,
      "Transaction Code": item.code,
      "Product Name": item.productName,
      "Buyer": item.buyerName,
      "Ctn": item.ctn,
      "Quantity": item.quantity,
      "Unit": item.unit,
      "Unit Price": item.productPrice,
      "Total Price": item.totalPrice,
      "Paid Amount": item.paidAmount,
      "Remaining Amount": item.remainingAmount,
      "Payment Status": item.paymentStatus,
      "Payment Method": item.paymentMethod,
      "Is Split Payment": item.isSplitPayment ? "Yes" : "No",
      "Bank Name": item.bankName || "",
      "Casher Name": item.casherName,
      "Receiver Name": item.recieverName || "", // Fixed: using recieverName
      "Seller": item.sellerName,
      "Sale Date": item.date,
      "Split Count": item.paymentSplits?.length || 0,
    }));
  }

  private static getColumnWidths(): { wch: number }[] {
    return [
      { wch: 5 },   // No.
      { wch: 15 },  // Transaction ID
      { wch: 20 },  // Transaction Code
      { wch: 30 },  // Product Name
      { wch: 20 },  // Buyer
      { wch: 8 },   // Ctn
      { wch: 10 },  // Quantity
      { wch: 8 },   // Unit
      { wch: 15 },  // Unit Price
      { wch: 15 },  // Total Price
      { wch: 15 },  // Paid Amount
      { wch: 15 },  // Remaining Amount
      { wch: 12 },  // Payment Status
      { wch: 15 },  // Payment Method
      { wch: 15 },  // Is Split Payment
      { wch: 20 },  // Bank Name
      { wch: 20 },  // Casher Name
      { wch: 20 },  // Receiver Name
      { wch: 20 },  // Seller
      { wch: 15 },  // Sale Date
      { wch: 10 },  // Split Count
    ];
  }

  private static generateFilename(exportType: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const typeSlug = exportType.toLowerCase().replace(/ /g, "_");
    return `sales_${typeSlug}_${timestamp}.xlsx`;
  }

  private static createCSVContent(data: SaleRecord[]): string {
    const headers = [
      "No.",
      "Transaction ID",
      "Transaction Code",
      "Product Name",
      "Buyer",
      "Ctn",
      "Quantity",
      "Unit",
      "Unit Price",
      "Total Price",
      "Paid Amount",
      "Remaining Amount",
      "Payment Status",
      "Payment Method",
      "Is Split Payment",
      "Bank Name",
      "Casher Name",
      "Receiver Name",
      "Seller",
      "Date",
      "Split Count",
    ];

    const rows = data.map((item, index) => [
      index + 1,
      item.id,
      item.code,
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.buyerName.replace(/"/g, '""')}"`,
      item.ctn,
      item.quantity,
      item.unit,
      item.productPrice,
      item.totalPrice,
      item.paidAmount,
      item.remainingAmount,
      item.paymentStatus,
      item.paymentMethod,
      item.isSplitPayment ? "Yes" : "No",
      item.bankName || "",
      item.casherName,
      item.recieverName || "", // Fixed: using recieverName
      item.sellerName,
      item.date,
      item.paymentSplits?.length || 0,
    ]);

    return [headers, ...rows].map(row => row.join(",")).join("\n");
  }

  private static downloadFile(
    content: string,
    filename: string,
    mimeType: string,
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}