/**
 * services/adminService.js — Tất cả API calls cho admin panel
 */
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

export const adminLogin    = (email, password) => adminApi.post('/login', { email, password })
export const getDashboard  = () => adminApi.get('/dashboard')

// Products
export const getProducts   = (params) => adminApi.get('/products', { params })
export const createProduct = (data)   => adminApi.post('/products', data)
export const updateProduct = (id, d)  => adminApi.put(`/products/${id}`, d)
export const deleteProduct = (id, note) => adminApi.delete(`/products/${id}`, { data: { note } })

// Users
export const getUsers      = (params) => adminApi.get('/users', { params })
export const updateUserAdmin = (id, d) => adminApi.put(`/users/${id}`, d)
export const toggleUserActive = (id)  => adminApi.patch(`/users/${id}/toggle`)
export const deleteUserAdmin  = (id)  => adminApi.delete(`/users/${id}`)
export const resetUserPassword = (id, newPassword, note) =>
  adminApi.post(`/users/${id}/reset-password`, { newPassword, note })

// Staff
export const getStaff      = ()       => adminApi.get('/staff')
export const createStaff   = (data)   => adminApi.post('/staff', data)
export const deleteStaff   = (id)     => adminApi.delete(`/staff/${id}`)

// Orders
export const getOrders        = (params)       => adminApi.get('/orders', { params })
export const updateOrderStatus = (id, status, version) => adminApi.patch(`/orders/${id}/status`, { status, version })

// Requests
export const getRequests    = (params)      => adminApi.get('/requests', { params })
export const approveRequest = (id, note)    => adminApi.patch(`/requests/${id}/approve`, { reviewNote: note })
export const rejectRequest  = (id, note)    => adminApi.patch(`/requests/${id}/reject`,  { reviewNote: note })

// Activity Logs
export const getLogs = (params) => adminApi.get('/logs', { params })

// Password Reset Requests
export const getPasswordResets       = (params)             => adminApi.get('/password-resets', { params })
export const completePasswordReset   = (id, tempPassword)   => adminApi.post(`/password-resets/${id}/complete`, { tempPassword })
export const cancelPasswordReset     = (id)                 => adminApi.post(`/password-resets/${id}/cancel`)
export const getStaffPasswordResets  = (params)             => adminApi.get('/password-resets/staff-view', { params })
