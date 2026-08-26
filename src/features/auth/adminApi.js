import { apiSlice } from "../../api/apiSlice"

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query({
      query: ({ page = 0, size = 20, orderBy = "createdAt" } = {}) =>
        `/admin/users?page=${page}&size=${size}&orderBy=${orderBy}`,
      providesTags: ["AdminUser"],
    }),
    deactivateAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminUser"],
    }),
    reactivateAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminUser"],
    }),

    createAdminBrand: builder.mutation({
      query: ({ name, logo }) => {
        const formData = new FormData()
        formData.append("name", name)
        formData.append("logo", logo)
        return { url: "/admin/brands", method: "POST", body: formData }
      },
    }),
    createAdminModel: builder.mutation({
      query: ({ data, image }) => {
        const formData = new FormData()
        formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" }),
        )
        if (image) formData.append("image", image)
        return {
          url: "/admin/motorcycle-models",
          method: "POST",
          body: formData,
        }
      },
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useDeactivateAdminUserMutation,
  useReactivateAdminUserMutation,
  useCreateAdminBrandMutation,
  useCreateAdminModelMutation,
} = adminApi
