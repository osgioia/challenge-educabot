export const config = {
  port: Number(process.env.PORT) || 3000,
  apiUrl: process.env.API_URL || 'https://6781684b85151f714b0aa5db.mockapi.io/api/v1/books',
  nodeEnv: process.env.NODE_ENV || 'development',
}