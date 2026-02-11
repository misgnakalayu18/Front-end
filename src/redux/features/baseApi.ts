// redux/baseApi.ts
import { BaseQueryApi, BaseQueryFn, DefinitionType, FetchArgs, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../utils/config";
import { logoutUser } from "../services/authSlice";
import { RootState } from "../store";

// Create a custom fetchBaseQuery that handles blob responses
const createCustomBaseQuery = () => {
  return async (args: FetchArgs | string, api: BaseQueryApi, extraOptions: {}) => {
    const baseUrl = config.baseUrl;
    
    // Handle both string URLs and FetchArgs
    const url = typeof args === 'string' ? args : args.url;
    const method = typeof args === 'string' ? 'GET' : (args.method || 'GET');
    const body = typeof args === 'string' ? undefined : args.body;
    const params = typeof args === 'string' ? undefined : args.params;
    const responseHandler = typeof args === 'string' ? undefined : (args as any).responseHandler;
    
    const headers: HeadersInit = {};
    
    // Add authorization token
    const token = (api.getState() as RootState).auth.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Set content type for non-FormData requests
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      const fullUrl = `${baseUrl}${url}${params ? `?${new URLSearchParams(params).toString()}` : ''}`;
      
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        credentials: 'include',
      });
      
      // Handle 401 errors
      if (response.status === 401) {
        api.dispatch(logoutUser());
        localStorage.removeItem('token');
        return {
          error: {
            status: 401,
            data: 'Authentication failed. Please login again.',
          },
        };
      }
      
      // Handle blob responses
      if (responseHandler === 'blob' || response.headers.get('content-type')?.includes('csv') || 
          response.headers.get('content-type')?.includes('excel') || 
          response.headers.get('content-type')?.includes('octet-stream')) {
        
        const blob = await response.blob();
        
        // Check if response is successful
        if (!response.ok) {
          // Try to read error message from blob
          const errorText = await blob.text();
          try {
            const errorJson = JSON.parse(errorText);
            return {
              error: {
                status: response.status,
                data: errorJson,
              },
            };
          } catch {
            return {
              error: {
                status: response.status,
                data: errorText,
              },
            };
          }
        }
        
        return { data: blob };
      }
      
      // Handle JSON responses
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data,
          },
        };
      }
      
      return { data };
      
    } catch (error: any) {
      return {
        error: {
          status: 'FETCH_ERROR',
          error: error.message,
        },
      };
    }
  };
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: createCustomBaseQuery() as BaseQueryFn,
  tagTypes: [
    'product',
    'bulkUpload', 
    'sale', 
    'user',
    'Users',
    'Report',
    'Dashboard',
    'MonthlyReport',
    'YearlyReport',
    'QuickStats',
    'TopProducts',
    'PaymentMethods',
    'Transfer',
    'Stock',
    'Warehouse',
    'SplitPayment',
  ],
  endpoints: () => ({}),
});