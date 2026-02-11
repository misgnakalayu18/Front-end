import { baseApi } from "../baseApi";

const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (query) => ({
        url: '/products',
        method: 'GET',
        params: query
      }),
      providesTags: ['product']
    }),

    countProducts: builder.query({
      query: () => ({
        url: '/products/count-total',
        method: 'GET'
      }),
      providesTags: ['product']
    }),

    getSingleProduct: builder.query({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET'
      }),
      providesTags: ['product']
    }),

    createNewProduct: builder.mutation({
      query: (payload) => ({
        url: '/products',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['product']
    }),

    updateProduct: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['product']
    }),

    // UPDATED: Add stock with comprehensive payload
    addStock: builder.mutation({
      query: ({ id, ...payload }) => {
        console.log('📤 API Request - Add Stock:', { id, payload });
        
        return {
          url: `/products/${id}`,
          method: 'PATCH', // Using PUT to update the whole product
          body: payload
        };
      },
      invalidatesTags: ['product']
    }),

    // ALTERNATIVE: If you have a dedicated add-stock endpoint
    addStockV2: builder.mutation({
      query: ({ id, qty, ctn, warehouse }) => {
        
        return {
          url: `/products/${id}/add`,
          method: 'PATCH',
          body: { 
            qty, 
            ctn,
            warehouse
          }
        };
      },
      invalidatesTags: ['product']
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['product']
    }),

    // bulkDelete: builder.mutation({
    //   query: (payload) => ({
    //     url: '/products/bulk-delete',
    //     method: 'POST',
    //     body: payload
    //   }),
    //   invalidatesTags: ['product']
    // }),

    // bulkUpload: builder.mutation({
    //   query: (formData) => ({
    //     url: '/upload-products/upload',
    //     method: 'POST',
    //     body: formData,
    //     headers: {},
    //   }),
    //   invalidatesTags: ['product']
    // }),

    // getBulkUploadHistory: builder.query({
    //   query: () => ({
    //     url: '/upload-products/history',
    //     method: 'GET'
    //   }),
    //   providesTags: ['bulkUpload']
    // }),

    getLowStockProducts: builder.query({
      query: (threshold?: number) => ({
        url: '/products/low-stock',
        method: 'GET',
        params: threshold ? { threshold } : {}
      }),
      providesTags: ['product']
    })
  })
})

export const {
  useGetAllProductsQuery,
  useCountProductsQuery,
  useCreateNewProductMutation,
  useDeleteProductMutation,
  useGetSingleProductQuery,
  useUpdateProductMutation,
  useAddStockMutation,
  useAddStockV2Mutation,
  useGetLowStockProductsQuery
} = productApi;