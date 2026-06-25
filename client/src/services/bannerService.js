/**
 * services/bannerService.js
 */
import api from './api'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const adminApi = axios.create({ baseURL: BASE + '/admin', timeout: 15000 })
adminApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('itechzone_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
adminApi.interceptors.response.use(r => r.data, err => {
  const msg = err.response?.data?.message || 'Lỗi kết nối'
  return Promise.reject(new Error(msg))
})

export const getPublicBanners = ()         => api.get('/banners')
export const getAdminBanners  = ()         => adminApi.get('/banners')
export const createBanner     = (data)     => adminApi.post('/banners', data)
export const updateBanner     = (id, data) => adminApi.put(`/banners/${id}`, data)
export const deleteBanner     = (id)       => adminApi.delete(`/banners/${id}`)
