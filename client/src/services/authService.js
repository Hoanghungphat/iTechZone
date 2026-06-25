/**
 * services/authService.js
 * Service xác thực — kết nối API thật
 */
import api from './api'
import { STORAGE_KEYS } from '@/constants'

export async function login(email, password, rememberMe = false) {
  const res = await api.post('/auth/login', { email, password, rememberMe })
  const { user, token } = res.data ?? res
  if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  return { user, token }
}

export async function register(userData) {
  const res = await api.post('/auth/register', userData)
  const { user, token } = res.data ?? res
  if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  return { user, token }
}

export async function getProfile() {
  const res = await api.get('/auth/me')
  return res.data ?? res
}

export async function updateProfile(data) {
  const res = await api.put('/users/profile', data)
  return res.data ?? res
}

export async function changePassword(data) {
  return api.put('/users/password', data)
}

/** Đăng xuất: xoá localStorage + clear cookie refresh token */
export async function logout() {
  try { await api.post('/auth/logout') } catch { /* ignore */ }
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}
