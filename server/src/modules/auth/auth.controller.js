/**
 * src/modules/auth/auth.controller.js
 */
import {
  register, login, getMe,
  verifyEmail, resendVerifyOtp,
  forgotPassword, verifyForgotOtp, resetPassword,
} from './auth.service.js'
import { successResponse } from '../../core/utils/response.js'

export async function registerController(req, res, next) {
  try {
    const { name, email, phone, password } = req.body
    const result = await register({ name, email, phone, password })
    return successResponse(res, result, result.message, 201)
  } catch (err) { next(err) }
}

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await login({ email, password })
    return successResponse(res, result, 'Đăng nhập thành công')
  } catch (err) {
    // Trả thêm code + email để frontend biết chuyển sang trang xác minh
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({ success: false, message: err.message, code: err.code, email: err.email })
    }
    next(err)
  }
}

export async function getMeController(req, res, next) {
  try {
    const user = await getMe(req.user.id)
    return successResponse(res, user)
  } catch (err) { next(err) }
}

export async function verifyEmailController(req, res, next) {
  try {
    const { email, otp } = req.body
    const result = await verifyEmail({ email, otp })
    return successResponse(res, result, 'Xác minh email thành công!')
  } catch (err) { next(err) }
}

export async function resendVerifyOtpController(req, res, next) {
  try {
    const { email } = req.body
    const result = await resendVerifyOtp(email)
    return successResponse(res, result, result.message)
  } catch (err) { next(err) }
}

export async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body
    const result = await forgotPassword(email)
    return successResponse(res, result, result.message)
  } catch (err) { next(err) }
}

export async function verifyForgotOtpController(req, res, next) {
  try {
    const { email, otp } = req.body
    const result = await verifyForgotOtp({ email, otp })
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export async function resetPasswordController(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body
    const result = await resetPassword({ email, otp, newPassword })
    return successResponse(res, result, result.message)
  } catch (err) { next(err) }
}
