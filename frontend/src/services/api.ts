import axios, { isAxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kepler_token')

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

export { isAxiosError }
