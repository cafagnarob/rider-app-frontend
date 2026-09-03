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
        category,
        minCc,
        maxCc,
        page = 0,
        size = 20,
        orderBy = "name",
      } = {}) => {
        const params = new URLSearchParams({ page, size, orderBy })
        if (brandId) params.append("brandId", brandId)
        if (name) params.append("name", name)
        if (category) params.append("category", category)
        if (minCc) params.append("minCc", minCc)
        if (maxCc) params.append("maxCc", maxCc)
        return `/motorcycle-models?${params.toString()}`
      },
      providesTags: ["Model"],
    }),
    getModelById: builder.query({
      query: (modelId) => `/motorcycle-models/${modelId}`,
    }),
  }),
})

export const { useGetBrandsQuery, useGetModelsQuery, useGetModelByIdQuery } =
  catalogApi
