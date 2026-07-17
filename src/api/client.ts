import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 8000,
  headers: {'X-API-KEY': import.meta.env.VITE_API_KEY || 'abc123'},
})

export default apiClient