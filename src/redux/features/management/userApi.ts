import { baseApi } from "../baseApi";

const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => ({
        url: '/manage-users',
        method: 'GET',
      }),
      providesTags: ['Users'],
    }),

    getSingleUser: builder.query({
      query: (id: string) => ({
        url: `/manage-users/${id}`,
        method: 'GET',
      }),
      providesTags: ['Users'],
    }),

    createUser: builder.mutation({
      query: (userData) => ({
        url: '/manage-users/',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/manage-users/${id}`,
        method: 'PATCH', // Use PATCH instead of PUT for partial updates
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),

    deleteUser: builder.mutation({
      query: (id: string) => ({
        url: `/manage-users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    updateUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/manage-users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetSingleUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
} = userApi;