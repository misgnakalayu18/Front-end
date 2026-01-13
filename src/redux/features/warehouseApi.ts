// src/redux/features/warehouseApi.ts
import { baseApi } from './baseApi';

export const warehouseApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all products with warehouse quantities
        getProducts: builder.query({
            query: (params) => ({
                url: '/products',
                method: 'GET',
                params, // For pagination/filtering if needed
            }),
            providesTags: ['product', 'Stock', 'Transfer'],
        }),

        // Get specific product stock information
        getProductStock: builder.query({
            query: (product_id) => ({
                url: `/warehouse/stock/product/${product_id}`,
                method: 'GET',
            }),
            providesTags: (result, error, product_id) => [
                { type: 'Stock', id: product_id },
                { type: 'product', id: product_id }
            ],
        }),

        // Create transfer
        createTransfer: builder.mutation({
            query: (transferData) => ({
                url: '/warehouse/transfers',
                method: 'POST',
                body: transferData,
            }),
            invalidatesTags: ['Transfer', 'Stock', 'Warehouse', 'product', 'Dashboard'],
        }),

        // Quick transfer (create and complete in one step)
        quickTransfer: builder.mutation({
            query: (transferData) => ({
                url: '/warehouse/transfers/quick',
                method: 'POST',
                body: transferData,
            }),
            invalidatesTags: ['Transfer', 'Stock', 'Warehouse', 'product', 'Dashboard'],
        }),

        // Get transfers with filters
        getTransfers: builder.query({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();
                
                // Add all non-empty params to query
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        queryParams.append(key, String(value));
                    }
                });

                const queryString = queryParams.toString();
                return {
                    url: `/warehouse/transfers${queryString ? `?${queryString}` : ''}`,
                    method: 'GET',
                };
            },
            providesTags: (result) =>
                result?.transfers
                    ? [
                        ...result.transfers.map(({ id }: any) => ({ type: 'Transfer' as const, id })),
                        { type: 'Transfer', id: 'LIST' },
                    ]
                    : [{ type: 'Transfer', id: 'LIST' }],
        }),

        // Get single transfer
        getTransfer: builder.query({
            query: (id) => ({
                url: `/warehouse/transfers/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Transfer', id }],
        }),

        // Complete transfer
        completeTransfer: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/warehouse/transfers/${id}/complete`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transfer', 'Stock', 'Warehouse', 'product', 'Dashboard'],
        }),

        // Cancel transfer
        cancelTransfer: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/warehouse/transfers/${id}/cancel`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transfer', 'Dashboard'],
        }),

        // Update stock (adjustment)
        updateStock: builder.mutation({
            query: (stockData) => ({
                url: '/warehouse/stock/update',
                method: 'POST',
                body: stockData,
            }),
            invalidatesTags: ['Stock', 'product', 'Warehouse', 'Dashboard'],
        }),

        // Get warehouse stock
        getWarehouseStock: builder.query({
            query: (params = {}) => {
                const { warehouse, lowStockOnly, page, limit, ...otherParams } = params;
                const queryParams = new URLSearchParams();
                
                if (warehouse) queryParams.append('warehouse', warehouse);
                if (lowStockOnly !== undefined) queryParams.append('lowStockOnly', String(lowStockOnly));
                if (page) queryParams.append('page', String(page));
                if (limit) queryParams.append('limit', String(limit));
                
                // Add any other params
                Object.entries(otherParams).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        queryParams.append(key, String(value));
                    }
                });

                const queryString = queryParams.toString();
                return {
                    url: `/warehouse/stock/warehouse${queryString ? `?${queryString}` : ''}`,
                    method: 'GET',
                };
            },
            providesTags: ['Stock', 'Warehouse', 'product'],
        }),

        // Get dashboard data
        getDashboardData: builder.query({
            query: (params = {}) => ({
                url: '/warehouse/dashboard',
                method: 'GET',
                params, // Pass any optional params
            }),
            providesTags: ['Dashboard', 'Transfer', 'Stock', 'product'],
        }),

        // Get transfer statistics - make it accept optional params
        getTransferStats: builder.query({
            query: (params = {}) => {
                const { timeframe = 'month', ...otherParams } = params || {};
                return {
                    url: '/warehouse/stats',
                    method: 'GET',
                    params: { timeframe, ...otherParams },
                };
            },
            providesTags: ['Dashboard', 'Transfer'],
        }),

        // Get low stock products - make it accept optional params
        getLowStockProducts: builder.query({
            query: (params = {}) => {
                const { threshold = 10, page = 1, limit = 20, ...otherParams } = params || {};
                const queryParams = new URLSearchParams();
                
                queryParams.append('threshold', String(threshold));
                queryParams.append('page', String(page));
                queryParams.append('limit', String(limit));

                // Add any other params
                Object.entries(otherParams).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        queryParams.append(key, String(value));
                    }
                });

                return {
                    url: `/warehouse/low-stock${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
                    method: 'GET',
                };
            },
            providesTags: ['Stock', 'product'],
        }),

        // Get warehouse performance - make it accept optional params
        getWarehousePerformance: builder.query({
            query: (params = {}) => {
                const { timeframe = 'month', ...otherParams } = params || {};
                return {
                    url: '/warehouse/warehouse-performance',
                    method: 'GET',
                    params: { timeframe, ...otherParams },
                };
            },
            providesTags: ['Dashboard', 'Warehouse', 'Transfer'],
        }),

        // Get transfer timeline
        getTransferTimeline: builder.query({
            query: (id) => ({
                url: `/warehouse/transfer-timeline/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Transfer', id }],
        }),

        // Check stock availability
        checkStockAvailability: builder.query({
            query: ({ product_id, warehouse, cartons }) => {
                const queryParams = new URLSearchParams();
                queryParams.append('product_id', String(product_id));
                queryParams.append('warehouse', warehouse);
                queryParams.append('cartons', String(cartons));
                
                return {
                    url: `/warehouse/stock/check?${queryParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Stock'],
        }),

        // Get warehouse summary
        getWarehouseSummary: builder.query({
            query: (warehouse) => ({
                url: `/warehouse/summary/${warehouse}`,
                method: 'GET',
            }),
            providesTags: ['Warehouse', 'Stock'],
        }),

        // Search transfers
        searchTransfers: builder.query({
            query: (params) => {
                const { query, field = 'all', page = 1, limit = 10 } = params;
                const searchParams = new URLSearchParams();
                
                searchParams.append('query', query);
                searchParams.append('field', field);
                searchParams.append('page', String(page));
                searchParams.append('limit', String(limit));

                return {
                    url: `/warehouse/transfers/search?${searchParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Transfer'],
        }),

        // Get product transfer history
        getProductTransferHistory: builder.query({
            query: ({ product_id, page = 1, limit = 10 }) => ({
                url: `/warehouse/product/${product_id}/transfers`,
                method: 'GET',
                params: { page, limit },
            }),
            providesTags: (result, error, { product_id }) => [
                { type: 'Transfer', id: 'PRODUCT_HISTORY' },
                { type: 'product', id: product_id }
            ],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductStockQuery,
    useCreateTransferMutation,
    useQuickTransferMutation,
    useGetTransfersQuery,
    useGetTransferQuery,
    useCompleteTransferMutation,
    useCancelTransferMutation,
    useUpdateStockMutation,
    useGetWarehouseStockQuery,
    useGetDashboardDataQuery,
    useGetTransferStatsQuery,
    useGetLowStockProductsQuery,
    useGetWarehousePerformanceQuery,
    useGetTransferTimelineQuery,
    useCheckStockAvailabilityQuery,
    useGetWarehouseSummaryQuery,
    useSearchTransfersQuery,
    useGetProductTransferHistoryQuery,
    useLazyGetProductsQuery,
    useLazyGetWarehouseStockQuery,
    useLazyGetTransfersQuery,
    useLazyCheckStockAvailabilityQuery,
} = warehouseApi;