// src/lib/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptors para logging
api.interceptors.request.use((config) => {
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    console.error(`❌ ${error.config?.url} - ${error.message}`)
    return Promise.reject(error)
  }
)