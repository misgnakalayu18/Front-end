// saleApi.ts - COMPLETE UPDATED VERSION
import { baseApi } from "../baseApi";
import { ISaleApiPaginatedResponse } from "../../../types/sale.type";

const normalizeSaleResponse = (response: any) => {
  console.log("🔍 NORMALIZING API RESPONSE:", {
    statusCode: response?.statusCode,
    success: response?.success,
    hasData: !!response?.data,
    dataKeys: response?.data ? Object.keys(response.data) : [],
    // Check deep structure
    hasDataData: !!response?.data?.data,
    dataDataKeys: response?.data?.data ? Object.keys(response.data.data) : [],
  });

  // BRUTE FORCE - Try ALL possible locations for sales data
  let salesData = null;
  let paginationData = null;

  // Location 1: response.data.data.sales (your actual API structure)
  if (Array.isArray(response?.data?.data?.sales)) {
    console.log("✅ Found sales at: response.data.data.sales");
    salesData = response.data.data.sales;
    paginationData = {
      page: response.data.data.page || 1,
      total: response.data.data.total || salesData.length,
      pages: response.data.data.pages || 1,
      limit: response.data.data.limit || 10,
    };
  }
  // Location 2: response.data.sales
  else if (Array.isArray(response?.data?.sales)) {
    console.log("✅ Found sales at: response.data.sales");
    salesData = response.data.sales;
    paginationData = {
      page: response.data.page || 1,
      total: response.data.total || salesData.length,
      pages: response.data.pages || 1,
      limit: response.data.limit || 10,
    };
  }
  // Location 3: response.sales
  else if (Array.isArray(response?.sales)) {
    console.log("✅ Found sales at: response.sales");
    salesData = response.sales;
    paginationData = response.pagination || {};
  }
  // Location 4: response.data.transactions (old structure)
  else if (Array.isArray(response?.data?.transactions)) {
    console.log("✅ Found transactions at: response.data.transactions");
    salesData = response.data.transactions;
    paginationData = response.data.pagination || {};
  }

  if (salesData) {
    return {
      success: true,
      data: {
        sales: salesData,
        transactions: salesData, // For backward compatibility
        total: salesData.length,
        pagination: paginationData,
      },
    };
  }

  // No data found
  console.warn("❌ No sales data found in any expected location");
  return {
    success: false,
    data: {
      sales: [],
      transactions: [],
      total: salesData.length,
      pagination: {},
    },
  };
};

