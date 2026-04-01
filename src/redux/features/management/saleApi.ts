import { baseApi } from "../baseApi";
import {
  NormalizedSaleResponse,
  ISaleApiResponse,
  ISaleApiPaginatedResponse,
  MonthlyResponse,
  DailyBreakdownItem,
} from "../../../types/sale.type";

// ✅ FIXED NORMALIZATION - Based on your actual API response structure
const normalizeSaleResponse = (response: ISaleApiPaginatedResponse): NormalizedSaleResponse => {
  console.log("🔍 API Response Structure:", {
    success: response?.success,
    statusCode: response?.statusCode,
    message: response?.message,
    hasData: !!response?.data,
    salesCount: response?.data?.sales?.length || 0,
    pagination: response?.data?.pagination,
    meta: response?.data?.meta,
  });

  // ✅ Your exact API response structure (with pagination object)
  if (response?.success && response?.data) {
    const sales = response.data.sales || [];
    const pagination = response.data.pagination;
    const meta = response.data.meta;
    
    if (pagination) {
      return {
        success: response.success,
        data: {
          sales: sales,
          total: pagination.total || 0,
          page: pagination.page || 1,
          pages: pagination.totalPages || 1,
          limit: pagination.limit || 10,
          meta: meta || {}
        },
      };
    }
    
    // Fallback to old structure
    return {
      success: response.success,
      data: {
        sales: sales,
        total: (response.data as any).total || 0,
        page: (response.data as any).page || 1,
        pages: (response.data as any).pages || 1,
        limit: (response.data as any).limit || 10,
        meta: meta || {}
      },
    };
  }

  // ❌ No valid data found
  console.warn("❌ No valid sales data found. Returning empty array.");
  return {
    success: false,
    data: {
      sales: [],
      total: 0,
      page: 1,
      pages: 1,
      limit: 10,
      meta: {}
    },
  };
};

// ✅ Special normalization for monthly endpoint
const normalizeMonthlyResponse = (response: any): MonthlyResponse => {
  console.log("📅 Monthly Response:", response);
  
  if (response?.success && response?.data) {
    // Ensure daily_breakdown is properly typed
    const dailyBreakdown = (response.data.daily_breakdown || []).map((item: any) => ({
      sale_date: item.sale_date,
      day: item.day,
      transaction_count: item.transaction_count,
      total_revenue: Number(item.total_revenue) || 0,
      total_quantity: Number(item.total_quantity) || 0,
      total_cartons: Number(item.total_cartons) || 0,
      payment_methods: item.payment_methods || '',
      split_methods: item.split_methods || '',
      primary_payment_method: item.primary_payment_method || 'UNKNOWN',
      average_transaction_value: Number(item.average_transaction_value) || 0,
    }));

    return {
      success: true,
      message: response.message || "Monthly data retrieved successfully",
      data: {
        month: response.data.month || '',
        year: response.data.year || new Date().getFullYear(),
        monthIndex: response.data.monthIndex || new Date().getMonth() + 1,
        summary: {
          total_revenue: Number(response.data.summary?.total_revenue) || 0,
          total_quantity: Number(response.data.summary?.total_quantity) || 0,
          total_cartons: Number(response.data.summary?.total_cartons) || 0,
          total_transactions: Number(response.data.summary?.total_transactions) || 0,
        },
        daily_breakdown: dailyBreakdown,
        payment_methods: response.data.payment_methods || [],
      }
    };
  }
  
  // Return empty structure if no data
  const [year, month] = new Date().toISOString().split('T')[0].split('-');
  return {
    success: false,
    message: "No data available",
    data: {
      month: `${year}-${month}`,
      year: parseInt(year),
      monthIndex: parseInt(month),
      summary: {
        total_revenue: 0,
        total_quantity: 0,
        total_cartons: 0,
        total_transactions: 0
      },
      daily_breakdown: [],
      payment_methods: []
    }
  };
};

