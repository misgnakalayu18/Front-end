import { baseApi } from '../baseApi';

export interface GenerateReportPayload {
  startDate: string;
  endDate: string;
  reportType?: 'sales' | 'inventory' | 'financial';
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      totalRevenue: number;
      totalPaid: number;
      totalCredit: number;
      totalQuantity: number;
      totalTransactions: number;
      averageTransactionValue: number;
      dateRange: {
        startDate: string;
        endDate: string;
        startDateObj?: Date;
        endDateObj?: Date;
      };
      paymentMethodTotals?: Record<string, { revenue: number; count: number }>;
    };
    revenueByPaymentMethod: Array<{
      paymentMethod: string;
      product_id?: number;
      productCode: string;
      productName: string;
      productPrice: number;
      totalRevenue: number;
      quantity: number;
      count: number;
    }>;
    detailedSales: Array<{
      id: number;
      date: string;
      totalPrice: number;
      paidAmount: number;
      remainingAmount: number;
      quantity: number;
      paymentMethod: string;
      paymentStatus?: string;
      buyerName: string;
      createdAt: string;
      product: {
        id: number;
        name: string;
        code: string;
        price: number;
      };
      user?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
      };
    }>;
    analytics: {
      dailySales: Array<{
        date: string;
        revenue: number;
        quantity: number;
        transactions?: number;
      }>;
      topProducts: Array<{
        product_id?: number;
        productCode: string;
        productName: string;
        totalRevenue: number;
        totalQuantity: number;
        salesCount: number;
      }>;
      paymentMethodDistribution?: Record<string, {
        totalRevenue: number;
        totalCount: number;
        items: Array<{
          productName: string;
          revenue: number;
          quantity: number;
        }>;
      }>;
    };
    metadata: {
      generatedAt: string;
      filters: {
        startDate?: Date;
        endDate?: Date;
        reportType?: string;
      };
      recordCount: {
        detailedSales: number;
        revenueEntries: number;
        dailySales: number;
        topProducts: number;
      };
    };
  };
}

const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateReport: builder.mutation<ReportResponse, GenerateReportPayload>({
      query: (payload) => ({
        url: '/reports/generate',
        method: 'GET',
        params: {
          startDate: payload.startDate,
          endDate: payload.endDate,
          reportType: payload.reportType || 'sales',
        },
      }),
      invalidatesTags: ['Report'],
    }),

    // Generate and download report in specific format
    downloadReport: builder.mutation<Blob, GenerateReportPayload & { format: 'pdf' | 'excel' }>({
      query: (payload) => ({
        url: '/reports/generate',
        method: 'GET',
        params: {
          startDate: payload.startDate,
          endDate: payload.endDate,
          reportType: payload.reportType || 'sales',
          export: payload.format,
        },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Get dashboard statistics (lightweight version)
    getDashboardStats: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string }) => ({
        url: '/reports/dashboard-stats',
        method: 'GET',
        params: {
          startDate,
          endDate,
        },
      }),
      providesTags: ['Dashboard'],
    }),

    // Get sales report (alias for generateReport)
    getSalesReport: builder.query<ReportResponse, GenerateReportPayload>({
      query: (payload) => ({
        url: '/reports/sales',
        method: 'GET',
        params: {
          startDate: payload.startDate,
          endDate: payload.endDate,
        },
      }),
      providesTags: ['Report'],
    }),

    // Get inventory report
    getInventoryReport: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string }) => ({
        url: '/reports/generate',
        method: 'GET',
        params: {
          startDate,
          endDate,
          reportType: 'inventory',
        },
      }),
      providesTags: ['Report'],
    }),

    // Get financial report
    getFinancialReport: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string }) => ({
        url: '/reports/generate',
        method: 'GET',
        params: {
          startDate,
          endDate,
          reportType: 'financial',
        },
      }),
      providesTags: ['Report'],
    }),

    // Get report by month
    getMonthlyReport: builder.query({
      query: ({ year, month }: { year: number; month: number }) => ({
        url: '/reports/monthly',
        method: 'GET',
        params: { year, month },
      }),
      providesTags: ['MonthlyReport'],
    }),

    // Get report by year
    getYearlyReport: builder.query({
      query: ({ year }: { year: number }) => ({
        url: '/reports/yearly',
        method: 'GET',
        params: { year },
      }),
      providesTags: ['YearlyReport'],
    }),

    // Get quick stats (for dashboard widgets)
    getQuickStats: builder.query({
      query: () => ({
        url: '/reports/quick-stats',
        method: 'GET',
      }),
      providesTags: ['QuickStats'],
    }),

    // Get top products
    getTopProducts: builder.query({
      query: ({ limit = 10, startDate, endDate }: { limit?: number; startDate?: string; endDate?: string }) => ({
        url: '/reports/top-products',
        method: 'GET',
        params: { limit, startDate, endDate },
      }),
      providesTags: ['TopProducts'],
    }),

    // Get payment method summary
    getPaymentMethodSummary: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string }) => ({
        url: '/reports/payment-methods',
        method: 'GET',
        params: { startDate, endDate },
      }),
      providesTags: ['PaymentMethods'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGenerateReportMutation,
  useDownloadReportMutation,
  useGetDashboardStatsQuery,
  useGetSalesReportQuery,
  useGetInventoryReportQuery,
  useGetFinancialReportQuery,
  useGetMonthlyReportQuery,
  useGetYearlyReportQuery,
  useGetQuickStatsQuery,
  useGetTopProductsQuery,
  useGetPaymentMethodSummaryQuery,
} = reportApi;