const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== SALES CRUD OPERATIONS ====================
    getAllSale: builder.query({
      query: (query) => ({
        url: "/sales",
        method: "GET",
        params: query,
      }),
      providesTags: ["sale"],
      transformResponse: normalizeSaleResponse,
    }),

    getSaleById: builder.query({
      query: (id) => ({
        url: `/sales/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "sale", id }],
      transformResponse: (response: any) => {
        console.log("📦 Single sale response:", response);
        // Return normalized data for consistency
        if (response?.success && response.data) {
          return {
            success: true,
            data: response.data,
          };
        }
        return response;
      },
    }),

    createSale: builder.mutation({
      query: (payload) => ({
        url: "/sales",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["sale", "product"],
      transformResponse: (response: any) => {
        console.log("📦 Create sale response:", response);
        return response;
      },
    }),

    createBulkSale: builder.mutation({
      query: (payload) => ({
        url: "/sales/bulk",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["sale", "product"],
      transformResponse: (response: any) => {
        console.log("📦 Create bulk sale response:", response);
        return response;
      },
    }),

    updateSale: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/sales/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Update sale response:", response);
        return response;
      },
    }),

    deleteSale: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["sale", "product"],
      transformResponse: (response: any) => {
        console.log("📦 Delete sale response:", response);
        return response;
      },
    }),

    // ==================== SALES SUMMARY & ANALYTICS ====================
    getSalesSummary: builder.query({
      query: () => ({
        url: `/sales/summary`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Sales summary response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getSalesAnalytics: builder.query({
      query: (params) => ({
        url: `/sales/analytics`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Sales analytics response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== PERIOD-BASED REPORTS ====================
    getSalesByPeriod: builder.query({
      query: ({ period, year, month }) => ({
        url: `/sales/period/${period}`,
        method: "GET",
        params: { year, month },
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Period sales response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // Consolidated report endpoint
    getSalesReport: builder.query({
      query: (params) => ({
        url: `/sales/reports/periodic`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Sales report response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== LEGACY REPORTS (for backward compatibility) ====================
    yearlySale: builder.query({
      query: () => ({
        url: `/sales/yearly-sale`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Yearly sale response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    monthlySale: builder.query({
      query: (params) => ({
        url: `/sales/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Monthly sale response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    weeklySale: builder.query({
      query: (params) => ({
        url: `/sales/weeks`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Weekly sale response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    dailySale: builder.query({
      query: (params) => ({
        url: `/sales/daily`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Daily sale response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== NEW REPORT ENDPOINTS ====================
    getDailyReport: builder.query({
      query: (params) => ({
        url: `/sales/reports/daily`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Daily report response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getWeeklyReport: builder.query({
      query: (params) => ({
        url: `/sales/reports/weekly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Weekly report response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getMonthlyReport: builder.query({
      query: (params) => ({
        url: `/sales/reports/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Monthly report response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== PRODUCT REPORTS ====================
    getProductReports: builder.query({
      query: (params) => ({
        url: `/sales/reports/products`,
        method: "GET",
        params,
      }),
      providesTags: ["sale", "product"],
      transformResponse: (response: any) => {
        console.log("📦 Product reports response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getSalesByProductCode: builder.query({
      query: (code) => ({
        url: `/sales/reports/products/${code}`,
        method: "GET",
      }),
      providesTags: (result, error, code) => [{ type: "sale", id: code }],
      transformResponse: (response: any) => {
        console.log("📦 Sales by product code response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== TIME-BASED ANALYTICS ====================
    getYears: builder.query({
      query: () => ({
        url: `/sales/analytics/years`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Years response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getRecentSales: builder.query({
      query: (params) => ({
        url: `/sales/analytics/recent`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Recent sales response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== PAYMENT MANAGEMENT ====================
    getPendingPayments: builder.query({
      query: () => ({
        url: `/sales/payments/pending`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Pending payments response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    recordRepayment: builder.mutation({
      query: ({ saleId, ...payload }) => ({
        url: `/repayments/repay`, // Changed from /sales/:saleId/repay
        method: "POST",
        body: {
          ...payload,
          saleId, // Include saleId in the body instead of URL
        },
      }),
      invalidatesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Record repayment response:", response);
        return response;
      },
    }),

    // Legacy pending payments endpoint
    pendingPayments: builder.query({
      query: () => ({
        url: `/sales/pending-payments`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Legacy pending payments response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    // ==================== NEW FEATURES (Flexible Pricing & Negative Stock) ====================
    getCustomPriceSales: builder.query({
      query: (params) => ({
        url: `/sales/flexible-pricing/custom-price`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Custom price sales response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getNegativeStockSales: builder.query({
      query: (params) => ({
        url: `/sales/flexible-pricing/negative-stock`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Negative stock sales response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getBulkDiscountSales: builder.query({
      query: (params) => ({
        url: `/sales/flexible-pricing/bulk-discount`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Bulk discount sales response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getSalesStatistics: builder.query({
      query: (params) => ({
        url: `/sales/flexible-pricing/statistics`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Sales statistics response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),

    getDashboardSummary: builder.query({
      query: (params) => ({
        url: `/sales/flexible-pricing/dashboard`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📦 Dashboard summary response:", response);
        if (response?.success) {
          return {
            success: true,
            data: response.data || response,
          };
        }
        return response;
      },
    }),
  }),
});

export const {
  // Sales CRUD
  useGetAllSaleQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useCreateBulkSaleMutation,

  // Summary & Analytics
  useGetSalesSummaryQuery,
  useGetSalesAnalyticsQuery,

  // Period-based Reports
  useGetSalesByPeriodQuery,
  useGetSalesReportQuery,

  // Legacy period queries
  useYearlySaleQuery,
  useMonthlySaleQuery,
  useWeeklySaleQuery,
  useDailySaleQuery,

  // New report endpoints
  useGetDailyReportQuery,
  useGetWeeklyReportQuery,
  useGetMonthlyReportQuery,

  // Product Reports
  useGetProductReportsQuery,
  useGetSalesByProductCodeQuery,

  // Time-based Analytics
  useGetYearsQuery,
  useGetRecentSalesQuery,

  // Payment Management
  useGetPendingPaymentsQuery,
  useRecordRepaymentMutation,
  usePendingPaymentsQuery,

  // New Features
  useGetCustomPriceSalesQuery,
  useGetNegativeStockSalesQuery,
  useGetBulkDiscountSalesQuery,
  useGetSalesStatisticsQuery,
  useGetDashboardSummaryQuery,
} = saleApi;

export default saleApi;
