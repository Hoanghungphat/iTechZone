/**
 * services/authService.js
 * Service xác thực — kết nối API thật
 */
import api from './api'
import { STORAGE_KEYS } from '@/constants'

/**
 * Đăng nhập
 * Backend trả: { success, message, data: { user, token } }
 * Interceptor unwrap thành: { success, message, data: { user, token } }
 */
export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password })
  const { user, token } = res.data
  if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  return { user, token }
}

/**
 * Đăng ký
 */
export async function register(userData) {
  const res = await api.post('/auth/register', userData)
  const { user, token } = res.data
  if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  return { user, token }
}

/**
 * Lấy thông tin user hiện tại
 */
export async function getProfile() {
  const res = await api.get('/auth/me')
  return res.data
}

/**
 * Cập nhật profile
 */
export async function updateProfile(data) {
  const res = await api.put('/users/profile', data)
  return res.data
}

/**
 * Đổi mật khẩu
 */
export async function changePassword(data) {
  return api.put('/users/password', data)
}

/**
 * Đăng xuất
 * CHỈ xoá token auth — KHÔNG xoá cart để giỏ hàng vẫn còn khi đăng nhập lại
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  // ⚠️ KHÔNG removeItem(STORAGE_KEYS.CART) — cart được giữ nguyên
}
