import { baseApi } from "../baseApi";
import {
  NormalizedSaleResponse,
  ISaleApiResponse,
} from "../../../types/sale.type";

// ✅ SIMPLIFIED NORMALIZATION - Based on your actual API structure
const normalizeSaleResponse = (response: any): NormalizedSaleResponse => {
  console.log("🔍 API Response Structure:", {
    responseSuccess: response?.success,
    hasData: !!response?.data,
    dataKeys: response?.data ? Object.keys(response.data) : [],
    hasSales: !!response?.data?.sales,
    salesCount: Array.isArray(response?.data?.sales)
      ? response.data.sales.length
      : 0,
    hasMeta: !!response?.data?.meta,
  });

  // ✅ Case 1: response.data.data.sales (Your actual structure)
  if (response?.data?.data?.sales && Array.isArray(response.data.data.sales)) {
    const sales = response.data.data.sales as ISaleApiResponse[];
    return {
      success: response.success || true,
      data: {
        sales,
        total: response.data.data.total || sales.length,
        page: response.data.data.page || 1,
        pages:
          response.data.data.pages ||
          Math.ceil(sales.length / (response.data.data.limit || 10)),
        limit: response.data.data.limit || 10,
      },
    };
  }

  // ✅ Case 2: response.data.sales (Simplified structure)
  else if (response?.data?.sales && Array.isArray(response.data.sales)) {
    const sales = response.data.sales as ISaleApiResponse[];
    return {
      success: response.success || true,
      data: {
        sales,
        total: response.data.total || sales.length,
        page: response.data.page || 1,
        pages:
          response.data.pages ||
          Math.ceil(sales.length / (response.data.limit || 10)),
        limit: response.data.limit || 10,
      },
    };
  }

  // ✅ Case 3: Direct sales array in response.data
  else if (response?.data && Array.isArray(response.data)) {
    const sales = response.data as ISaleApiResponse[];
    return {
      success: response.success || true,
      data: {
        sales,
        total: sales.length,
        page: 1,
        pages: 1,
        limit: sales.length,
      },
    };
  }

  // ✅ Case 4: response.sales (Legacy structure)
  else if (response?.sales && Array.isArray(response.sales)) {
    const sales = response.sales as ISaleApiResponse[];
    return {
      success: response.success || true,
      data: {
        sales,
        total: response.total || sales.length,
        page: response.page || 1,
        pages:
          response.pages || Math.ceil(sales.length / (response.limit || 10)),
        limit: response.limit || 10,
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
    },
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
      transformResponse: normalizeSaleResponse,
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
      transformResponse: normalizeSaleResponse,
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
      transformResponse: normalizeSaleResponse,
    }),

    getMonthlyReport: builder.query<NormalizedSaleResponse, any>({
      query: (params) => ({
        url: `/sales/reports/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: normalizeSaleResponse,
    }),

    // ==================== LEGACY ENDPOINTS (Keep for backward compatibility) ====================
    yearlySale: builder.query({
      query: () => ({
        url: `/sales/yearly-sale`,
        method: "GET",
      }),
      providesTags: ["sale"],
      transformResponse: normalizeSaleResponse,
    }),

    monthlySale: builder.query({
      query: (params) => ({
        url: `/sales/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["sale"],
      transformResponse: normalizeSaleResponse,
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

    getSplitPayments: builder.query({
      query: (params) => ({
        url: "/sales/split-payments",
        method: "GET",
        params,
      }),
      providesTags: ["SplitPayment"],
    }),

    // Get split payment details
    getSplitPaymentDetails: builder.query({
      query: (saleId) => `/sales/split-payments/${saleId}`,
      providesTags: (result, error, saleId) => [
        { type: "SplitPayment", id: saleId },
      ],
    }),

    // Get split payment statistics
    getSplitPaymentStats: builder.query({
      query: (params) => ({
        url: "/sales/split-payments/stats",
        method: "GET",
        params,
      }),
    }),

    getAllSaleForExport: builder.query<NormalizedSaleResponse, any>({
      query: (query) => ({
        url: "/sales/export", // Separate endpoint optimized for exports
        method: "GET",
        params: {
          ...query,
          limit: 10000, // Reasonable limit
        },
      }),
      providesTags: ["sale"],
      transformResponse: normalizeSaleResponse,
    }),
  }),
});

export const {
  // Core endpoints
  useGetAllSaleQuery,
  useLazyGetAllSaleNoPaginationQuery, // ✅ Add this line
  useGetAllSaleForExportQuery,
  useLazyGetAllSaleForExportQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useRecordRepaymentMutation,

  // Reports
  useGetSalesReportQuery,
  useGetMonthlyReportQuery,

  // Legacy
  useYearlySaleQuery,
  useMonthlySaleQuery,
  //   // Legacy period queries
  //   useYearlySaleQuery,
  //   useMonthlySaleQuery,
  useWeeklySaleQuery,
  useDailySaleQuery,
  // Split Payments
  useGetSplitPaymentsQuery,
  useGetSplitPaymentDetailsQuery,
  useGetSplitPaymentStatsQuery,
} = saleApi;

export default saleApi;