const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== SALES CRUD ====================
    getAllSale: builder.query<NormalizedSaleResponse, any>({
      query: (query) => ({
        url: "/sales",
        method: "GET",
        params: query,
      }),
      providesTags: ["sale"],
      transformResponse: (response: ISaleApiPaginatedResponse) => {
        console.log("🔍 getAllSale raw response:", response);
        const normalized = normalizeSaleResponse(response);
        console.log("✅ Normalized response:", normalized);
        return normalized;
      },
    }),

    getAllSaleNoPagination: builder.query<NormalizedSaleResponse, any>({
      query: (query) => ({
        url: "/sales",
        method: "GET",
        params: {
          ...query,
          page: 1,
          limit: 10000, // Large limit to get all data
        },
      }),
      providesTags: ["sale"],
      transformResponse: (response: ISaleApiPaginatedResponse) => {
        console.log("🔍 getAllSaleNoPagination raw response:", response);
        return normalizeSaleResponse(response);
      },
    }),

    getSaleById: builder.query({
      query: (id) => ({
        url: `/sales/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "sale", id }],
      transformResponse: (response: any) => {
        return normalizeSaleResponse(response);
      },
    }),

    createSale: builder.mutation({
      query: (payload) => ({
        url: "/sales",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["sale", "product"],
    }),

    updateSale: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/sales/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["sale"],
    }),

    // ==================== PAYMENT MANAGEMENT ====================
    recordRepayment: builder.mutation({
      query: ({ saleId, ...payload }) => ({
        url: `/repayments/repay`,
        method: "POST",
        body: {
          ...payload,
          saleId,
        },
      }),
      invalidatesTags: ["sale"],
    }),

    // ==================== REPORTS & ANALYTICS ====================
    getSalesReport: builder.query<NormalizedSaleResponse, any>({
      query: (params) => ({
        url: `/sales/reports/periodic`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => normalizeSaleResponse(response),
    }),

    getMonthlyReport: builder.query<NormalizedSaleResponse, any>({
      query: (params) => ({
        url: `/sales/reports/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => normalizeSaleResponse(response),
    }),

    // ==================== SPLIT PAYMENT ENDPOINTS ====================
    getSplitPayments: builder.query({
      query: (params) => ({
        url: "/sales/split-payments",
        method: "GET",
        params,
      }),
      providesTags: ["SplitPayment"],
      transformResponse: (response: any) => {
        console.log("💰 Split payments response:", response);
        return response;
      },
    }),

    getSplitPaymentDetails: builder.query({
      query: (saleId) => `/sales/split-payments/${saleId}`,
      providesTags: (result, error, saleId) => [
        { type: "SplitPayment", id: saleId },
      ],
      transformResponse: (response: any) => {
        console.log("💰 Split payment details response:", response);
        return response;
      },
    }),

    getSplitPaymentStats: builder.query({
      query: (params) => ({
        url: "/sales/split-payments/stats",
        method: "GET",
        params,
      }),
      transformResponse: (response: any) => {
        console.log("💰 Split payment stats response:", response);
        return response;
      },
    }),

    // ==================== LEGACY ENDPOINTS ====================
    yearlySale: builder.query({
      query: () => ({
        url: `/sales/yearly-sale`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📅 Yearly sale response:", response);
        return response;
      },
    }),

    monthlySale: builder.query<MonthlyResponse, { month: string }>({
      query: (params) => ({
        url: `/sales/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: normalizeMonthlyResponse,
    }),

    weeklySale: builder.query({
      query: (params) => ({
        url: `/sales/weeks`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📅 Weekly sale response:", response);
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
      query: (params) => {
        console.log('📅 Daily sale API call with params:', params);
        return {
          url: `/sales/daily`,
          method: "GET",
          params,
        };
      },
      providesTags: ["sale"],
      transformResponse: (response: any) => {
        console.log("📅 Daily sale response:", response);
        return response; // Don't transform, keep original structure
      },
    }),

    getAllSaleForExport: builder.query<NormalizedSaleResponse, any>({
      query: (query) => ({
        url: "/sales/export",
        method: "GET",
        params: {
          ...query,
          limit: 10000,
        },
      }),
      providesTags: ["sale"],
      transformResponse: (response: any) => normalizeSaleResponse(response),
    }),
  }),
});

export const {
  // Core endpoints
  useGetAllSaleQuery,
  useLazyGetAllSaleNoPaginationQuery,
  useGetAllSaleForExportQuery,
  useLazyGetAllSaleForExportQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useRecordRepaymentMutation,

  // Reports
  useGetSalesReportQuery,
  useGetMonthlyReportQuery,

  // Split Payments
  useGetSplitPaymentsQuery,
  useGetSplitPaymentDetailsQuery,
  useGetSplitPaymentStatsQuery,

  // Legacy
  useYearlySaleQuery,
  useMonthlySaleQuery,
  useWeeklySaleQuery,
  useDailySaleQuery,
} = saleApi;

export default saleApi;