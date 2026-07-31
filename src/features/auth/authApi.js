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
        responseHandler: textOrJsonHandler,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: { email },
        responseHandler: textOrJsonHandler,
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, newPassword }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { token, newPassword },
        responseHandler: textOrJsonHandler,
      }),
    }),
    verifyEmail: builder.query({
      query: (token) => ({
        url: `/auth/verify-email?token=${encodeURIComponent(token)}`,
        responseHandler: textOrJsonHandler,
      }),
    }),
    resendVerification: builder.mutation({
      query: (email) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body: { email },
        responseHandler: textOrJsonHandler,
      }),
    }),
  }),
})

const textOrJsonHandler = async (response) => {
  const text = await response.text()
  if (response.ok) return text
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery,
  useResendVerificationMutation,
} = authApi
