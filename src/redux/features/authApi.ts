import { baseApi } from "./baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (payload) => ({
        url: '/users/login',
        method: 'POST',
        body: payload
      }),
      //invalidatesTags: ['product', 'sale', 'user']
    }),

    register: builder.mutation({
      query: (payload) => ({
        url: '/users/register',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['product', 'sale', 'user']
    }),

    getSelfProfile: builder.query({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      providesTags: ['user']
    }),

    changePassword: builder.mutation({
      query: (payload) => ({
        url: '/users/change-password',
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

    updateProfile: builder.mutation({
      query: (payload) => ({
        url: '/users/profile-update',
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

  })
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetSelfProfileQuery,
  useChangePasswordMutation,
  useUpdateProfileMutation
} = authApi