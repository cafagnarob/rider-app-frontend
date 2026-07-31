import { apiSlice } from "../../api/apiSlice"

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query({
      query: () => "/brands",
      providesTags: ["Brand"],
    }),
    getModels: builder.query({
      query: ({
        brandId,
        name,
        page = 0,
        size = 20,
        orderBy = "name",
      } = {}) => {
        const params = new URLSearchParams({ page, size, orderBy })
        if (brandId) params.append("brandId", brandId)
        if (name) params.append("name", name)
        return `/motorcycle-models?${params.toString()}`
      },
      providesTags: ["Model"],
    }),
  }),
})

export const { useGetBrandsQuery, useGetModelsQuery } = catalogApi
