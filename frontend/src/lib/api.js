import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Attach JWT from localStorage to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vmtips_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vmtips_token')
      localStorage.removeItem('vmtips_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
