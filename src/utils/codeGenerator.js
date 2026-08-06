export const generateAccessCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()
