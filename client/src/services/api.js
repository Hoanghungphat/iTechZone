/**
 * services/api.js
 * Axios instance trung tâm — tất cả request đều đi qua đây
 * Tự động refresh access token khi hết hạn (401) bằng refresh token cookie
 */
import axios from 'axios'
import { STORAGE_KEYS } from '@/constants'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL:         BASE_URL,
  timeout:         15000,
  withCredentials: true,   // ← gửi cookie theo mọi request
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

// ── REQUEST: đính access token ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── RESPONSE: tự refresh khi 401 ────────────────────────────
let isRefreshing = false
let waitQueue    = []   // request đang chờ token mới

function drainQueue(newToken, error) {
  waitQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newToken)
  )
  waitQueue = []
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      // Nếu chính endpoint /refresh bị lỗi → logout ngay
      if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/logout')) {
        clearAndRedirect()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Đang refresh rồi → đẩy request này vào hàng chờ
        return new Promise((resolve, reject) => {
          waitQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing    = true

      try {
        const res      = await api.post('/auth/refresh')   // cookie tự kèm
        const newToken = res?.token || res?.data?.token
        if (!newToken) throw new Error('No token in response')

        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        drainQueue(newToken, null)

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        drainQueue(null, refreshErr)
        clearAndRedirect()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    const message    = error.response?.data?.message || 'Đã xảy ra lỗi'
    const customError = new Error(message)
    customError.status = error.response?.status
    customError.data   = error.response?.data
    return Promise.reject(customError)
  }
)

function clearAndRedirect() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  // Nếu admin/staff đang xem trang chủ → không redirect vào /dang-nhap
  try {
    const adminState = JSON.parse(localStorage.getItem('itechzone_admin') || '{}')
    if (adminState?.state?.token) {
      localStorage.removeItem(STORAGE_KEYS.USER)
      return
    }
  } catch { /* ignore */ }
  localStorage.removeItem(STORAGE_KEYS.USER)
  if (window.location.pathname !== '/dang-nhap') {
    window.location.href = '/dang-nhap'
  }
}

export default api
