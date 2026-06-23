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
  try {
    const res = await api.post('/auth/login', { email, password })
    const { user, token } = res.data
    if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    return { user, token }
  } catch (err) {
    const data = err.response?.data
    const error = new Error(data?.message || err.message || 'Lỗi kết nối')
    error.code  = data?.code
    error.email = data?.email
    throw error
  }
}

/**
 * Đăng ký
 */
export async function register(userData) {
  const res = await api.post('/auth/register', userData)
  // Backend giờ trả về { message, email } — không có token (cần xác minh email trước)
  return res.data
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

/** Xác minh email sau đăng ký */
export async function verifyEmail(email, otp) {
  const res = await api.post('/auth/verify-email', { email, otp })
  const { user, token } = res.data
  if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  return { user, token }
}

/** Gửi lại OTP xác minh email */
export async function resendVerifyOtp(email) {
  return api.post('/auth/resend-verify-otp', { email })
}

/** Quên mật khẩu — gửi OTP */
export async function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email })
}

/** Xác minh OTP quên mật khẩu */
export async function verifyForgotOtp(email, otp) {
  return api.post('/auth/verify-otp', { email, otp })
}

/** Đặt lại mật khẩu mới */
export async function resetPassword(email, otp, newPassword) {
  return api.post('/auth/reset-password', { email, otp, newPassword })
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
