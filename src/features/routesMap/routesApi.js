import { apiSlice } from "../../api/apiSlice"

export const routesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRoutes: builder.query({
      query: ({ page = 0, size = 20 } = {}) =>
        `/routes/my?page=${page}&size=${size}`,
      providesTags: ["Route"],
    }),
    getRouteById: builder.query({
      query: (routeId) => `/routes/${routeId}`,
      providesTags: (result, error, routeId) => [
        { type: "Route", id: routeId },
      ],
    }),
    createRoute: builder.mutation({
      query: (body) => ({
        url: "/routes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Route"],
    }),
    deleteRoute: builder.mutation({
      query: (routeId) => ({
        url: `/routes/${routeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Route"],
    }),
    setImportable: builder.mutation({
      query: ({ routeId, value }) => ({
        url: `/routes/${routeId}/importable?value=${value}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Route"],
    }),
    importRoute: builder.mutation({
      query: (routeId) => ({
        url: `/routes/${routeId}/import`,
        method: "POST",
      }),
      invalidatesTags: ["Route"],
    }),
  }),
})

export const {
  useGetMyRoutesQuery,
  useGetRouteByIdQuery,
  useCreateRouteMutation,
  useDeleteRouteMutation,
  useSetImportableMutation,
  useImportRouteMutation,
} = routesApi
