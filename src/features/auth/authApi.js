import { apiSlice } from "../../api/apiSlice"

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (newUser) => ({
        url: "/auth/register",
        method: "POST",
        body: newUser,
        responseHandler: "text",
      }),
    }),
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, newPassword }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { token, newPassword },
      }),
    }),
    verifyEmail: builder.query({
      query: (token) => ({
        url: `/auth/verify-email?token=${encodeURIComponent(token)}`,
        responseHandler: "text",
      }),
    }),
    resendVerification: builder.mutation({
      query: (email) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body: { email },
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery,
  useResendVerificationMutation,
} = authApi
