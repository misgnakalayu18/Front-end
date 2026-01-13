// redux/features/management/bulkUploadApi.ts
import { baseApi } from '../baseApi';

// Updated to match backend response
export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    successfulRows: number; // Changed from processedRows to successfulRows
    failedRows: number;
    errors: string[];
    warnings?: string[]; // Added warnings
  };
}

export interface ValidateTemplateResponse {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    headers: string[];
    sampleRows: any[];
    requiredFields: string[];
    fieldDescriptions: Record<string, string>;
  };
}

export interface BulkUploadHistory {
  success: boolean;
  message: string;
  data: {
    history: Array<{ // Changed from 'uploads' to 'history'
      id: number;
      user_id: number;
      filename: string;
      total_rows: number;
      successful_rows: number;
      failed_rows: number;
      errors: string | null;
      warnings: string | null;
      created_at: string;
      updated_at: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface DownloadTemplateParams {
  format?: 'csv' | 'excel';
}

export const bulkUploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Upload products file - updated URL
    bulkUpload: builder.mutation<BulkUploadResponse, FormData>({
      query: (formData) => ({
        url: '/upload-products/upload', // Updated URL
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it for FormData
        },
      }),
      invalidatesTags: ['product', 'bulkUpload'],
    }),

    // Validate template - updated URL
    validateTemplate: builder.mutation<ValidateTemplateResponse, FormData>({
      query: (formData) => ({
        url: '/upload-products/validate', // Updated URL
        method: 'POST',
        body: formData,
      }),
    }),

    // Get upload history - updated URL
    getUploadHistory: builder.query<BulkUploadHistory, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/upload-products/history', // Updated URL
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['bulkUpload'],
    }),

    // Get single upload details - updated URL
    getUploadDetails: builder.query<{ success: boolean; data: any }, number>({
      query: (uploadId) => ({
        url: `/upload-products/history/${uploadId}`, // Updated URL
        method: 'GET',
      }),
      providesTags: (result, error, uploadId) => [
        { type: 'bulkUpload', id: uploadId }
      ],
    }),

    // Download template with format parameter
    downloadTemplate: builder.mutation<Blob, DownloadTemplateParams>({
      query: ({ format = 'csv' } = {}) => ({
        url: '/upload-products/template', // Updated URL
        method: 'GET',
        params: { format },
        responseHandler: (response) => response.blob(),
        cache: 'no-cache',
      }),
      transformResponse: (response: Blob) => response,
    }),

    // Health check endpoint
    healthCheck: builder.query<{
      success: boolean;
      message: string;
      data: {
        timestamp: string;
        endpoints: Record<string, string>;
      }
    }, void>({
      query: () => ({
        url: '/bulk-upload/upload/health',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useBulkUploadMutation,
  useValidateTemplateMutation,
  useGetUploadHistoryQuery,
  useGetUploadDetailsQuery,
  useDownloadTemplateMutation,
  useHealthCheckQuery,
} = bulkUploadApi;