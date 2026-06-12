import axios from 'axios'

// Cookie helpers
function setCookie(name, value, days) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

// Store in both localStorage (fast) and cookie (persistent across browser restarts)
export function saveAuth(data) {
  localStorage.setItem('vmtips_token', data.token)
  localStorage.setItem('vmtips_user', JSON.stringify(data))
  setCookie('vmtips_token', data.token, 30)
  setCookie('vmtips_user', encodeURIComponent(JSON.stringify(data)), 30)
}

export function getToken() {
  return localStorage.getItem('vmtips_token') || getCookie('vmtips_token')
}

export function getSavedUser() {
  const ls = localStorage.getItem('vmtips_user')
  if (ls) return JSON.parse(ls)
  const cookie = getCookie('vmtips_user')
  if (cookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie))
      // Restore to localStorage
      localStorage.setItem('vmtips_user', JSON.stringify(parsed))
      localStorage.setItem('vmtips_token', parsed.token)
      return parsed
    } catch { return null }
  }
  return null
}

export function clearAuth() {
  localStorage.removeItem('vmtips_token')
  localStorage.removeItem('vmtips_user')
  localStorage.removeItem('vmtips_group')
  deleteCookie('vmtips_token')
  deleteCookie('vmtips_user')
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use(cfg => {
  const token = getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
